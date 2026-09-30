package com.popmusic.player.scanner;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

/**
 * MediaStoreScanner - Scans Android MediaStore for local music files, applying AudioFilter rules.
 */
public class MediaStoreScanner {

    private static final String TAG = "MediaStoreScanner";

    public interface ScanProgressListener {
        void onProgress(int scanned, int accepted, int total);
    }

    public static JSArray scanLibrary(Context context, ScanProgressListener progressListener) throws Exception {
        JSArray songsArray = new JSArray();
        ContentResolver resolver = context.getContentResolver();

        Uri collection = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
            ? MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
            : MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;

        String[] projection = {
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.ALBUM_ID,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.DATA,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.SIZE,
            MediaStore.Audio.Media.DATE_ADDED,
            MediaStore.Audio.Media.TRACK,
            MediaStore.Audio.Media.YEAR,
        };

        String selection = MediaStore.Audio.Media.IS_MUSIC + " != 0 AND "
            + MediaStore.Audio.Media.DURATION + " > " + AudioFilter.MIN_DURATION_MS;

        Cursor cursor = resolver.query(collection, projection, selection, null,
            MediaStore.Audio.Media.TITLE + " ASC");

        if (cursor == null) return songsArray;

        int idCol      = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
        int titleCol   = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
        int artistCol  = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
        int albumCol   = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
        int albumIdCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID);
        int durCol     = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
        int dataCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
        int mimeCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE);
        int sizeCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
        int dateCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED);
        int trackCol   = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TRACK);
        int yearCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.YEAR);

        int total    = cursor.getCount();
        int scanned  = 0;
        int accepted = 0;

        while (cursor.moveToNext()) {
            scanned++;
            String filePath = cursor.getString(dataCol);
            String mimeType = cursor.getString(mimeCol);
            long durMs      = cursor.getLong(durCol);

            // Apply AudioFilter rules
            if (!AudioFilter.isValidMusicTrack(mimeType, filePath, durMs)) continue;

            long id         = cursor.getLong(idCol);
            String title    = AudioFilter.sanitize(cursor.getString(titleCol), "Unknown Title");
            String artist   = AudioFilter.sanitizeArtist(cursor.getString(artistCol));
            String album    = AudioFilter.sanitizeAlbum(cursor.getString(albumCol));
            long albumId    = cursor.getLong(albumIdCol);
            long size       = cursor.getLong(sizeCol);
            long dateAdded  = cursor.getLong(dateCol);
            int track       = cursor.getInt(trackCol);
            int year        = cursor.getInt(yearCol);

            Uri contentUri  = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id);
            Uri albumArtUri = ContentUris.withAppendedId(Uri.parse("content://media/external/audio/albumart"), albumId);

            long totalSec = durMs / 1000;
            String durFormatted = String.format("%d:%02d", totalSec / 60, totalSec % 60);

            JSObject song = new JSObject();
            song.put("id",            String.valueOf(id));
            song.put("title",         title);
            song.put("artist",        artist);
            song.put("album",         album);
            song.put("albumId",       String.valueOf(albumId));
            song.put("duration",      durFormatted);
            song.put("durationSeconds", (int) totalSec);
            song.put("durationMs",    durMs);
            song.put("filePath",      filePath != null ? filePath : "");
            song.put("contentUri",    contentUri.toString());
            song.put("albumArtUri",   albumArtUri.toString());
            song.put("mimeType",      mimeType != null ? mimeType : "audio/mpeg");
            song.put("size",          size);
            song.put("dateAdded",     dateAdded);
            song.put("track",         track);
            song.put("year",          year);
            song.put("folderName",    AudioFilter.extractFolderName(filePath));
            song.put("isLocal",       true);

            songsArray.put(song);
            accepted++;

            if (progressListener != null && scanned % 50 == 0) {
                progressListener.onProgress(scanned, accepted, total);
            }
        }
        cursor.close();
        Log.d(TAG, "MediaStore scan complete: scanned=" + scanned + " accepted=" + accepted);
        return songsArray;
    }
}
