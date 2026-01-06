import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { ProjectBrief, BriefData } from "@/components/ProjectBrief";
import { Header } from "@/components/Header";

interface WizardLayoutProps {
  children: ReactNode;
  briefData: BriefData;
  currentStep: number;
  totalSteps: number;
  onLogoClick: () => void;
}

export const WizardLayout = ({
  children,
  briefData,
  currentStep,
  totalSteps,
  onLogoClick,
}: WizardLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        showProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        onLogoClick={onLogoClick}
      />

      <div className="flex-1 flex flex-col lg:flex-row pt-14">
        {/* Main Content Area - 65% on desktop */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 lg:w-[65%] overflow-y-auto"
        >
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </motion.main>

        {/* Project Brief Sidebar - 35% on desktop, drawer on mobile */}
        <ProjectBrief data={briefData} currentStep={currentStep} />
      </div>
    </div>
  );
};
