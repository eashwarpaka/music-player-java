package com.popmusic.player.handler;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.popmusic.player.database.SongRepository;

/**
 * PlaylistHandler - Delegates Capacitor plugin calls to SongRepository for playlists,
 * favorites, albums, artists, folders, and history.
 */
public class PlaylistHandler {

    private final SongRepository repository;

    public PlaylistHandler(SongRepository repository) {
        this.repository = repository;
    }

    public void addFavorite(PluginCall call) {
        String songId = call.getString("songId");
        if (repository != null && songId != null) repository.setFavorite(songId, true);
        call.resolve(new JSObject());
    }

    public void removeFavorite(PluginCall call) {
        String songId = call.getString("songId");
        if (repository != null && songId != null) repository.setFavorite(songId, false);
        call.resolve(new JSObject());
    }

    public void getFavorites(PluginCall call) {
        JSObject result = new JSObject();
        result.put("songs", repository != null ? repository.getFavorites() : new JSArray());
        call.resolve(result);
    }

    public void createPlaylist(PluginCall call) {
        String name = call.getString("name", "New Playlist");
        long id = repository != null ? repository.createPlaylist(name) : -1;
        JSObject result = new JSObject();
        result.put("id", id);
        call.resolve(result);
    }

    public void deletePlaylist(PluginCall call) {
        long id = call.getLong("id", -1L);
        if (repository != null && id != -1) repository.deletePlaylist(id);
        call.resolve(new JSObject());
    }

    public void getPlaylists(PluginCall call) {
        JSObject result = new JSObject();
        result.put("playlists", repository != null ? repository.getPlaylists() : new JSArray());
        call.resolve(result);
    }

    public void addToPlaylist(PluginCall call) {
        long playlistId = call.getLong("playlistId", -1L);
        String songId = call.getString("songId");
        if (repository != null && playlistId != -1 && songId != null) repository.addToPlaylist(playlistId, songId);
        call.resolve(new JSObject());
    }

    public void removeFromPlaylist(PluginCall call) {
        long playlistId = call.getLong("playlistId", -1L);
        String songId = call.getString("songId");
        if (repository != null && playlistId != -1 && songId != null) repository.removeFromPlaylist(playlistId, songId);
        call.resolve(new JSObject());
    }

    public void getPlaylistSongs(PluginCall call) {
        long playlistId = call.getLong("playlistId", -1L);
        JSObject result = new JSObject();
        result.put("songs", (repository != null && playlistId != -1) ? repository.getPlaylistSongs(playlistId) : new JSArray());
        call.resolve(result);
    }

    public void getAlbums(PluginCall call) {
        JSObject result = new JSObject();
        result.put("albums", repository != null ? repository.getAlbums() : new JSArray());
        call.resolve(result);
    }

    public void getArtists(PluginCall call) {
        JSObject result = new JSObject();
        result.put("artists", repository != null ? repository.getArtists() : new JSArray());
        call.resolve(result);
    }

    public void getFolders(PluginCall call) {
        JSObject result = new JSObject();
        result.put("folders", repository != null ? repository.getFolders() : new JSArray());
        call.resolve(result);
    }

    public void getRecentlyPlayed(PluginCall call) {
        int limit = call.getInt("limit", 20);
        JSObject result = new JSObject();
        result.put("songs", repository != null ? repository.getRecentlyPlayed(limit) : new JSArray());
        call.resolve(result);
    }
}
