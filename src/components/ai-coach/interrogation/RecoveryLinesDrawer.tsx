// Recovery Lines Drawer Component
// Shows tactical phrases to help users when they're stuck

import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface RecoveryLine {
  name: string;
  phrase: string;
}

interface RecoveryLinesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: RecoveryLine[];
  onSelect: (phrase: string) => void;
}

export const RecoveryLinesDrawer = ({ 
  open, 
  onOpenChange, 
  lines, 
  onSelect 
}: RecoveryLinesDrawerProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (phrase: string, index: number) => {
    navigator.clipboard.writeText(phrase);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSelect = (phrase: string) => {
    onSelect(phrase);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-[#FFD700]/30 rounded-t-3xl max-h-[70vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 bg-gray-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#FFD700]/10">
                  <Lightbulb className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Recovery Lines</h3>
                  <p className="text-sm text-gray-400">Use these to regain control</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Lines List */}
            <div className="px-6 pb-8 space-y-3 overflow-y-auto max-h-[50vh]">
              {lines.map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative p-4 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-[#FFD700]/50 transition-all cursor-pointer"
                  onClick={() => handleSelect(line.phrase)}
                >
                  {/* Glow Effect on Hover */}
                  <div className="absolute inset-0 rounded-xl bg-[#FFD700]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded bg-[#FFD700]/20 text-[#FFD700]">
                          {line.name}
                        </span>
                      </div>
                      <p className="text-white text-sm leading-relaxed italic">
                        "{line.phrase}"
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(line.phrase, index);
                      }}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tip */}
            <div className="px-6 pb-6">
              <p className="text-xs text-gray-500 text-center">
                💡 Tap a line to use it, or copy it to practice offline
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
