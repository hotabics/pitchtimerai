// Zustand store for AI Coach state management

import { create } from 'zustand';
import type { GPTAnalysisResponse, ContentCoverage } from '@/services/openai';
import type { FrameData } from '@/services/mediapipe';
export type { FrameData };

export type CoachView = 'setup' | 'recording' | 'processing' | 'results';
export type PromptMode = 'teleprompter' | 'cueCards';

export interface ScriptBlock {
  title: string;
  content: string;
}

export interface DeliveryMetrics {
  eyeContactPercent: number;
  wpm: number;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
  stabilityScore: number;
  smilePercent: number;
  // Body language metrics
  postureScore: number;
  postureGrade: 'A' | 'B' | 'C';
  handsVisiblePercent: number;
  bodyStabilityScore: number;
}

export interface RecordingData {
  audioBlob: Blob | null;
  videoBlob: Blob | null;
  durationSeconds: number;
  frameData: FrameData[];
  swayData?: { time: number; sway: number }[];
  promptMode?: PromptMode;
}

export interface AnalysisResults {
  transcript: string;
  deliveryMetrics: DeliveryMetrics;
  contentAnalysis: GPTAnalysisResponse | null;
  contentCoverage: ContentCoverage;
  processedAt: Date;
  promptMode?: PromptMode;
  bulletPointsCoverage?: { point: string; covered: boolean }[];
}

// Transcription settings
export interface TranscriptionSettings {
  enabled: boolean;
  language: string;
}

interface AICoachState {
  // Current view
  currentView: CoachView;
  setCurrentView: (view: CoachView) => void;

  // Script blocks for teleprompter
  scriptBlocks: ScriptBlock[];
  setScriptBlocks: (blocks: ScriptBlock[]) => void;

  // Bullet points for cue card mode
  bulletPoints: string[];
  setBulletPoints: (points: string[]) => void;

  // Prompt mode (teleprompter or cue cards)
  promptMode: PromptMode;
  setPromptMode: (mode: PromptMode) => void;

  // Transcription settings
  transcriptionSettings: TranscriptionSettings;
  setTranscriptionSettings: (settings: TranscriptionSettings) => void;

  // Recording state
  isRecording: boolean;
  recordingDuration: number;
  setIsRecording: (recording: boolean) => void;
  setRecordingDuration: (duration: number) => void;

  // Recording data
  recordingData: RecordingData | null;
  setRecordingData: (data: RecordingData | null) => void;

  // Frame data during recording
  frameData: FrameData[];
  addFrameData: (frame: FrameData) => void;
  clearFrameData: () => void;

  // Processing state
  processingStep: 'transcribing' | 'analyzing' | 'aggregating' | null;
  processingProgress: number;
  setProcessingStep: (step: 'transcribing' | 'analyzing' | 'aggregating' | null) => void;
  setProcessingProgress: (progress: number) => void;

  // Analysis results
  results: AnalysisResults | null;
  setResults: (results: AnalysisResults | null) => void;

  // Errors
  error: string | null;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

// Helper to generate bullet points from full script
export const generateBulletPointsFromScript = (scriptBlocks: ScriptBlock[]): string[] => {
  return scriptBlocks.slice(0, 6).map(block => {
    const firstSentence = block.content.split(/[.!?]/)[0]?.trim() || block.content.slice(0, 80);
    return `${block.title}: ${firstSentence}`;
  });
};

export const useAICoachStore = create<AICoachState>((set) => ({
  // Initial state
  currentView: 'setup',
  scriptBlocks: [],
  bulletPoints: [],
  promptMode: 'teleprompter',
  transcriptionSettings: { enabled: true, language: 'en-US' },
  isRecording: false,
  recordingDuration: 0,
  recordingData: null,
  frameData: [],
  processingStep: null,
  processingProgress: 0,
  results: null,
  error: null,

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setScriptBlocks: (blocks) => set({ scriptBlocks: blocks }),
  setBulletPoints: (points) => set({ bulletPoints: points }),
  setPromptMode: (mode) => set({ promptMode: mode }),
  setTranscriptionSettings: (settings) => set({ transcriptionSettings: settings }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setRecordingDuration: (duration) => set({ recordingDuration: duration }),
  setRecordingData: (data) => set({ recordingData: data }),
  
  addFrameData: (frame) => set((state) => ({
    frameData: [...state.frameData, frame],
  })),
  clearFrameData: () => set({ frameData: [] }),
  
  setProcessingStep: (step) => set({ processingStep: step }),
  setProcessingProgress: (progress) => set({ processingProgress: progress }),
  
  setResults: (results) => set({ results: results }),
  
  setError: (error) => set({ error: error }),
  
  reset: () => set({
    currentView: 'setup',
    isRecording: false,
    recordingDuration: 0,
    recordingData: null,
    frameData: [],
    processingStep: null,
    processingProgress: 0,
    results: null,
    error: null,
    // Note: scriptBlocks, bulletPoints, promptMode and transcriptionSettings are intentionally NOT reset
    // so user can re-record without losing their script or language preference
  }),
}));
