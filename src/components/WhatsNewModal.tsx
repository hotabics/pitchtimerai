import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mic, MessageSquare, Database, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CURRENT_VERSION = "1.9.0";
const STORAGE_KEY = "pitchperfect_last_seen_version";

interface ChangelogItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const changelogItems: ChangelogItem[] = [
  {
    icon: <MessageSquare className="w-5 h-5 text-amber-500" />,
    title: "AI Juror Voice",
    description: "ElevenLabs TTS makes the AI juror speak questions aloud with unique voices per personality.",
  },
  {
    icon: <Mic className="w-5 h-5 text-blue-500" />,
    title: "Speech-to-Text Responses",
    description: "Real ElevenLabs STT transcription for your spoken answers with AI-powered analysis.",
  },
  {
    icon: <Eye className="w-5 h-5 text-purple-500" />,
    title: "Review My Answers",
    description: "New Verdict section shows each question-response pair with individual scores and feedback.",
  },
  {
    icon: <Database className="w-5 h-5 text-emerald-500" />,
    title: "Session Tracking",
    description: "Interrogation sessions saved to database so you can track progress over time.",
  },
];

export const WhatsNewModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    
    // Show modal if user hasn't seen this version
    if (lastSeenVersion !== CURRENT_VERSION) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            What's New in v{CURRENT_VERSION}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <AnimatePresence>
            {changelogItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleDismiss} className="w-full">
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
