package com.popmusic.player.database;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

/**
 * OnagakuDatabaseHelper - SQLite database helper for Onagaku offline music player.
 * Manages song library cache, playlists, favorites, and playback history.
 */
public class OnagakuDatabaseHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "onagaku.db";
    private static final int DATABASE_VERSION = 1;

    private static OnagakuDatabaseHelper instance;

    public static synchronized OnagakuDatabaseHelper getInstance(Context context) {
        if (instance == null) {
            instance = new OnagakuDatabaseHelper(context.getApplicationContext());
        }
        return instance;
    }

    private OnagakuDatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        // 1. Songs table
        db.execSQL("CREATE TABLE IF NOT EXISTS songs (" +
            "id TEXT PRIMARY KEY, " +
            "title TEXT NOT NULL, " +
            "artist TEXT, " +
            "album TEXT, " +
            "album_id TEXT, " +
            "duration TEXT, " +
            "duration_seconds INTEGER, " +
            "duration_ms INTEGER, " +
            "file_path TEXT, " +
            "content_uri TEXT, " +
            "album_art_uri TEXT, " +
            "mime_type TEXT, " +
            "size INTEGER, " +
            "date_added INTEGER, " +
            "track INTEGER, " +
            "year INTEGER, " +
            "folder_name TEXT, " +
            "is_favorite INTEGER DEFAULT 0, " +
            "play_count INTEGER DEFAULT 0, " +
            "last_played_at INTEGER DEFAULT 0" +
            ");");

        // Indexes for fast lookup
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album);");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_songs_folder ON songs(folder_name);");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_songs_fav ON songs(is_favorite);");

        // 2. Playlists table
        db.execSQL("CREATE TABLE IF NOT EXISTS playlists (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "name TEXT UNIQUE NOT NULL, " +
            "created_at INTEGER NOT NULL" +
            ");");

        // 3. Playlist Songs table
        db.execSQL("CREATE TABLE IF NOT EXISTS playlist_songs (" +
            "playlist_id INTEGER, " +
            "song_id TEXT, " +
            "position INTEGER, " +
            "PRIMARY KEY (playlist_id, song_id), " +
            "FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE, " +
            "FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE" +
            ");");

        // 4. Recently Played table
        db.execSQL("CREATE TABLE IF NOT EXISTS recently_played (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "song_id TEXT NOT NULL, " +
            "played_at INTEGER NOT NULL" +
            ");");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS playlist_songs;");
        db.execSQL("DROP TABLE IF EXISTS playlists;");
        db.execSQL("DROP TABLE IF EXISTS recently_played;");
        db.execSQL("DROP TABLE IF EXISTS songs;");
        onCreate(db);
    }
}
