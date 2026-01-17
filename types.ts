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
  imageUrl?: string;
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
  visualSpecs?: {
    type: "item" | "cg";
    description: string;
    visualPrompt: string;
    imageUrl?: string; // storage for the generated asset
  };
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
  ANALYZING_OUTLINE = 'ANALYZING_OUTLINE',
  GENERATING_CHUNKS = 'GENERATING_CHUNKS',
  GENERATING_ASSETS = 'GENERATING_ASSETS',
  PLAYING = 'PLAYING',
  ENDED = 'ENDED',
  ERROR = 'ERROR'
}

export interface AnalysisProgress {
  phase: 'OUTLINE' | 'CHUNKS' | 'ASSETS';
  current: number;
  total: number;
  message: string;
}

export interface PlayState {
  currentNodeId: string;
  history: string[]; // List of node IDs visited
}