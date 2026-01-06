import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { TimeCounter } from "@/components/TimeCounter";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { Step1Hook } from "@/components/steps/Step1Hook";
import { Step2Specs } from "@/components/steps/Step2Specs";
import { Step3Problem } from "@/components/steps/Step3Problem";
import { Step4Audience } from "@/components/steps/Step4Audience";
import { Step5Solution } from "@/components/steps/Step5Solution";
import { Step6Business } from "@/components/steps/Step6Business";
import { Step7Summary } from "@/components/steps/Step7Summary";
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
  demo: DemoInfo;
  problem: string;
  persona: { description: string; keywords: string[] };
  pitch: string;
  models: string[];
}

const timeSteps = [900, 750, 600, 480, 360, 180, 30];

const Index = () => {
  const [step, setStep] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const [data, setData] = useState<Partial<PitchData>>({});

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleStep1 = (idea: string) => {
    setData({ ...data, idea });
    setStep(1);
    toast({
      title: "Idea Captured!",
      description: "Let's customize your pitch...",
    });
  };

  const handleStep2 = (specs: { duration: number; audience: string; demo: DemoInfo }) => {
    setData({ ...data, ...specs });
    setStep(2);
    toast({
      title: specs.demo.hasDemo ? "Demo Planned!" : "Structure Adapted!",
      description: specs.demo.hasDemo ? "AI will optimize demo timing" : "Pitch optimized for your audience",
    });
  };

  const handleStep3 = (problem: string) => {
    setData({ ...data, problem });
    setStep(3);
    toast({
      title: "Focus Found!",
      description: "Problem statement locked in",
    });
  };

  const handleStep4 = (persona: { description: string; keywords: string[] }) => {
    setData({ ...data, persona });
    setStep(4);
    toast({
      title: "Target Acquired!",
      description: "Audience persona defined",
    });
  };

  const handleStep5 = (pitch: string) => {
    setData({ ...data, pitch });
    setStep(5);
    toast({
      title: "Pitch Locked!",
      description: "Elevator pitch ready",
    });
  };

  const handleStep6 = (models: string[]) => {
    setData({ ...data, models });
    setStep(6);
    toast({
      title: "Almost There!",
      description: "Final review time",
    });
  };

  const handleGenerate = () => {
    setShowDashboard(true);
    toast({
      title: "🎉 Pitch Generated!",
      description: "14h 30m saved. You're ready to win!",
    });
  };

  if (showDashboard) {
    return (
      <>
        <TimeCounter targetMinutes={30} isComplete />
        <Dashboard
          data={{
            idea: data.idea || "",
            duration: data.duration || 3,
            problem: data.problem || "",
            pitch: data.pitch || "",
            demo: data.demo,
          }}
        />
      </>
    );
  }

  return (
    <>
      <TimeCounter targetMinutes={timeSteps[step]} />
      {step > 0 && (
        <div className="fixed top-16 left-0 right-0 z-40">
          <ProgressIndicator currentStep={step} totalSteps={7} />
        </div>
      )}
      <AnimatePresence mode="wait">
        {step === 0 && <Step1Hook key="step1" onNext={handleStep1} />}
        {step === 1 && <Step2Specs key="step2" onNext={handleStep2} onBack={handleBack} />}
        {step === 2 && <Step3Problem key="step3" idea={data.idea || ""} onNext={handleStep3} onBack={handleBack} />}
        {step === 3 && <Step4Audience key="step4" idea={data.idea || ""} onNext={handleStep4} onBack={handleBack} />}
        {step === 4 && <Step5Solution key="step5" idea={data.idea || ""} onNext={handleStep5} onBack={handleBack} />}
        {step === 5 && <Step6Business key="step6" onNext={handleStep6} onBack={handleBack} />}
        {step === 6 && (
          <Step7Summary
            key="step7"
            data={data as PitchData}
            onGenerate={handleGenerate}
            onBack={handleBack}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Index;
