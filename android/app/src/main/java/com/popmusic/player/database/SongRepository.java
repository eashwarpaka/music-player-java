package com.popmusic.player.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import org.json.JSONObject;

/**
 * SongRepository - High-performance database operations for songs, playlists,
 * favorites, albums, artists, folders, and history.
 */
public class SongRepository {

    private static final String TAG = "SongRepository";
    private final OnagakuDatabaseHelper dbHelper;

    public SongRepository(Context context) {
        this.dbHelper = OnagakuDatabaseHelper.getInstance(context);
    }

    /**
     * Upsert a list of scanned MediaStore songs into SQLite.
     * Preserves existing is_favorite, play_count, and last_played_at states.
     */
    public void upsertSongs(JSArray songsArray) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        db.beginTransaction();
        try {
            for (int i = 0; i < songsArray.length(); i++) {
                JSONObject song = songsArray.getJSONObject(i);
                String id = song.optString("id");
                if (id == null || id.isEmpty()) continue;

                ContentValues cv = new ContentValues();
                cv.put("id", id);
                cv.put("title", song.optString("title", "Unknown Title"));
                cv.put("artist", song.optString("artist", "Unknown Artist"));
                cv.put("album", song.optString("album", "Unknown Album"));
                cv.put("album_id", song.optString("albumId", "0"));
                cv.put("duration", song.optString("duration", "0:00"));
                cv.put("duration_seconds", song.optInt("durationSeconds", 0));
                cv.put("duration_ms", song.optLong("durationMs", 0));
                cv.put("file_path", song.optString("filePath", ""));
                cv.put("content_uri", song.optString("contentUri", ""));
                cv.put("album_art_uri", song.optString("albumArtUri", ""));
                cv.put("mime_type", song.optString("mimeType", "audio/mpeg"));
                cv.put("size", song.optLong("size", 0));
                cv.put("date_added", song.optLong("dateAdded", 0));
                cv.put("track", song.optInt("track", 0));
                cv.put("year", song.optInt("year", 0));
                cv.put("folder_name", song.optString("folderName", "Unknown Folder"));

                db.insertWithOnConflict("songs", null, cv, SQLiteDatabase.CONFLICT_IGNORE);
                // Update track metadata if it already exists
                db.update("songs", cv, "id = ?", new String[]{ id });
            }
            db.setTransactionSuccessful();
            Log.d(TAG, "upsertSongs complete: " + songsArray.length() + " songs processed");
        } catch (Exception e) {
            Log.e(TAG, "upsertSongs error", e);
        } finally {
            db.endTransaction();
        }
    }

    /**
     * Retrieve paginated list of songs.
     */
    public JSObject getSongs(int offset, int limit) {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        JSArray songs = new JSArray();
        int total = 0;

        Cursor countCursor = db.rawQuery("SELECT COUNT(*) FROM songs", null);
        if (countCursor.moveToFirst()) {
            total = countCursor.getInt(0);
        }
        countCursor.close();

        String query = "SELECT * FROM songs ORDER BY title ASC LIMIT ? OFFSET ?";
        Cursor cursor = db.rawQuery(query, new String[]{ String.valueOf(limit), String.valueOf(offset) });
        try {
            while (cursor.moveToNext()) {
                songs.put(cursorToSongObject(cursor));
            }
        } finally {
            cursor.close();
        }

        JSObject result = new JSObject();
        result.put("songs", songs);
        result.put("total", total);
        return result;
    }

    /**
     * Search songs by title, artist, or album.
     */
    public JSArray search(String queryStr) {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        JSArray results = new JSArray();
        String q = "%" + queryStr.trim().toLowerCase() + "%";

        String query = "SELECT * FROM songs WHERE LOWER(title) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(album) LIKE ? ORDER BY title ASC LIMIT 100";
        Cursor cursor = db.rawQuery(query, new String[]{ q, q, q });
        try {
            while (cursor.moveToNext()) {
                results.put(cursorToSongObject(cursor));
            }
        } finally {
            cursor.close();
        }
        return results;
    }

    /**
     * Favorite management.
     */
    public void setFavorite(String songId, boolean isFav) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("is_favorite", isFav ? 1 : 0);
        db.update("songs", cv, "id = ?", new String[]{ songId });
    }

    public JSArray getFavorites() {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        JSArray results = new JSArray();
        Cursor cursor = db.rawQuery("SELECT * FROM songs WHERE is_favorite = 1 ORDER BY title ASC", null);
        try {
            while (cursor.moveToNext()) {
                results.put(cursorToSongObject(cursor));
            }
        } finally {
            cursor.close();
        }
        return results;
    }

    /**
     * Playlist management.
     */
    public long createPlaylist(String name) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("name", name.trim());
        cv.put("created_at", System.currentTimeMillis());
        return db.insertWithOnConflict("playlists", null, cv, SQLiteDatabase.CONFLICT_IGNORE);
    }

    public void deletePlaylist(long playlistId) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        db.delete("playlist_songs", "playlist_id = ?", new String[]{ String.valueOf(playlistId) });
        db.delete("playlists", "id = ?", new String[]{ String.valueOf(playlistId) });
    }

    public JSArray getPlaylists() {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        JSArray results = new JSArray();
        String query = "SELECT p.id, p.name, p.created_at, COUNT(ps.song_id) as song_count " +
            "FROM playlists p LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id " +
            "GROUP BY p.id ORDER BY p.name ASC";
        Cursor cursor = db.rawQuery(query, null);
        try {
            while (cursor.moveToNext()) {
                JSObject p = new JSObject();
                p.put("id", cursor.getLong(0));
                p.put("name", cursor.getString(1));
                p.put("createdAt", cursor.getLong(2));
                p.put("songCount", cursor.getInt(3));
                results.put(p);
            }
        } finally {
            cursor.close();
        }
        return results;
    }

    public void addToPlaylist(long playlistId, String songId) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("playlist_id", playlistId);
        cv.put("song_id", songId);
        cv.put("position", System.currentTimeMillis());
        db.insertWithOnConflict("playlist_songs", null, cv, SQLiteDatabase.CONFLICT_IGNORE);
    }

    public void removeFromPlaylist(long playlistId, String songId) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        db.delete("playlist_songs", "playlist_id = ? AND song_id = ?",
            new String[]{ String.valueOf(playlistId), songId });
    }

    public JSArray getPlaylistSongs(long playlistId) {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        JSArray results = new JSArray();
        String query = "SELECT s.* FROM songs s JOIN playlist_songs ps ON s.id = ps.song_id " +
            "WHERE ps.playlist_id = ? ORDER BY ps.position ASC";
        Cursor cursor = db.rawQuery(query, new String[]{ String.valueOf(playlistId) });
        try {
            while (cursor.moveToNext()) {
                results.put(cursorToSongObject(cursor));
            }
        } finally {
            cursor.close();
        }
        return results;
    }

    /**
     * Categories: Albums, Artists, Folders
     */
    public JSArray getAlbums() {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        JSArray results = new JSArray();
        String query = "SELECT album, album_id, artist, album_art_uri, COUNT(id) as song_count " +
            "FROM songs GROUP BY album ORDER BY album ASC";
        Cursor cursor = db.rawQuery(query, null);
        try {
            while (cursor.moveToNext()) {
                JSObject a = new JSObject();
                a.put("album", cursor.getString(0));
                a.put("albumId", cursor.getString(1));
                a.put("artist", cursor.getString(2));
                a.put("albumArtUri", cursor.getString(3));
                a.put("songCount", cursor.getInt(4));
                results.put(a);
            }
        } finally {
            cursor.close();
        }
        return results;
    }

    public JSArray getArtists() {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        JSArray results = new JSArray();
        String query = "SELECT artist, COUNT(id) as song_count, COUNT(DISTINCT album) as album_count " +
            "FROM songs GROUP BY artist ORDER BY artist ASC";
        Cursor cursor = db.rawQuery(query, null);
        try {
            while (cursor.moveToNext()) {
                JSObject a = new JSObject();
                a.put("artist", cursor.getString(0));
                a.put("songCount", cursor.getInt(1));
                a.put("albumCount", cursor.getInt(2));
                results.put(a);
            }
        } finally {
            cursor.close();
        }
        return results;
    }

    public JSArray getFolders() {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        JSArray results = new JSArray();
        String query = "SELECT folder_name, COUNT(id) as song_count " +
            "FROM songs GROUP BY folder_name ORDER BY folder_name ASC";
        Cursor cursor = db.rawQuery(query, null);
        try {
            while (cursor.moveToNext()) {
                JSObject f = new JSObject();
                f.put("folderName", cursor.getString(0));
                f.put("songCount", cursor.getInt(1));
                results.put(f);
            }
        } finally {
            cursor.close();
        }
        return results;
    }

    /**
     * Playback history & statistics.
     */
    public void recordPlayback(String songId) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        long now = System.currentTimeMillis();

        db.execSQL("UPDATE songs SET play_count = play_count + 1, last_played_at = ? WHERE id = ?",
            new Object[]{ now, songId });

        ContentValues cv = new ContentValues();
        cv.put("song_id", songId);
        cv.put("played_at", now);
        db.insert("recently_played", null, cv);
    }

    public JSArray getRecentlyPlayed(int limit) {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        JSArray results = new JSArray();
        String query = "SELECT s.* FROM songs s JOIN recently_played rp ON s.id = rp.song_id " +
            "ORDER BY rp.played_at DESC LIMIT ?";
        Cursor cursor = db.rawQuery(query, new String[]{ String.valueOf(limit) });
        try {
            while (cursor.moveToNext()) {
                results.put(cursorToSongObject(cursor));
            }
        } finally {
            cursor.close();
        }
        return results;
    }

    private JSObject cursorToSongObject(Cursor c) {
        JSObject song = new JSObject();
        song.put("id", c.getString(c.getColumnIndexOrThrow("id")));
        song.put("title", c.getString(c.getColumnIndexOrThrow("title")));
        song.put("artist", c.getString(c.getColumnIndexOrThrow("artist")));
        song.put("album", c.getString(c.getColumnIndexOrThrow("album")));
        song.put("albumId", c.getString(c.getColumnIndexOrThrow("album_id")));
        song.put("duration", c.getString(c.getColumnIndexOrThrow("duration")));
        song.put("durationSeconds", c.getInt(c.getColumnIndexOrThrow("duration_seconds")));
        song.put("durationMs", c.getLong(c.getColumnIndexOrThrow("duration_ms")));
        song.put("filePath", c.getString(c.getColumnIndexOrThrow("file_path")));
        song.put("contentUri", c.getString(c.getColumnIndexOrThrow("content_uri")));
        song.put("albumArtUri", c.getString(c.getColumnIndexOrThrow("album_art_uri")));
        song.put("mimeType", c.getString(c.getColumnIndexOrThrow("mime_type")));
        song.put("size", c.getLong(c.getColumnIndexOrThrow("size")));
        song.put("dateAdded", c.getLong(c.getColumnIndexOrThrow("date_added")));
        song.put("track", c.getInt(c.getColumnIndexOrThrow("track")));
        song.put("year", c.getInt(c.getColumnIndexOrThrow("year")));
        song.put("folderName", c.getString(c.getColumnIndexOrThrow("folder_name")));
        song.put("isFavorite", c.getInt(c.getColumnIndexOrThrow("is_favorite")) == 1);
        song.put("playCount", c.getInt(c.getColumnIndexOrThrow("play_count")));
        song.put("isLocal", true);
        return song;
    }
}
