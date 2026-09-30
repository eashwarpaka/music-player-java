package com.popmusic.player.player;

import android.content.Intent;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

/**
 * PlayerService - Foreground MediaSessionService for background music playback and notification controls.
 */
public class PlayerService extends MediaSessionService {

    private static PlayerService instance;
    private MediaSession mediaSession;

    public static PlayerService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
    }

    public void setMediaSession(MediaSession session) {
        this.mediaSession = session;
    }

    @Nullable
    @Override
    public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    @Override
    public void onDestroy() {
        instance = null;
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }
}
