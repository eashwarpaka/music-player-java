package com.popmusic.player;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Unified backend plugin (MediaStore, player, SQLite, ExoPlayer, MediaSession)
        registerPlugin(OnagakuBackendPlugin.class);

        super.onCreate(savedInstanceState);
    }
}
