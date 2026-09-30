package com.popmusic.player.scanner;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * AudioFilter - Filters out non-music audio files (voice notes, call recordings, ringtones,
 * alarms, WhatsApp audio, temp files, and tracks shorter than 30s).
 */
public class AudioFilter {

    private static final Set<String> ALLOWED_MIME_TYPES = new HashSet<>(Arrays.asList(
        "audio/mpeg", "audio/mp4", "audio/aac",
        "audio/x-wav", "audio/wav",
        "audio/flac", "audio/x-flac",
        "audio/ogg", "audio/vorbis", "audio/opus",
        "audio/3gpp", "audio/x-ms-wma"
    ));

    private static final String[] EXCLUDED_FOLDER_SEGMENTS = {
        "recordings", "call recording", "callrecording",
        "whatsapp", "telegram",
        "notifications", "notification",
        "ringtones", "ringtone",
        "alarms", "alarm",
        "voicenotes", "voice_notes", "voicememo",
        "temp", ".trashed", ".trash"
    };

    private static final Pattern EXCLUDED_FILENAME_PATTERN = Pattern.compile(
        "(?i)(^rec_|^aud-|^callrecord|^voicenote|^voice_|^notif_|^ring_|_temp\\.)"
    );

    public static final long MIN_DURATION_MS = 30_000L;

    public static boolean isAllowedMimeType(String mimeType) {
        if (mimeType == null) return false;
        String lower = mimeType.toLowerCase().trim();
        return ALLOWED_MIME_TYPES.contains(lower) || lower.startsWith("audio/");
    }

    public static boolean isExcludedPath(String filePath) {
        if (filePath == null) return false;
        String lower = filePath.toLowerCase();
        for (String seg : EXCLUDED_FOLDER_SEGMENTS) {
            if (lower.contains("/" + seg + "/") || lower.contains("/" + seg)) return true;
        }
        return false;
    }

    public static boolean isExcludedFilename(String filePath) {
        if (filePath == null) return false;
        int last = filePath.lastIndexOf('/');
        String name = last >= 0 ? filePath.substring(last + 1) : filePath;
        return EXCLUDED_FILENAME_PATTERN.matcher(name).find();
    }

    public static boolean isValidMusicTrack(String mimeType, String filePath, long durationMs) {
        if (durationMs <= MIN_DURATION_MS) return false;
        if (!isAllowedMimeType(mimeType)) return false;
        if (isExcludedPath(filePath)) return false;
        if (isExcludedFilename(filePath)) return false;
        return true;
    }

    public static String sanitize(String value, String fallback) {
        return (value == null || value.trim().isEmpty()) ? fallback : value.trim();
    }

    public static String sanitizeArtist(String value) {
        return (value == null || value.trim().isEmpty() || value.equalsIgnoreCase("<unknown>")) ? "Unknown Artist" : value.trim();
    }

    public static String sanitizeAlbum(String value) {
        return (value == null || value.trim().isEmpty() || value.equalsIgnoreCase("<unknown>")) ? "Unknown Album" : value.trim();
    }

    public static String extractFolderName(String filePath) {
        if (filePath == null || filePath.isEmpty()) return "Unknown Folder";
        String[] parts = filePath.split("/");
        return parts.length >= 2 ? parts[parts.length - 2] : "Unknown Folder";
    }
}
