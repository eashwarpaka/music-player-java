/**
 * Core domain types for songs, playlist blocks, and audio playback.
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSeconds: number;
  color: string;
  // Native audio fields (populated when running on Android)
  filePath?: string;       // absolute file path on device
  contentUri?: string;     // content:// URI for streaming
  albumArtUri?: string;    // album art content:// URI
  album?: string;          // album name
  mimeType?: string;       // e.g. "audio/mpeg"
  isLocal?: boolean;       // true if from device MediaStore
}


export interface GenericBlock {
  id: number;
  name: string;
  songIds: string[];
  color?: string;
}
