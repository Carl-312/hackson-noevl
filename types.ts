export interface Character {
  id: string;
  name: string;
  description: string;
  visualTraits: string; // Used to seed image generation
  themeColor?: string;
}

export interface Scene {
  id: string;
  description: string;
  mood: string;
  visualPrompt: string;
}

export interface Choice {
  text: string;
  nextNodeId: string;
  moodEffect?: string;
}

export interface StoryNode {
  id: string;
  sceneId: string;
  characterId?: string; // If null, it's narration
  text: string;
  choices: Choice[];
  isEnding?: boolean;
}

export interface GalgameScript {
  title: string;
  synopsis: string;
  characters: Character[];
  scenes: Scene[];
  nodes: StoryNode[];
  startNodeId: string;
}

export enum GameState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  STREAMING = 'STREAMING',
  PLAYING = 'PLAYING',
  ENDED = 'ENDED',
  ERROR = 'ERROR'
}

export interface PlayState {
  currentNodeId: string;
  history: string[]; // List of node IDs visited
}

// 流式加载相关类型
export interface StreamedScript extends GalgameScript {
  isStreamed: true;
  totalSegments: number;
  loadedSegments: number;
  isComplete: boolean;
}

export interface SegmentProgress {
  currentSegment: number;
  totalSegments: number;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

export const STORY_SEGMENT_THRESHOLD = 5000;
export const SEGMENT_SIZE = 3000;