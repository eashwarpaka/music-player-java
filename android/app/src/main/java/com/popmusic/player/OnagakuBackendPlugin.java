package com.popmusic.player;

import android.Manifest;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.popmusic.player.database.SongRepository;
import com.popmusic.player.handler.PlayerHandler;
import com.popmusic.player.handler.PlaylistHandler;
import com.popmusic.player.permission.PermissionManager;
import com.popmusic.player.player.OnagakuPlayerManager;
import com.popmusic.player.scanner.MediaStoreScanner;

/**
 * OnagakuBackendPlugin - Clean, ultra-lean Capacitor controller for the Onagaku Android backend.
 * Delegates calls to specialized handlers:
 *   - PermissionManager (Permission requests & state)
 *   - MediaStoreScanner (Library scanning & AudioFiltering)
 *   - PlayerHandler (ExoPlayer playback & MediaSession queue)
 *   - PlaylistHandler (SQLite CRUD for playlists, favorites, history & groupings)
 */
@CapacitorPlugin(
    name = "OnagakuBackend",
    permissions = {
        @Permission(alias = "audio", strings = { Manifest.permission.READ_MEDIA_AUDIO }),
        @Permission(alias = "storage", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
    }
)
public class OnagakuBackendPlugin extends Plugin implements OnagakuPlayerManager.PlayerEventListener {

    private static final String TAG = "OnagakuBackend";

    private SongRepository repository;
    private OnagakuPlayerManager playerManager;
    private PlayerHandler playerHandler;
    private PlaylistHandler playlistHandler;

    @Override
    public void load() {
        super.load();
        repository = new SongRepository(getContext());
        playerManager = new OnagakuPlayerManager(getContext(), this);
        playerHandler = new PlayerHandler(playerManager);
        playlistHandler = new PlaylistHandler(repository);
        Log.d(TAG, "OnagakuBackendPlugin initialized cleanly with delegate handlers");
    }

    @Override
    protected void handleOnDestroy() {
        if (playerManager != null) {
            playerManager.release();
        }
        super.handleOnDestroy();
    }

    // ── Player Event Listener Callbacks (Java -> React via notifyListeners) ──

    @Override
    public void onPlayerStateChanged(boolean isPlaying, String currentSongId, boolean shuffle, String repeatMode) {
        JSObject state = new JSObject();
        state.put("isPlaying", isPlaying);
        state.put("currentSongId", currentSongId);
        state.put("shuffle", shuffle);
        state.put("repeatMode", repeatMode);
        notifyListeners("playerStateChanged", state);
    }

    @Override
    public void onPositionChanged(long positionMs, long durationMs) {
        JSObject pos = new JSObject();
        pos.put("positionMs", positionMs);
        pos.put("durationMs", durationMs);
        notifyListeners("positionChanged", pos);
    }

    @Override
    public void onSongChanged(String songId) {
        JSObject data = new JSObject();
        data.put("songId", songId);
        notifyListeners("songChanged", data);

        if (repository != null && songId != null) {
            repository.recordPlayback(songId);
        }
    }

    @Override
    public void onError(String message) {
        JSObject err = new JSObject();
        err.put("message", message);
        notifyListeners("playerError", err);
    }

    // ── Plugin Connectivity & Permissions ──

    @PluginMethod
    public void ping(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ok", true);
        result.put("platform", "android");
        result.put("pluginVersion", "1.0");
        result.put("timestamp", System.currentTimeMillis());
        call.resolve(result);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("status", PermissionManager.getAudioPermissionState(this));
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (PermissionManager.hasAudioPermission(this)) {
            JSObject result = new JSObject();
            result.put("status", "granted");
            call.resolve(result);
            return;
        }
        String alias = PermissionManager.getAudioPermissionAlias();
        requestPermissionForAlias(alias, call, "handlePermissionResult");
    }

    @PermissionCallback
    private void handlePermissionResult(PluginCall call) {
        JSObject result = new JSObject();
        result.put("status", PermissionManager.getAudioPermissionState(this));
        call.resolve(result);
    }

    // ── MediaStore Library Scanner & Queries ──

    @PluginMethod
    public void scanLibrary(PluginCall call) {
        if (!PermissionManager.hasAudioPermission(this)) {
            call.reject("Audio permission required. Call requestPermission() first.");
            return;
        }
        new Thread(() -> {
            try {
                notifyListeners("scanStarted", new JSObject());
                JSArray songs = MediaStoreScanner.scanLibrary(getContext(), (scanned, accepted, total) -> {
                    JSObject prog = new JSObject();
                    prog.put("scanned", scanned);
                    prog.put("accepted", accepted);
                    prog.put("total", total);
                    notifyListeners("scanProgress", prog);
                });

                if (repository != null) {
                    repository.upsertSongs(songs);
                }

                JSObject completedData = new JSObject();
                completedData.put("songCount", songs.length());
                notifyListeners("scanCompleted", completedData);

                JSObject result = new JSObject();
                result.put("songCount", songs.length());
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "scanLibrary() error", e);
                call.reject("Scan failed: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void getSongs(PluginCall call) {
        int offset = call.getInt("offset", 0);
        int limit = call.getInt("limit", Integer.MAX_VALUE);
        call.resolve(repository != null ? repository.getSongs(offset, limit) : new JSObject());
    }

    @PluginMethod
    public void search(PluginCall call) {
        String query = call.getString("query", "").trim();
        JSObject result = new JSObject();
        result.put("songs", (repository != null && !query.isEmpty()) ? repository.search(query) : new JSArray());
        call.resolve(result);
    }

    // ── Delegated Player Commands (PlayerHandler) ──

    @PluginMethod public void playSong(PluginCall call)       { playerHandler.playSong(call); }
    @PluginMethod public void pause(PluginCall call)          { playerHandler.pause(call); }
    @PluginMethod public void resume(PluginCall call)         { playerHandler.resume(call); }
    @PluginMethod public void stop(PluginCall call)           { playerHandler.stop(call); }
    @PluginMethod public void next(PluginCall call)           { playerHandler.next(call); }
    @PluginMethod public void previous(PluginCall call)       { playerHandler.previous(call); }
    @PluginMethod public void seekTo(PluginCall call)         { playerHandler.seekTo(call); }
    @PluginMethod public void setQueue(PluginCall call)       { playerHandler.setQueue(call); }
    @PluginMethod public void setShuffle(PluginCall call)     { playerHandler.setShuffle(call); }
    @PluginMethod public void setRepeatMode(PluginCall call)  { playerHandler.setRepeatMode(call); }
    @PluginMethod public void getPlayerState(PluginCall call) { playerHandler.getPlayerState(call); }

    // ── Delegated Playlist & Library Commands (PlaylistHandler) ──

    @PluginMethod public void addFavorite(PluginCall call)        { playlistHandler.addFavorite(call); }
    @PluginMethod public void removeFavorite(PluginCall call)     { playlistHandler.removeFavorite(call); }
    @PluginMethod public void getFavorites(PluginCall call)        { playlistHandler.getFavorites(call); }
    @PluginMethod public void createPlaylist(PluginCall call)      { playlistHandler.createPlaylist(call); }
    @PluginMethod public void deletePlaylist(PluginCall call)      { playlistHandler.deletePlaylist(call); }
    @PluginMethod public void getPlaylists(PluginCall call)        { playlistHandler.getPlaylists(call); }
    @PluginMethod public void addToPlaylist(PluginCall call)      { playlistHandler.addToPlaylist(call); }
    @PluginMethod public void removeFromPlaylist(PluginCall call) { playlistHandler.removeFromPlaylist(call); }
    @PluginMethod public void getPlaylistSongs(PluginCall call)  { playlistHandler.getPlaylistSongs(call); }
    @PluginMethod public void getAlbums(PluginCall call)         { playlistHandler.getAlbums(call); }
    @PluginMethod public void getArtists(PluginCall call)        { playlistHandler.getArtists(call); }
    @PluginMethod public void getFolders(PluginCall call)        { playlistHandler.getFolders(call); }
    @PluginMethod public void getRecentlyPlayed(PluginCall call) { playlistHandler.getRecentlyPlayed(call); }
}
