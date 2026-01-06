import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { WizardLayout } from "@/components/WizardLayout";
import { BriefData } from "@/components/ProjectBrief";
import { Step1Hook } from "@/components/steps/Step1Hook";
import { Step2Audience } from "@/components/steps/Step2Audience";
import { Step3Demo } from "@/components/steps/Step3Demo";
import { Step4Problem } from "@/components/steps/Step4Problem";
import { Step5Solution } from "@/components/steps/Step5Solution";
import { Step6Business } from "@/components/steps/Step6Business";
import { Step7Generation } from "@/components/steps/Step7Generation";
import { Dashboard } from "@/components/Dashboard";
import { toast } from "@/hooks/use-toast";

interface DemoInfo {
  hasDemo: boolean;
  demoType?: string;
  demoUrl?: string;
  demoDescription?: string;
}

interface PitchData {
  idea: string;
  duration: number;
  audience: string;
  audienceLabel: string;
  demo: DemoInfo;
  demoLabel: string;
  problem: string;
  persona: { description: string; keywords: string[] };
  pitch: string;
  solutionDescription?: string;
  models: string[];
  generationTier: string;
}

// Time calculation based on step progress - starts from Manual Grind time (5h 15m)
const calculatePrepTime = (step: number, demoType?: string): number => {
  const baseTime = 315; // 5h 15m in minutes (Manual Grind time from landing page)
  
  // Time at each step, decreasing from 5h 15m to 30m
  const timeAtStep: Record<number, number> = {
    0: 315,    // Step 0 (Landing): 5h 15m
    1: 270,    // Step 1 (Audience): 4h 30m
    2: 210,    // Step 2 (Demo): 3h 30m
    3: 150,    // Step 3 (Problem): 2h 30m
    4: 90,     // Step 4 (Solution): 1h 30m
    5: 50,     // Step 5 (Business): 0h 50m
    6: 30,     // Step 6 (Generation): 0h 30m (Final)
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

  // Step 2: Audience selection
  const handleStep2 = (audience: string, audienceLabel: string) => {
    setData({ ...data, audience, audienceLabel });
    setStep(2);
    toast({
      title: "Audience Selected!",
      description: `Tailoring pitch for ${audienceLabel}`,
    });
  };

  // Step 3: Demo strategy
  const handleStep3 = (demoType: string, demoLabel: string) => {
    const demo: DemoInfo = {
      hasDemo: demoType !== "none",
      demoType: demoType !== "none" ? demoType : undefined,
    };
    setData({ ...data, demo, demoLabel });
    setStep(3);
    toast({
      title: "Demo Strategy Set!",
      description: `Using ${demoLabel} approach`,
    });
  };

  // Step 4: Problem selection
  const handleStep4 = (problem: string) => {
    setData({ ...data, problem });
    setStep(4);
    toast({
      title: "Problem Defined!",
      description: "Core pain point identified",
    });
  };

  // Step 5: Solution pitch
  const handleStep5 = (pitch: string, solutionDescription?: string) => {
    setData({ ...data, pitch, solutionDescription });
    setStep(5);
    toast({
      title: "Pitch Locked!",
      description: "Elevator pitch ready",
    });
  };

  // Step 6: Business model
  const handleStep6 = (models: string[]) => {
    setData({ ...data, models });
    setStep(6);
    toast({
      title: "Monetization Set!",
      description: `${models.length} revenue model(s) selected`,
    });
  };

  // Step 7: Generation tier and generate
  const handleStep7 = (tier: string, tierLabel: string) => {
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
    demoLabel: data.demoLabel,
    problem: data.problem,
    solution: data.pitch,
    monetization: data.models,
    generationTier: data.generationTier,
    prepTime: calculatePrepTime(step, data.demo?.demoType),
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
            demo: data.demo,
          }}
        />
      </>
    );
  }

  // Landing page (Step 0)
  if (step === 0) {
    return <Step1Hook onNext={handleStep1} />;
  }

  // Wizard steps (1-7)
  return (
    <WizardLayout
      briefData={briefData}
      currentStep={step}
      totalSteps={7}
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
          <Step3Demo
            key="step3"
            onNext={handleStep3}
            onBack={handleBack}
          />
        )}
        {step === 3 && (
          <Step4Problem
            key="step4"
            idea={data.idea || ""}
            onNext={handleStep4}
            onBack={handleBack}
          />
        )}
        {step === 4 && (
          <Step5Solution
            key="step5"
            idea={data.idea || ""}
            onNext={handleStep5}
            onBack={handleBack}
          />
        )}
        {step === 5 && (
          <Step6Business
            key="step6"
            onNext={handleStep6}
            onBack={handleBack}
          />
        )}
        {step === 6 && (
          <Step7Generation
            key="step7"
            onNext={handleStep7}
            onBack={handleBack}
          />
        )}
      </AnimatePresence>
    </WizardLayout>
  );
};

export default Index;
