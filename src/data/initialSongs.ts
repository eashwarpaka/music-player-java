import { Song, GenericBlock } from '../types';

export const INITIAL_SONGS: Song[] = [
  { id: '1', title: "Cyber Neon", artist: "Milo Pop", duration: "2:45", durationSeconds: 165, color: "#00f0ff" },
  { id: '2', title: "Jellybean Jam", artist: "Sunny Lark", duration: "3:10", durationSeconds: 190, color: "#7fe0c4" },
  { id: '3', title: "Cloud Nine", artist: "Milo Pop", duration: "3:32", durationSeconds: 212, color: "#ffd66b" },
  { id: '4', title: "Squish & Go", artist: "The Marshmallows", duration: "2:58", durationSeconds: 178, color: "#a5b4fc" },
  { id: '5', title: "Quantum Pulse", artist: "Sunny Lark", duration: "3:21", durationSeconds: 201, color: "#00e5ff" },
  { id: '6', title: "Puffy Clouds", artist: "Coco Bean", duration: "4:05", durationSeconds: 245, color: "#7fe0c4" },
  { id: '7', title: "Fizzy Feeling", artist: "The Marshmallows", duration: "2:37", durationSeconds: 157, color: "#ffd66b" },
  { id: '8', title: "Pastel Waves", artist: "Coco Bean", duration: "3:48", durationSeconds: 228, color: "#a5b4fc" },
];

export const INITIAL_BLOCKS: GenericBlock[] = [
  { id: 1, name: "Favorites", songIds: [] },
];
