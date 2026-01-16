import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
// Header is now global via Navbar in App.tsx
import { WizardLayout } from "@/components/WizardLayout";
import { BriefData } from "@/components/ProjectBrief";
import { Step1Hook, EntryMode } from "@/components/steps/Step1Hook";
import { Step2Audience } from "@/components/steps/Step2Audience";
import { AutoGenerateOverlay } from "@/components/landing/AutoGenerateOverlay";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrapedProjectData } from "@/lib/api/firecrawl";
import { ParsedPresentation } from "@/lib/api/presentationParser";
import { generateAutoPitch, isUrl } from "@/services/mockScraper";
import { trackEvent } from "@/utils/analytics";
import { saveDuration, getStoredDuration } from "@/hooks/usePitchDuration";
import { AudienceType } from "@/components/landing/HeroSection";
import { useUserStore } from "@/stores/userStore";

// Lazy load heavy components to reduce initial bundle
const Dashboard = lazy(() => import("@/components/Dashboard").then(m => ({ default: m.Dashboard })));
const AICoachPage = lazy(() => import("@/components/ai-coach/AICoachPage").then(m => ({ default: m.AICoachPage })));
const Step7Generation = lazy(() => import("@/components/steps/Step7Generation").then(m => ({ default: m.Step7Generation })));
const CustomScriptStep = lazy(() => import("@/components/steps/CustomScriptStep").then(m => ({ default: m.CustomScriptStep })));
// Track-specific step imports (kept synchronous as they're part of core wizard flow)
import { 
  HackathonPainStep, 
  HackathonFixStep, 
  HackathonProgressStep, 
  HackathonFeasibilityStep 
} from "@/components/steps/tracks/HackathonNoDemoSteps";

import {
  InvestorOpportunityStep,
  InvestorMarketStep,
  InvestorTractionStep,
  InvestorBusinessModelStep,
  InvestorAskStep,
} from "@/components/steps/tracks/InvestorSteps";

import {
  AcademicTopicStep,
  AcademicResearchFrameStep,
  AcademicMethodologyStep,
  AcademicResultsStep,
  AcademicConclusionsStep,
} from "@/components/steps/tracks/AcademicSteps";

import {
  GrandmaConnectionStep,
  GrandmaPainStep,
  GrandmaAnalogyStep,
  GrandmaBenefitsStep,
  GrandmaSafetyStep,
} from "@/components/steps/tracks/GrandmaSteps";

import {
  PeersHookStep,
  PeersStruggleStep,
  PeersThingStep,
  PeersWhyCareStep,
  PeersHowToStep,
  PeersComparisonStep,
  PeersAuthenticWhyStep,
  PeersCTAStep,
} from "@/components/steps/tracks/PeersSteps";

// Loading fallback for lazy components
const StepLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

import { TrackType, trackConfigs, determineTrack, calculateTrackPrepTime } from "@/lib/tracks";

// Track-specific data interfaces
interface HackathonData {
  pain?: string;
  fix?: string;
  progress?: string;
  feasibility?: string;
}

interface InvestorData {
  opportunity?: string;
  market?: string;
  traction?: string;
  businessModel?: string;
  ask?: string;
}

interface AcademicData {
  topic?: string;
  researchFrame?: string;
  methodology?: string;
  results?: string;
  conclusions?: string;
}

interface GrandmaData {
  connection?: string;
  pain?: string;
  analogy?: string;
  benefits?: string;
  safety?: string;
}

interface PeersData {
  hook?: string;
  struggle?: string;
  thing?: string;
  whyCare?: string[];
  howTo?: string;
  comparison?: string;
  authenticWhy?: string;
  cta?: string;
}

interface StructuredScriptBlock {
  label: string;
  text: string;
  estimated_seconds: number;
}

interface StructuredScript {
  blocks: StructuredScriptBlock[];
  total_words: number;
  estimated_total_seconds: number;
}

interface PresentationData {
  data: ParsedPresentation;
  filename: string;
}

