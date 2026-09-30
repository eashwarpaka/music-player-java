package com.popmusic.player.handler;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.popmusic.player.player.OnagakuPlayerManager;

import java.util.ArrayList;
import java.util.List;

/**
 * PlayerHandler - Delegates Capacitor plugin calls to OnagakuPlayerManager.
 */
public class PlayerHandler {

    private final OnagakuPlayerManager playerManager;

    public PlayerHandler(OnagakuPlayerManager playerManager) {
        this.playerManager = playerManager;
    }

    public void playSong(PluginCall call) {
        JSObject song = call.getObject("song");
        if (playerManager != null && song != null) {
            playerManager.playSong(song);
        }
        call.resolve(new JSObject());
    }

    public void pause(PluginCall call) {
        if (playerManager != null) playerManager.pause();
        call.resolve(new JSObject());
    }

    public void resume(PluginCall call) {
        if (playerManager != null) playerManager.resume();
        call.resolve(new JSObject());
    }

    public void stop(PluginCall call) {
        if (playerManager != null) playerManager.stop();
        call.resolve(new JSObject());
    }

    public void next(PluginCall call) {
        if (playerManager != null) playerManager.next();
        call.resolve(new JSObject());
    }

    public void previous(PluginCall call) {
        if (playerManager != null) playerManager.previous();
        call.resolve(new JSObject());
    }

    public void seekTo(PluginCall call) {
        long positionMs = call.getLong("positionMs", 0L);
        if (playerManager != null) playerManager.seekTo(positionMs);
        call.resolve(new JSObject());
    }

    public void setQueue(PluginCall call) {
        JSArray songsArray = call.getArray("songs");
        int startIndex = call.getInt("startIndex", 0);
        if (playerManager != null && songsArray != null) {
            List<JSObject> list = new ArrayList<>();
            try {
                for (int i = 0; i < songsArray.length(); i++) {
                    list.add(JSObject.fromJSONObject(songsArray.getJSONObject(i)));
                }
            } catch (Exception ignored) {}
            playerManager.setQueue(list, startIndex);
        }
        call.resolve(new JSObject());
    }

    public void setShuffle(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        if (playerManager != null) playerManager.setShuffle(enabled);
        call.resolve(new JSObject());
    }

    public void setRepeatMode(PluginCall call) {
        String mode = call.getString("mode", "none");
        if (playerManager != null) playerManager.setRepeatMode(mode);
        call.resolve(new JSObject());
    }

    public void getPlayerState(PluginCall call) {
        if (playerManager != null) {
            call.resolve(playerManager.getPlayerState());
        } else {
            JSObject state = new JSObject();
            state.put("isPlaying", false);
            state.put("currentSongId", (String) null);
            state.put("positionMs", 0);
            state.put("durationMs", 0);
            state.put("shuffle", false);
            state.put("repeatMode", "none");
            call.resolve(state);
        }
    }
}
