import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Briefcase, Heart, ArrowRight, ArrowLeft, Monitor, MonitorOff, Globe, Smartphone, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { SelectionCard } from "@/components/SelectionCard";
import { StepWrapper } from "@/components/StepWrapper";
import { useState } from "react";

interface DemoInfo {
  hasDemo: boolean;
  demoType?: string;
  demoUrl?: string;
  demoDescription?: string;
}

interface Step2SpecsProps {
  onNext: (specs: { duration: number; audience: string; demo: DemoInfo }) => void;
  onBack: () => void;
}

const audiences = [
  { id: "judges", label: "Technical Judges", description: "Industry experts evaluating innovation", icon: <Briefcase className="w-5 h-5" /> },
  { id: "team", label: "Team Members", description: "Internal alignment and collaboration", icon: <Users className="w-5 h-5" /> },
  { id: "nontech", label: "Non-Technical Audience", description: "Investors, users, and general public", icon: <Heart className="w-5 h-5" /> },
];

const demoTypes = [
  { id: "website", label: "Live Website", description: "Show a deployed web application", icon: <Globe className="w-5 h-5" /> },
  { id: "mobile", label: "Mobile App", description: "Demo on device or emulator", icon: <Smartphone className="w-5 h-5" /> },
  { id: "slides", label: "Slides/Video", description: "Pre-recorded or slideshow demo", icon: <Presentation className="w-5 h-5" /> },
];

export const Step2Specs = ({ onNext, onBack }: Step2SpecsProps) => {
  const [duration, setDuration] = useState([3]);
  const [audience, setAudience] = useState("");
  const [hasDemo, setHasDemo] = useState<boolean | null>(null);
  const [demoType, setDemoType] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [demoDescription, setDemoDescription] = useState("");

  const canProceed = audience && hasDemo !== null && (hasDemo === false || (hasDemo && demoType));

  const handleNext = () => {
    if (!canProceed) return;
    
    const demo: DemoInfo = {
      hasDemo: hasDemo || false,
      demoType: hasDemo ? demoType : undefined,
      demoUrl: hasDemo && demoUrl ? demoUrl : undefined,
      demoDescription: hasDemo && demoDescription ? demoDescription : undefined,
    };
    
    onNext({ duration: duration[0], audience, demo });
  };

  return (
    <StepWrapper
      title="Pitch Specifications"
      subtitle="Let's tailor your pitch to your audience"
    >
      <div className="flex-1 flex flex-col">
        {/* Duration Slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-foreground">
              Pitch Duration
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary">{duration[0]} min</span>
            </div>
          </div>
          <Slider
            value={duration}
            onValueChange={setDuration}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>1 min</span>
            <span>10 min</span>
          </div>
        </motion.div>

        {/* Audience Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="text-sm font-medium text-foreground block mb-3">
            Target Audience
          </label>
          <div className="space-y-2">
            {audiences.map((aud, index) => (
              <motion.div
                key={aud.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <SelectionCard
                  title={aud.label}
                  description={aud.description}
                  icon={aud.icon}
                  selected={audience === aud.id}
                  onClick={() => setAudience(aud.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Demo Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-4"
        >
          <label className="text-sm font-medium text-foreground block mb-3">
            Will you include a live demo?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setHasDemo(true)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                hasDemo === true 
                  ? "border-time-low bg-time-low/10 shadow-lg shadow-time-low/20" 
                  : "border-border bg-card hover:border-time-low/50"
              }`}
            >
              <Monitor className={`w-6 h-6 ${hasDemo === true ? "text-time-low" : "text-muted-foreground"}`} />
              <span className={`font-semibold ${hasDemo === true ? "text-time-low" : "text-foreground"}`}>Yes, Demo</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setHasDemo(false);
                setDemoType("");
                setDemoUrl("");
                setDemoDescription("");
              }}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                hasDemo === false 
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <MonitorOff className={`w-6 h-6 ${hasDemo === false ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-semibold ${hasDemo === false ? "text-primary" : "text-foreground"}`}>No Demo</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Demo Details (conditional) */}
        <AnimatePresence>
          {hasDemo === true && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pb-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">
                    Demo Type
                  </label>
                  <div className="space-y-2">
                    {demoTypes.map((type, index) => (
                      <motion.div
                        key={type.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <SelectionCard
                          title={type.label}
                          description={type.description}
                          icon={type.icon}
                          selected={demoType === type.id}
                          onClick={() => setDemoType(type.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {demoType === "website" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Website URL (optional)
                    </label>
                    <Input
                      type="url"
                      placeholder="https://your-demo.com"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Demo Description (optional)
                  </label>
                  <Input
                    placeholder="e.g., Show user signup flow and dashboard"
                    value={demoDescription}
                    onChange={(e) => setDemoDescription(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    AI will suggest optimal demo moments in your speech
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-auto pt-4 space-y-3"
        >
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            disabled={!canProceed}
            className="w-full"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      </div>
    </StepWrapper>
  );
};
