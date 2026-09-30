package com.popmusic.player.permission;

import android.os.Build;
import com.getcapacitor.Plugin;

/**
 * PermissionManager - Handles audio and storage read permission checks
 * and requests across Android versions (Android 13+ READ_MEDIA_AUDIO vs legacy READ_EXTERNAL_STORAGE).
 */
public class PermissionManager {

    public static String getAudioPermissionAlias() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ? "audio" : "storage";
    }

    public static String getAudioPermissionState(Plugin plugin) {
        String alias = getAudioPermissionAlias();
        return plugin.getPermissionState(alias).toString().toLowerCase();
    }

    public static boolean hasAudioPermission(Plugin plugin) {
        return "granted".equals(getAudioPermissionState(plugin));
    }
}