interface PitchData {
  idea: string;
  audience: string;
  audienceLabel: string;
  track: TrackType;
  trackData: HackathonData | InvestorData | AcademicData | GrandmaData | PeersData;
  generationTier: string;
  entryMode: EntryMode;
  customScript?: string;
  structuredScript?: StructuredScript;
  hookStyle?: 'auto' | 'statistic' | 'villain' | 'story' | 'contrarian' | 'question';
  duration?: number;
  presentation?: PresentationData | null;
}

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUserStore();
  
  const [step, setStep] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
  const [showAutoGenerateOverlay, setShowAutoGenerateOverlay] = useState(false);
  const [autoGenerateInput, setAutoGenerateInput] = useState("");
  const [autoGenerateIsUrl, setAutoGenerateIsUrl] = useState(false);
  const [pendingAutoData, setPendingAutoData] = useState<ScrapedProjectData | undefined>(undefined);
  // Initialize from localStorage for persistence between sessions
  const [pendingDuration, setPendingDuration] = useState<number>(() => getStoredDuration());
  const [pendingAudience, setPendingAudience] = useState<AudienceType | undefined>(undefined);
  
  const [data, setData] = useState<Partial<PitchData>>({ entryMode: "generate" });
  const [trackStep, setTrackStep] = useState(0);
  const [isStructuring, setIsStructuring] = useState(false);
  const [loadedPitchData, setLoadedPitchData] = useState<{
    speechBlocks: unknown;
    meta: unknown;
  } | null>(null);

  // Handle loading saved pitch from navigation state
  useEffect(() => {
    const loadSavedPitch = async () => {
      const state = location.state as { loadPitchId?: string } | null;
      if (!state?.loadPitchId || !isLoggedIn || !user) return;
      
      try {
        const { data: pitch, error } = await supabase
          .from('saved_pitches')
          .select('*')
          .eq('id', state.loadPitchId)
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        // Set pitch data and navigate to dashboard
        setData({
          idea: pitch.idea,
          track: pitch.track as TrackType,
          trackData: {},
          audience: pitch.audience || undefined,
          audienceLabel: pitch.audience_label || undefined,
          duration: pitch.duration_minutes,
          hookStyle: pitch.hook_style as PitchData['hookStyle'],
          entryMode: pitch.generation_mode as EntryMode || 'generate',
          generationTier: 'pro',
        });
        
        // Store loaded pitch data for Dashboard
        setLoadedPitchData({
          speechBlocks: pitch.speech_blocks,
          meta: pitch.meta,
        });
        
        setPendingDuration(pitch.duration_minutes);
        setShowDashboard(true);
        
        // Clear navigation state
        navigate('/', { replace: true, state: {} });
        
        toast({
          title: "Pitch Loaded",
          description: `Continuing with "${pitch.title.slice(0, 40)}..."`,
        });
        
        trackEvent('Pitch: Loaded', { pitch_id: state.loadPitchId });
      } catch (err) {
        console.error('Failed to load pitch:', err);
        toast({
          title: "Error",
          description: "Failed to load saved pitch",
          variant: "destructive",
        });
      }
    };
    
    loadSavedPitch();
  }, [location.state, isLoggedIn, user, navigate]);

  // Handler for duration changes from sidebar - saves to localStorage
  const handleDurationChangeFromSidebar = useCallback((newDuration: number) => {
    setPendingDuration(newDuration);
    saveDuration(newDuration);
    setData(prev => ({ ...prev, duration: newDuration }));
    toast({
      title: "Duration Updated",
      description: `Pitch length set to ${newDuration < 1 ? `${newDuration * 60}s` : `${newDuration} min`}`,
    });
  }, []);

  // Handler for presentation upload
  const handlePresentationParsed = useCallback((presentationData: ParsedPresentation, filename: string) => {
    setData(prev => ({ 
      ...prev, 
      presentation: { data: presentationData, filename } 
    }));
    trackEvent('presentation_uploaded', { 
      slides: presentationData.total_slides,
      words: presentationData.total_words 
    });
  }, []);

  const handlePresentationRemoved = useCallback(() => {
    setData(prev => ({ ...prev, presentation: null }));
  }, []);

  const currentTrack = data.track;
  const trackConfig = currentTrack ? trackConfigs[currentTrack] : null;
  const totalSteps = trackConfig ? trackConfig.stepCount + 2 : 6;

  const handleBack = () => {
    if (data.entryMode === "custom_script" && step === 1) {
      // Go back to landing from custom script input
      setStep(0);
      setData({ entryMode: "generate" });
      return;
    }
    
    if (trackStep > 0) {
      setTrackStep(trackStep - 1);
    } else if (step > 0) {
      setStep(step - 1);
      if (step === 2) {
        setData({ ...data, track: undefined, trackData: {} });
      }
    }
  };

  const handleLogoClick = () => {
    setStep(0);
    setTrackStep(0);
    setShowDashboard(false);
    setShowAICoach(false);
    setData({ entryMode: "generate" });
  };

  // Open AI Coach - wire script to store if available
  const handleOpenAICoach = (scriptBlocks?: Array<{ title: string; content: string }>) => {
    // Import dynamically to avoid circular dependency issues
    import('@/stores/aiCoachStore').then(({ useAICoachStore }) => {
      const store = useAICoachStore.getState();
      if (scriptBlocks && scriptBlocks.length > 0) {
        store.setScriptBlocks(scriptBlocks);
      }
      // Pass the current track type to the store
      if (data.track) {
        store.setPitchTrack(data.track);
      }
    });
    setShowAICoach(true);
  };

  const handleCloseAICoach = () => {
    setShowAICoach(false);
  };

  // Step 1: Landing with idea input (customize mode)
  const handleStep1 = (idea: string, scrapedData?: ScrapedProjectData, durationMinutes?: number) => {
    // Store duration in pending state for use when generating
    if (durationMinutes) {
      setPendingDuration(durationMinutes);
    }
    setData({ 
      ...data, 
      idea: scrapedData?.name || idea, 
      entryMode: "generate",
      duration: durationMinutes || pendingDuration || 3, // Store duration immediately
      // Pre-fill track data if we have scraped data
      ...(scrapedData && {
        trackData: {
          pain: scrapedData.problem,
          fix: scrapedData.solution,
        }
      })
    });
    setStep(1);
    toast({
      title: scrapedData ? "URL Data Imported!" : "Idea Captured!",
      description: `Let's customize your ${durationMinutes || pendingDuration || 3} min pitch...`,
    });
  };

  // Auto-generate: Skip wizard entirely - NOW REQUIRES audience + duration
  const handleAutoGenerate = (idea: string, scrapedData?: ScrapedProjectData, durationMinutes?: number, audience?: AudienceType) => {
    // Duration and audience are now REQUIRED - use proper checks
    // durationMinutes could be 0.5 which is falsy with !durationMinutes, so check explicitly
    const hasValidDuration = durationMinutes !== undefined && durationMinutes !== null && durationMinutes > 0;
    const hasValidAudience = audience !== undefined && audience !== null;
    
    if (!hasValidDuration || !hasValidAudience) {
      console.log('Auto-generate validation failed:', { durationMinutes, hasValidDuration, audience, hasValidAudience });
      toast({
        title: "Missing Required Fields",
        description: "Please select both audience and duration before generating",
        variant: "destructive",
      });
      return;
    }
    
    const durationLabel = durationMinutes < 1 
      ? `${durationMinutes * 60} seconds` 
      : `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`;
    const wordCount = Math.round(durationMinutes * 130);
    
    console.log('Auto-generate starting with:', { idea, durationMinutes, audience });
    
    setAutoGenerateInput(idea);
    setAutoGenerateIsUrl(isUrl(idea) || !!scrapedData);
    setPendingAutoData(scrapedData);
    setPendingDuration(durationMinutes);
    setPendingAudience(audience);
    setShowAutoGenerateOverlay(true);
    
    // Show confirmation toast with duration + audience info
    toast({
      title: `⏱️ Generating ${durationLabel} pitch`,
      description: `For ${audience} audience, ~${wordCount} words`,
    });
  };

  // Called when auto-generate overlay completes
  const handleAutoGenerateComplete = useCallback(() => {
    const autoPitch = generateAutoPitch(autoGenerateInput, pendingAutoData, pendingDuration, pendingAudience);
    
    setData({
      ...data,
      idea: autoPitch.idea,
      track: autoPitch.track,
      audience: pendingAudience,
      audienceLabel: autoPitch.audienceLabel,
      trackData: autoPitch.trackData,
      entryMode: "generate",
      duration: pendingDuration, // Pass the user-selected duration to Dashboard
    });
    
    setShowAutoGenerateOverlay(false);
    setShowDashboard(true);
    
    const durationLabel = pendingDuration < 1 
      ? `${pendingDuration}s` 
      : `${pendingDuration}min`;
    
    toast({
      title: "🎉 Pitch Auto-Generated!",
      description: `${autoPitch.audienceLabel} pitch ready (${durationLabel}, ~${autoPitch.estimatedWords} words)`,
    });
  }, [autoGenerateInput, pendingAutoData, pendingDuration, pendingAudience, data]);

  // Entry: Practice your own pitch
  const handlePracticeOwn = () => {
    setData({ ...data, entryMode: "custom_script" });
    setStep(1);
  };

  // Custom script submission
  const handleCustomScriptSubmit = async (script: string) => {
    setIsStructuring(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('structure-script', {
        body: { script },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      const structuredScript = result as StructuredScript;
      
      // Extract idea from first block or first sentence
      const firstBlock = structuredScript.blocks[0];
      const idea = firstBlock?.text.split(/[.!?]/)[0]?.trim() || "My Pitch";

      setData({
        ...data,
        customScript: script,
        structuredScript,
        idea: idea.length > 50 ? idea.slice(0, 50) + "..." : idea,
        entryMode: "custom_script",
      });

      // Go directly to dashboard for custom scripts
      setShowDashboard(true);
      
      toast({
        title: "Script Structured!",
        description: `${structuredScript.blocks.length} sections identified. Ready to practice!`,
      });
    } catch (err) {
      console.error("Failed to structure script:", err);
      toast({
        title: "Structuring Failed",
        description: err instanceof Error ? err.message : "Failed to structure script",
        variant: "destructive",
      });
    } finally {
      setIsStructuring(false);
    }
  };

  // Step 2: Audience selection -> determines track
  const handleStep2 = (audience: string, audienceLabel: string, hookStyle?: 'auto' | 'statistic' | 'villain' | 'story' | 'contrarian' | 'question') => {
    const track = determineTrack(audience, "none");
    // Preserve duration from previous step
    setData({ 
      ...data, 
      audience, 
      audienceLabel, 
      track, 
      trackData: {}, 
      hookStyle: hookStyle || 'auto',
      duration: data.duration || pendingDuration || 3, // Preserve duration
    });
    setStep(2);
    setTrackStep(0);
    trackEvent('Onboarding: Step Completed', { step: 'Audience Selection', hookStyle, duration: data.duration || pendingDuration });
    toast({
      title: "Track Selected!",
      description: `${trackConfigs[track].name} mode activated`,
    });
  };

  // Generic handler for track step progression
  const handleTrackStepNext = (fieldName: string, value: unknown) => {
    setData({
      ...data,
      trackData: { ...(data.trackData || {}), [fieldName]: value },
      duration: data.duration || pendingDuration || 3, // Always preserve duration
    });
    
    const maxTrackSteps = trackConfig?.stepCount || 4;
    if (trackStep + 1 >= maxTrackSteps) {
      trackEvent('Onboarding: Step Completed', { step: 'Track Details', duration: data.duration || pendingDuration });
      setStep(3);
    } else {
      setTrackStep(trackStep + 1);
    }
  };

  // Generation step
  const handleGeneration = (tier: string, tierLabel: string) => {
    const durationToUse = data.duration || pendingDuration || 3;
    setData({ ...data, generationTier: tier, duration: durationToUse });
    setShowDashboard(true);
    trackEvent('Onboarding: Step Completed', { step: 'Generation', duration: durationToUse });
    const durationLabel = durationToUse < 1 ? `${durationToUse * 60}s` : `${durationToUse} min`;
    toast({
      title: "🎉 Pitch Generated!",
      description: `${tierLabel} ${durationLabel} pitch ready. You saved hours!`,
    });
  };

  // Calculate current progress for sidebar
  const currentProgress = step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 2 + trackStep : totalSteps;
  const prepTime = currentTrack 
    ? calculateTrackPrepTime(currentTrack, currentProgress, totalSteps)
    : 315 - (step * 50);

  // Build brief data for sidebar with track-specific fields
  const buildBriefData = (): BriefData => {
    const base: BriefData = {
      projectName: data.idea,
      audienceLabel: data.audienceLabel,
      prepTime,
      pitchDuration: data.duration || pendingDuration,
      onDurationChange: handleDurationChangeFromSidebar,
      // Presentation support
      presentation: data.presentation,
      onPresentationParsed: handlePresentationParsed,
      onPresentationRemoved: handlePresentationRemoved,
    };

    if (!currentTrack || !data.trackData) return base;

    const td = data.trackData;

    switch (currentTrack) {
      case 'hackathon-no-demo': {
        const hd = td as HackathonData;
        return {
          ...base,
          problem: hd.pain,
          solution: hd.fix,
          description: hd.progress ? `Work: ${hd.progress.slice(0, 50)}...` : undefined,
        };
      }
      case 'investor': {
        const id = td as InvestorData;
        return {
          ...base,
          problem: id.opportunity,
          solution: id.businessModel,
          description: id.ask ? `Ask: ${id.ask.slice(0, 50)}...` : undefined,
        };
      }
      case 'academic': {
        const ad = td as AcademicData;
        return {
          ...base,
          problem: ad.topic,
          solution: ad.methodology,
          description: ad.conclusions ? `Conclusions: ${ad.conclusions.slice(0, 50)}...` : undefined,
        };
      }
      case 'grandma': {
        const gd = td as GrandmaData;
        return {
          ...base,
          problem: gd.pain,
          solution: gd.analogy,
          description: gd.benefits,
        };
      }
      case 'peers': {
        const pd = td as PeersData;
        return {
          ...base,
          problem: pd.struggle,
          solution: pd.thing,
          description: pd.hook ? `Hook: ${pd.hook}` : undefined,
        };
      }
      default:
        return base;
    }
  };

  const briefData = buildBriefData();


  // AI Coach view
  if (showAICoach) {
    return (
      <Suspense fallback={<StepLoader />}>
        <AICoachPage 
          onBack={handleCloseAICoach} 
          onEditScript={handleCloseAICoach}
        />
      </Suspense>
    );
  }

  // Dashboard view after generation
  if (showDashboard) {
    const td = data.trackData || {};
    
    // For custom scripts, pass the structured data
    if (data.entryMode === "custom_script" && data.structuredScript) {
      return (
        <Suspense fallback={<StepLoader />}>
          <Dashboard
            data={{
              idea: data.idea || "My Pitch",
              duration: data.duration || 3,
              track: 'hackathon-no-demo', // Default track for custom scripts
              trackData: {},
              audienceLabel: "Custom Script",
              entryMode: "custom_script",
              structuredScript: data.structuredScript,
              originalScriptText: data.customScript,
            }}
          />
        </Suspense>
      );
    }

    const handleEditInputs = () => {
      // Go back to the last track step to edit inputs
      setShowDashboard(false);
      const maxTrackSteps = trackConfig?.stepCount || 4;
      setStep(2);
      setTrackStep(maxTrackSteps - 1); // Go to last track step
    };

    return (
      <Suspense fallback={<StepLoader />}>
        <Dashboard
          data={{
            idea: data.idea || "",
            duration: data.duration || 3,
            track: data.track || 'hackathon-no-demo',
            trackData: td as Record<string, unknown>,
            audienceLabel: data.audienceLabel,
            entryMode: "generate",
            hookStyle: data.hookStyle,
          }}
          onEditInputs={handleEditInputs}
          initialData={loadedPitchData ? {
            speechBlocks: loadedPitchData.speechBlocks as Array<{
              timeStart: string;
              timeEnd: string;
              title: string;
              content: string;
              isDemo?: boolean;
              visualCue?: string;
            }>,
            meta: loadedPitchData.meta as {
              targetWordCount: number;
              actualWordCount: number;
              fullScript?: string;
              bulletPoints?: string[];
              estimatedDuration?: string;
              hookStyle?: string;
            } | undefined,
          } : undefined}
        />
      </Suspense>
    );
  }

  // Landing page (Step 0)
  if (step === 0) {
    return (
      <>
        <Step1Hook 
          onNext={handleStep1}
          onAutoGenerate={handleAutoGenerate}
          onPracticeOwn={handlePracticeOwn}
          onOpenAICoach={handleOpenAICoach}
        />
        <AutoGenerateOverlay
          isVisible={showAutoGenerateOverlay}
          isUrlMode={autoGenerateIsUrl}
          inputValue={autoGenerateInput}
          durationMinutes={pendingDuration}
          onComplete={handleAutoGenerateComplete}
        />
      </>
    );
  }

  // Custom script input (Step 1 for custom_script mode)
  if (step === 1 && data.entryMode === "custom_script") {
    return (
      <WizardLayout
        briefData={{ projectName: "Your Pitch", prepTime: 85 }}
        currentStep={1}
        totalSteps={2}
        onLogoClick={handleLogoClick}
      >
        <Suspense fallback={<StepLoader />}>
          <CustomScriptStep
            onNext={handleCustomScriptSubmit}
            onBack={handleBack}
            initialValue={data.customScript}
          />
        </Suspense>
        {isStructuring && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium">Analyzing your script...</p>
              <p className="text-sm text-muted-foreground">Identifying sections and structure</p>
            </div>
          </div>
        )}
      </WizardLayout>
    );
  }

  // Render track-specific steps
  const renderTrackSteps = () => {
    if (!currentTrack) return null;
    const td = (data.trackData || {}) as Record<string, unknown>;

    switch (currentTrack) {
      case 'hackathon-no-demo':
        switch (trackStep) {
          case 0:
            return <HackathonPainStep key="pain" onNext={(v) => handleTrackStepNext('pain', v)} onBack={handleBack} initialValue={td.pain as string} idea={data.idea} />;
          case 1:
            return <HackathonFixStep key="fix" onNext={(v) => handleTrackStepNext('fix', v)} onBack={handleBack} initialValue={td.fix as string} idea={data.idea} pain={td.pain as string} />;
          case 2:
            return <HackathonProgressStep key="progress" onNext={(v) => handleTrackStepNext('progress', v)} onBack={handleBack} initialValue={td.progress as string} idea={data.idea} />;
          case 3:
            return <HackathonFeasibilityStep key="feasibility" onNext={(v) => handleTrackStepNext('feasibility', v)} onBack={handleBack} initialValue={td.feasibility as string} />;
        }
        break;

      case 'investor':
        switch (trackStep) {
          case 0:
            return <InvestorOpportunityStep key="opportunity" onNext={(v) => handleTrackStepNext('opportunity', v)} onBack={handleBack} initialValue={td.opportunity as string} idea={data.idea} />;
          case 1:
            return <InvestorMarketStep key="market" onNext={(v) => handleTrackStepNext('market', v)} onBack={handleBack} initialValue={td.market as string} idea={data.idea} />;
          case 2:
            return <InvestorTractionStep key="traction" onNext={(v) => handleTrackStepNext('traction', v)} onBack={handleBack} initialValue={td.traction as string} idea={data.idea} />;
          case 3:
            return <InvestorBusinessModelStep key="businessModel" onNext={(v) => handleTrackStepNext('businessModel', v)} onBack={handleBack} initialValue={td.businessModel as string} idea={data.idea} />;
          case 4:
            return <InvestorAskStep key="ask" onNext={(v) => handleTrackStepNext('ask', v)} onBack={handleBack} initialValue={td.ask as string} idea={data.idea} />;
        }
        break;

      case 'academic':
        switch (trackStep) {
          case 0:
            return <AcademicTopicStep key="topic" onNext={(v) => handleTrackStepNext('topic', v)} onBack={handleBack} initialValue={td.topic as string} idea={data.idea} />;
          case 1:
            return <AcademicResearchFrameStep key="frame" onNext={(v) => handleTrackStepNext('researchFrame', v)} onBack={handleBack} initialValue={td.researchFrame as string} idea={data.idea} />;
          case 2:
            return <AcademicMethodologyStep key="methodology" onNext={(v) => handleTrackStepNext('methodology', v)} onBack={handleBack} initialValue={td.methodology as string} idea={data.idea} />;
          case 3:
            return <AcademicResultsStep key="results" onNext={(v) => handleTrackStepNext('results', v)} onBack={handleBack} initialValue={td.results as string} idea={data.idea} />;
          case 4:
            return <AcademicConclusionsStep key="conclusions" onNext={(v) => handleTrackStepNext('conclusions', v)} onBack={handleBack} initialValue={td.conclusions as string} idea={data.idea} />;
        }
        break;

      case 'grandma':
        switch (trackStep) {
          case 0:
            return <GrandmaConnectionStep key="connection" onNext={(v) => handleTrackStepNext('connection', v)} onBack={handleBack} initialValue={td.connection as string} idea={data.idea} />;
          case 1:
            return <GrandmaPainStep key="pain" onNext={(v) => handleTrackStepNext('pain', v)} onBack={handleBack} initialValue={td.pain as string} idea={data.idea} />;
          case 2:
            return <GrandmaAnalogyStep key="analogy" onNext={(v) => handleTrackStepNext('analogy', v)} onBack={handleBack} initialValue={td.analogy as string} idea={data.idea} />;
          case 3:
            return <GrandmaBenefitsStep key="benefits" onNext={(v) => handleTrackStepNext('benefits', v)} onBack={handleBack} initialValue={td.benefits as string} idea={data.idea} />;
          case 4:
            return <GrandmaSafetyStep key="safety" onNext={(v) => handleTrackStepNext('safety', v)} onBack={handleBack} initialValue={td.safety as string} idea={data.idea} />;
        }
        break;

      case 'peers':
        switch (trackStep) {
          case 0:
            return <PeersHookStep key="hook" onNext={(v) => handleTrackStepNext('hook', v)} onBack={handleBack} initialValue={td.hook as string} idea={data.idea} />;
          case 1:
            return <PeersStruggleStep key="struggle" onNext={(v) => handleTrackStepNext('struggle', v)} onBack={handleBack} initialValue={td.struggle as string} />;
          case 2:
            return <PeersThingStep key="thing" onNext={(v) => handleTrackStepNext('thing', v)} onBack={handleBack} initialValue={td.thing as string} idea={data.idea} />;
          case 3:
            return <PeersWhyCareStep key="whyCare" onNext={(v) => handleTrackStepNext('whyCare', v)} onBack={handleBack} initialValue={td.whyCare as string[]} idea={data.idea} />;
          case 4:
            return <PeersHowToStep key="howTo" onNext={(v) => handleTrackStepNext('howTo', v)} onBack={handleBack} initialValue={td.howTo as string} idea={data.idea} />;
          case 5:
            return <PeersComparisonStep key="comparison" onNext={(v) => handleTrackStepNext('comparison', v)} onBack={handleBack} initialValue={td.comparison as string} idea={data.idea} />;
          case 6:
            return <PeersAuthenticWhyStep key="authenticWhy" onNext={(v) => handleTrackStepNext('authenticWhy', v)} onBack={handleBack} initialValue={td.authenticWhy as string} idea={data.idea} />;
          case 7:
            return <PeersCTAStep key="cta" onNext={(v) => handleTrackStepNext('cta', v)} onBack={handleBack} initialValue={td.cta as string} idea={data.idea} />;
        }
        break;

      case 'hackathon-with-demo':
        switch (trackStep) {
          case 0:
            return <HackathonPainStep key="pain" onNext={(v) => handleTrackStepNext('pain', v)} onBack={handleBack} initialValue={td.pain as string} idea={data.idea} />;
          case 1:
            return <HackathonFixStep key="fix" onNext={(v) => handleTrackStepNext('fix', v)} onBack={handleBack} initialValue={td.fix as string} idea={data.idea} pain={td.pain as string} />;
          case 2:
            return <HackathonProgressStep key="progress" onNext={(v) => handleTrackStepNext('progress', v)} onBack={handleBack} initialValue={td.progress as string} idea={data.idea} />;
          case 3:
            return <HackathonFeasibilityStep key="feasibility" onNext={(v) => handleTrackStepNext('feasibility', v)} onBack={handleBack} initialValue={td.feasibility as string} />;
        }
        break;
    }
    return null;
  };

  // Wizard steps
  return (
    <WizardLayout
      briefData={briefData}
      currentStep={currentProgress}
      totalSteps={totalSteps}
      onLogoClick={handleLogoClick}
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <Step2Audience
            key="audience"
            onNext={handleStep2}
            onBack={handleBack}
          />
        )}
        {step === 2 && renderTrackSteps()}
        {step === 3 && (
          <Suspense fallback={<StepLoader />}>
            <Step7Generation
              key="generation"
              onNext={handleGeneration}
              onBack={handleBack}
              track={data.track}
              idea={data.idea}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </WizardLayout>
  );
};

export default Index;
