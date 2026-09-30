package com.popmusic.player.player;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;

import com.getcapacitor.JSObject;
import com.popmusic.player.MainActivity;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * OnagakuPlayerManager - Robust audio engine backed by AndroidX Media3 ExoPlayer.
 * Thread-safe: all ExoPlayer operations execute on the Main Looper thread.
 * Handles queue management, gapless playback, position tracking, shuffle/repeat,
 * and MediaSession integration.
 */
public class OnagakuPlayerManager implements Player.Listener {

    private static final String TAG = "OnagakuPlayerManager";

    public interface PlayerEventListener {
        void onPlayerStateChanged(boolean isPlaying, String currentSongId, boolean shuffle, String repeatMode);
        void onPositionChanged(long positionMs, long durationMs);
        void onSongChanged(String songId);
        void onError(String message);
    }

    private final Context context;
    private final PlayerEventListener listener;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private ExoPlayer player;
    private MediaSession mediaSession;

    private final List<JSObject> currentQueue = new ArrayList<>();
    private final List<JSObject> originalQueue = new ArrayList<>();
    private int currentIndex = -1;

    private boolean isShuffleEnabled = false;
    private String repeatMode = "none"; // "none" | "one" | "all"

    private final Runnable positionRunnable = new Runnable() {
        @Override
        public void run() {
            if (player != null && player.isPlaying() && listener != null) {
                listener.onPositionChanged(player.getCurrentPosition(), Math.max(0, player.getDuration()));
                mainHandler.postDelayed(this, 500);
            }
        }
    };

    public OnagakuPlayerManager(Context context, PlayerEventListener listener) {
        this.context = context.getApplicationContext();
        this.listener = listener;
        mainHandler.post(this::initializePlayer);
    }

