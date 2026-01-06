// Track types and configuration for dynamic branching wizard

export type TrackType = 
  | 'hackathon-no-demo' 
  | 'hackathon-with-demo' 
  | 'investor' 
  | 'academic' 
  | 'grandma'
  | 'peers';

export interface TrackConfig {
  id: TrackType;
  name: string;
  description: string;
  stepCount: number;
  baseTime: number; // Base prep time in minutes
  finalTime: number; // Final prep time after completion
  color: string;
  outputStructure: string[];
}

export const trackConfigs: Record<TrackType, TrackConfig> = {
  'hackathon-no-demo': {
    id: 'hackathon-no-demo',
    name: 'Hackathon (Slides Only)',
    description: 'Technical jury without live demo - focus on architecture and progress',
    stepCount: 6,
    baseTime: 280,
    finalTime: 35,
    color: 'from-violet-500 to-violet-600',
    outputStructure: ['Problem', 'Existing Solutions', 'Solution', 'Hackathon Work', 'Feasibility', 'Target', 'Next Steps', 'Closing'],
  },
  'hackathon-with-demo': {
    id: 'hackathon-with-demo',
    name: 'Hackathon (With Demo)',
    description: 'Technical jury with live demo - high reward, needs choreography',
    stepCount: 6,
    baseTime: 360, // High prep time for demo choreography
    finalTime: 45,
    color: 'from-red-500 to-red-600',
    outputStructure: ['Problem', 'Solution', 'DEMO (Central)', 'Work Done', 'Feasibility', 'Target', 'Next Steps', 'Closing'],
  },
  'investor': {
    id: 'investor',
    name: 'Investor Pitch',
    description: 'VCs and investors - focus on market, traction, and the ask',
    stepCount: 7,
    baseTime: 340,
    finalTime: 40,
    color: 'from-emerald-500 to-emerald-600',
    outputStructure: ['Problem', 'Solution', 'Market', 'Traction', 'Business Model', 'Competition', 'Team', 'Plan', 'The Ask'],
  },
  'academic': {
    id: 'academic',
    name: 'Academic Defense',
    description: 'Thesis defense - strict structure, data-driven arguments',
    stepCount: 7,
    baseTime: 420, // Very high prep time for accuracy
    finalTime: 50,
    color: 'from-blue-500 to-blue-600',
    outputStructure: ['Intro', 'Problem', 'Goal', 'Methodology', 'Results', 'Conclusions', 'Proposals', 'Novelty'],
  },
  'grandma': {
    id: 'grandma',
    name: 'Simple Explanation',
    description: 'Non-technical audience - emotional, relatable, simple',
    stepCount: 6,
    baseTime: 180, // Low prep time for simplicity
    finalTime: 20,
    color: 'from-amber-500 to-amber-600',
    outputStructure: ['Why', 'Problem', 'What Is It', 'Benefits', 'Usage', 'Safety', 'Care'],
  },
  'peers': {
    id: 'peers',
    name: 'Peers & Friends',
    description: 'Casual pitch to classmates, friends, or student clubs - authentic and no-BS',
    stepCount: 8,
    baseTime: 120, // Low prep time - casual but structured
    finalTime: 15,
    color: 'from-fuchsia-500 to-purple-600',
    outputStructure: ['Hook', 'Relatable Problem', 'Definition', 'Benefits', 'How-to', 'Comparison', 'Personal Story', 'Chill CTA'],
  },
};

// Determine track based on audience and demo selections
export function determineTrack(audience: string, demoType: string): TrackType {
  // Academic track
  if (audience === 'academic') {
    return 'academic';
  }
  
  // Grandma/Non-tech track
  if (audience === 'nontech') {
    return 'grandma';
  }
  
  // Peers/Friends track
  if (audience === 'peers') {
    return 'peers';
  }
  
  // Investor track
  if (audience === 'investors') {
    return 'investor';
  }
  
  // Hackathon tracks (Jury/Judges)
  if (audience === 'judges' || audience === 'users') {
    // With demo: live, prototype, or video
    if (demoType === 'live' || demoType === 'prototype' || demoType === 'video') {
      return 'hackathon-with-demo';
    }
    // No demo: slides only
    return 'hackathon-no-demo';
  }
  
  // Default to hackathon no demo
  return 'hackathon-no-demo';
}

// Calculate prep time based on track and step progress
export function calculateTrackPrepTime(track: TrackType, currentStep: number, totalSteps: number): number {
  const config = trackConfigs[track];
  const progress = currentStep / totalSteps;
  
  // Linear interpolation from baseTime to finalTime
  const timeRange = config.baseTime - config.finalTime;
  const currentTime = config.baseTime - (timeRange * progress);
  
  return Math.round(currentTime);
}

// Track-specific field labels for sidebar
export interface TrackFieldLabels {
  field1: { label: string; icon: string };
  field2: { label: string; icon: string };
  field3: { label: string; icon: string };
  field4?: { label: string; icon: string };
  field5?: { label: string; icon: string };
}

export const trackFieldLabels: Record<TrackType, TrackFieldLabels> = {
  'hackathon-no-demo': {
    field1: { label: 'Pain Point', icon: 'AlertCircle' },
    field2: { label: 'Fix', icon: 'Lightbulb' },
    field3: { label: 'Work Done', icon: 'Code' },
    field4: { label: 'Feasibility', icon: 'CheckCircle' },
  },
  'hackathon-with-demo': {
    field1: { label: 'Context', icon: 'MessageCircle' },
    field2: { label: 'Demo Flow', icon: 'Play' },
    field3: { label: 'Architecture', icon: 'Layers' },
    field4: { label: 'Fallback Ready', icon: 'Shield' },
  },
  'investor': {
    field1: { label: 'Opportunity', icon: 'Target' },
    field2: { label: 'Market Size', icon: 'BarChart' },
    field3: { label: 'Traction', icon: 'TrendingUp' },
    field4: { label: 'Business Model', icon: 'DollarSign' },
    field5: { label: 'The Ask', icon: 'Banknote' },
  },
  'academic': {
    field1: { label: 'Topic', icon: 'BookOpen' },
    field2: { label: 'Research Frame', icon: 'Target' },
    field3: { label: 'Methodology', icon: 'FlaskConical' },
    field4: { label: 'Key Results', icon: 'LineChart' },
    field5: { label: 'Conclusions', icon: 'GraduationCap' },
  },
  'grandma': {
    field1: { label: 'Connection', icon: 'Heart' },
    field2: { label: 'Pain', icon: 'Frown' },
    field3: { label: 'Analogy', icon: 'Sparkles' },
    field4: { label: 'Benefits', icon: 'Gift' },
    field5: { label: 'Safety', icon: 'ShieldCheck' },
  },
  'peers': {
    field1: { label: 'Hook', icon: 'Zap' },
    field2: { label: 'Struggle', icon: 'Flame' },
    field3: { label: 'The Thing', icon: 'Sparkles' },
    field4: { label: 'Why Care', icon: 'PartyPopper' },
    field5: { label: 'Vibe', icon: 'Smile' },
  },
};
