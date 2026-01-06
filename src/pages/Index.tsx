import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { WizardLayout } from "@/components/WizardLayout";
import { BriefData } from "@/components/ProjectBrief";
import { Step1Hook } from "@/components/steps/Step1Hook";
import { Step2Audience } from "@/components/steps/Step2Audience";
import { Step4Problem } from "@/components/steps/Step4Problem";
import { Step5Solution } from "@/components/steps/Step5Solution";
import { Step6Business } from "@/components/steps/Step6Business";
import { Step7Generation } from "@/components/steps/Step7Generation";
import { Dashboard } from "@/components/Dashboard";
import { toast } from "@/hooks/use-toast";

interface PitchData {
  idea: string;
  duration: number;
  audience: string;
  audienceLabel: string;
  problem: string;
  persona: { description: string; keywords: string[] };
  pitch: string;
  solutionDescription?: string;
  models: string[];
  generationTier: string;
}

// Time calculation based on step progress - starts from Manual Grind time (5h 15m)
const calculatePrepTime = (step: number): number => {
  const baseTime = 315; // 5h 15m in minutes (Manual Grind time from landing page)
  
  // Time at each step, decreasing from 5h 15m to 30m (now 6 steps instead of 7)
  const timeAtStep: Record<number, number> = {
    0: 315,    // Step 0 (Landing): 5h 15m
    1: 250,    // Step 1 (Audience): 4h 10m
    2: 180,    // Step 2 (Problem): 3h 00m
    3: 110,    // Step 3 (Solution): 1h 50m
    4: 60,     // Step 4 (Business): 1h 00m
    5: 30,     // Step 5 (Generation): 0h 30m (Final)
  };

  return timeAtStep[step] ?? baseTime;
};

const Index = () => {
  const [step, setStep] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const [data, setData] = useState<Partial<PitchData>>({});

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleLogoClick = () => {
    setStep(0);
    setShowDashboard(false);
  };

  // Step 1: Landing with idea input
  const handleStep1 = (idea: string) => {
    setData({ ...data, idea });
    setStep(1);
    toast({
      title: "Idea Captured!",
      description: "Let's customize your pitch...",
    });
  };

  // Step 2: Audience selection -> goes directly to Problem
  const handleStep2 = (audience: string, audienceLabel: string) => {
    setData({ ...data, audience, audienceLabel });
    setStep(2);
    toast({
      title: "Audience Selected!",
      description: `Tailoring pitch for ${audienceLabel}`,
    });
  };

  // Step 3: Problem selection
  const handleStep3 = (problem: string) => {
    setData({ ...data, problem });
    setStep(3);
    toast({
      title: "Problem Defined!",
      description: "Core pain point identified",
    });
  };

  // Step 4: Solution pitch
  const handleStep4 = (pitch: string, solutionDescription?: string) => {
    setData({ ...data, pitch, solutionDescription });
    setStep(4);
    toast({
      title: "Pitch Locked!",
      description: "Elevator pitch ready",
    });
  };

  // Step 5: Business model
  const handleStep5 = (models: string[]) => {
    setData({ ...data, models });
    setStep(5);
    toast({
      title: "Monetization Set!",
      description: `${models.length} revenue model(s) selected`,
    });
  };

  // Step 6: Generation tier and generate
  const handleStep6 = (tier: string, tierLabel: string) => {
    setData({ ...data, generationTier: tier });
    setShowDashboard(true);
    toast({
      title: "🎉 Pitch Generated!",
      description: `${tierLabel} package ready. You saved hours!`,
    });
  };

  // Build brief data for sidebar
  const briefData: BriefData = {
    projectName: data.idea,
    audienceLabel: data.audienceLabel,
    problem: data.problem,
    solution: data.pitch,
    monetization: data.models,
    generationTier: data.generationTier,
    prepTime: calculatePrepTime(step),
  };

  // Dashboard view after generation
  if (showDashboard) {
    return (
      <>
        <Header onLogoClick={handleLogoClick} />
        <Dashboard
          data={{
            idea: data.idea || "",
            duration: data.duration || 3,
            problem: data.problem || "",
            pitch: data.pitch || "",
            solutionDescription: data.solutionDescription,
          }}
        />
      </>
    );
  }

  // Landing page (Step 0)
  if (step === 0) {
    return <Step1Hook onNext={handleStep1} />;
  }

  // Wizard steps (1-6)
  return (
    <WizardLayout
      briefData={briefData}
      currentStep={step}
      totalSteps={6}
      onLogoClick={handleLogoClick}
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <Step2Audience
            key="step2"
            onNext={handleStep2}
            onBack={handleBack}
          />
        )}
        {step === 2 && (
          <Step4Problem
            key="step3"
            idea={data.idea || ""}
            onNext={handleStep3}
            onBack={handleBack}
          />
        )}
        {step === 3 && (
          <Step5Solution
            key="step4"
            idea={data.idea || ""}
            onNext={handleStep4}
            onBack={handleBack}
          />
        )}
        {step === 4 && (
          <Step6Business
            key="step5"
            onNext={handleStep5}
            onBack={handleBack}
          />
        )}
        {step === 5 && (
          <Step7Generation
            key="step6"
            onNext={handleStep6}
            onBack={handleBack}
          />
        )}
      </AnimatePresence>
    </WizardLayout>
  );
};

export default Index;