    private void initializePlayer() {
        try {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                .build();

            player = new ExoPlayer.Builder(context)
                .setAudioAttributes(audioAttributes, true) // Handle audio focus
                .setHandleAudioBecomingNoisy(true)        // Pause on headset disconnect
                .build();

            player.addListener(this);

            // Create PendingIntent to launch MainActivity when tapping media notification
            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );

            mediaSession = new MediaSession.Builder(context, player)
                .setSessionActivity(pendingIntent)
                .build();

            PlayerService service = PlayerService.getInstance();
            if (service != null) {
                service.setMediaSession(mediaSession);
            }

            Log.d(TAG, "OnagakuPlayerManager initialized with ExoPlayer and MediaSession");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing ExoPlayer", e);
            if (listener != null) listener.onError("Player init failed: " + e.getMessage());
        }
    }

    public void setQueue(List<JSObject> songs, int startIndex) {
        mainHandler.post(() -> {
            if (player == null) return;
            try {
                originalQueue.clear();
                originalQueue.addAll(songs);

                currentQueue.clear();
                currentQueue.addAll(songs);

                if (isShuffleEnabled) {
                    applyShuffleQueue();
                }

                player.clearMediaItems();
                List<MediaItem> mediaItems = new ArrayList<>();
                for (JSObject s : currentQueue) {
                    MediaItem item = buildMediaItem(s);
                    if (item != null) {
                        mediaItems.add(item);
                    }
                }

                if (mediaItems.isEmpty()) {
                    Log.w(TAG, "setQueue: No valid media items to set");
                    return;
                }

                player.setMediaItems(mediaItems);

                int targetIndex = (startIndex >= 0 && startIndex < mediaItems.size()) ? startIndex : 0;
                currentIndex = targetIndex;
                player.seekTo(currentIndex, 0);
                player.prepare();
                player.play();
                startPositionUpdates();
            } catch (Exception e) {
                Log.e(TAG, "Error in setQueue", e);
                if (listener != null) listener.onError("Queue failed: " + e.getMessage());
            }
        });
    }

    public void playSong(JSObject song) {
        mainHandler.post(() -> {
            if (player == null || song == null) return;
            try {
                String targetId = song.optString("id", "");

                // Check if already in current queue
                int foundIndex = -1;
                for (int i = 0; i < currentQueue.size(); i++) {
                    String id = currentQueue.get(i).optString("id", "");
                    if (id.equals(targetId)) {
                        foundIndex = i;
                        break;
                    }
                }

                if (foundIndex != -1 && player.getMediaItemCount() > foundIndex) {
                    currentIndex = foundIndex;
                    player.seekTo(currentIndex, 0);
                    player.play();
                    startPositionUpdates();
                    return;
                }

                // If not in queue, set as single item and play
                MediaItem item = buildMediaItem(song);
                if (item != null) {
                    player.setMediaItem(item);
                    player.prepare();
                    player.play();
                    startPositionUpdates();
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in playSong", e);
                if (listener != null) listener.onError("Play failed: " + e.getMessage());
            }
        });
    }

    public void play() {
        mainHandler.post(() -> {
            if (player != null) {
                player.play();
                startPositionUpdates();
            }
        });
    }

    public void pause() {
        mainHandler.post(() -> {
            if (player != null) {
                player.pause();
                stopPositionUpdates();
                notifyStateChanged();
            }
        });
    }

    public void resume() {
        play();
    }

    public void stop() {
        mainHandler.post(() -> {
            if (player != null) {
                player.stop();
                stopPositionUpdates();
                notifyStateChanged();
            }
        });
    }

    public void next() {
        mainHandler.post(() -> {
            if (player != null && player.hasNextMediaItem()) {
                player.seekToNextMediaItem();
            }
        });
    }

    public void previous() {
        mainHandler.post(() -> {
            if (player != null) {
                if (player.getCurrentPosition() > 3000) {
                    player.seekTo(0);
                } else if (player.hasPreviousMediaItem()) {
                    player.seekToPreviousMediaItem();
                }
            }
        });
    }

    public void seekTo(long positionMs) {
        mainHandler.post(() -> {
            if (player != null) {
                player.seekTo(positionMs);
                if (listener != null) {
                    listener.onPositionChanged(positionMs, Math.max(0, player.getDuration()));
                }
            }
        });
    }

    public void setShuffle(boolean enabled) {
        this.isShuffleEnabled = enabled;
        mainHandler.post(() -> {
            if (player != null) {
                player.setShuffleModeEnabled(enabled);
            }
        });
    }

    public void setRepeatMode(String mode) {
        this.repeatMode = mode;
        mainHandler.post(() -> {
            if (player != null) {
                switch (mode) {
                    case "one":
                        player.setRepeatMode(Player.REPEAT_MODE_ONE);
                        break;
                    case "all":
                        player.setRepeatMode(Player.REPEAT_MODE_ALL);
                        break;
                    default:
                        player.setRepeatMode(Player.REPEAT_MODE_OFF);
                        break;
                }
            }
        });
    }

    public JSObject getPlayerState() {
        JSObject state = new JSObject();
        boolean isPlaying = player != null && player.isPlaying();
        String currentSongId = getCurrentSongId();

        state.put("isPlaying", isPlaying);
        state.put("currentSongId", currentSongId);
        state.put("positionMs", player != null ? player.getCurrentPosition() : 0);
        state.put("durationMs", player != null ? Math.max(0, player.getDuration()) : 0);
        state.put("shuffle", isShuffleEnabled);
        state.put("repeatMode", repeatMode);
        return state;
    }

    public String getCurrentSongId() {
        if (player != null && player.getCurrentMediaItem() != null) {
            return player.getCurrentMediaItem().mediaId;
        }
        return null;
    }

    // --- Player.Listener Callbacks ---

    @Override
    public void onIsPlayingChanged(boolean isPlaying) {
        if (isPlaying) {
            startPositionUpdates();
        } else {
            stopPositionUpdates();
        }
        notifyStateChanged();
    }

    @Override
    public void onMediaItemTransition(MediaItem mediaItem, int reason) {
        if (mediaItem != null && listener != null) {
            listener.onSongChanged(mediaItem.mediaId);
        }
        notifyStateChanged();
    }

    @Override
    public void onPlaybackStateChanged(int playbackState) {
        if (playbackState == Player.STATE_ENDED) {
            stopPositionUpdates();
            notifyStateChanged();
        }
    }

    @Override
    public void onPlayerError(PlaybackException error) {
        Log.e(TAG, "ExoPlayer error: " + error.getMessage(), error);
        stopPositionUpdates();
        notifyStateChanged();
        if (listener != null) {
            listener.onError("Playback error: " + error.getMessage());
        }
    }

    private void startPositionUpdates() {
        stopPositionUpdates();
        mainHandler.post(positionRunnable);
    }

    private void stopPositionUpdates() {
        mainHandler.removeCallbacks(positionRunnable);
    }

    private void notifyStateChanged() {
        if (listener != null) {
            boolean isPlaying = player != null && player.isPlaying();
            String currentSongId = getCurrentSongId();
            listener.onPlayerStateChanged(isPlaying, currentSongId, isShuffleEnabled, repeatMode);
        }
    }

    private MediaItem buildMediaItem(JSObject song) {
        if (song == null) return null;

        String id = song.optString("id", "");
        String title = song.optString("title", "Unknown Title");
        String artist = song.optString("artist", "Unknown Artist");
        String album = song.optString("album", "Unknown Album");
        String contentUriStr = song.optString("contentUri", "");
        String filePath = song.optString("filePath", "");
        String albumArtUriStr = song.optString("albumArtUri", "");

        Uri mediaUri = null;

        // 1. Try contentUri if present
        if (contentUriStr != null && !contentUriStr.trim().isEmpty()) {
            try {
                Uri parsed = Uri.parse(contentUriStr);
                if (parsed != null && parsed.getScheme() != null) {
                    mediaUri = parsed;
                }
            } catch (Exception ignored) {}
        }

        // 2. Try filePath if contentUri is missing or scheme-less
        if (mediaUri == null && filePath != null && !filePath.trim().isEmpty()) {
            try {
                String cleanPath = filePath.startsWith("file://") ? filePath.substring(7) : filePath;
                File file = new File(cleanPath);
                if (file.exists()) {
                    mediaUri = Uri.fromFile(file);
                } else {
                    mediaUri = Uri.parse(filePath);
                }
            } catch (Exception ignored) {}
        }

        // 3. Fallback to parsing raw contentUriStr
        if (mediaUri == null && contentUriStr != null && !contentUriStr.trim().isEmpty()) {
            try {
                mediaUri = Uri.parse(contentUriStr);
            } catch (Exception ignored) {}
        }

        if (mediaUri == null) {
            Log.w(TAG, "buildMediaItem: Unable to resolve URI for song id=" + id + " title=" + title);
            return null;
        }

        Uri artworkUri = null;
        if (albumArtUriStr != null && !albumArtUriStr.trim().isEmpty()) {
            try {
                artworkUri = Uri.parse(albumArtUriStr);
            } catch (Exception ignored) {}
        }

        MediaMetadata metadata = new MediaMetadata.Builder()
            .setTitle(title)
            .setArtist(artist)
            .setAlbumTitle(album)
            .setArtworkUri(artworkUri)
            .build();

        return new MediaItem.Builder()
            .setMediaId(id)
            .setUri(mediaUri)
            .setMediaMetadata(metadata)
            .build();
    }

    private void applyShuffleQueue() {
        if (currentQueue.isEmpty()) return;
        JSObject current = (currentIndex >= 0 && currentIndex < currentQueue.size())
            ? currentQueue.get(currentIndex) : null;

        Collections.shuffle(currentQueue);

        if (current != null) {
            currentQueue.remove(current);
            currentQueue.add(0, current);
            currentIndex = 0;
        }
    }

    public void release() {
        mainHandler.post(() -> {
            stopPositionUpdates();
            if (mediaSession != null) {
                mediaSession.release();
                mediaSession = null;
            }
            if (player != null) {
                player.removeListener(this);
                player.release();
                player = null;
            }
        });
    }
}
