// The Interrogation Room - Main Container Component
// Neo-Noir/Tarantino styled virtual simulation for pitch defense practice

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JurorSelection, type JurorType } from './JurorSelection';
import { InterrogationSimulation } from './InterrogationSimulation';
import { InterrogationVerdict, type VerdictData } from './InterrogationVerdict';

export type InterrogationPhase = 'selection' | 'simulation' | 'verdict';

interface InterrogationRoomProps {
  onBack: () => void;
  dossierData?: {
    projectName?: string;
    problem?: string;
    solution?: string;
    audience?: string;
  };
}

export const InterrogationRoom = ({ onBack, dossierData }: InterrogationRoomProps) => {
  const [phase, setPhase] = useState<InterrogationPhase>('selection');
  const [selectedJuror, setSelectedJuror] = useState<JurorType | null>(null);
  const [verdictData, setVerdictData] = useState<VerdictData | null>(null);

  const handleJurorSelect = useCallback((juror: JurorType) => {
    setSelectedJuror(juror);
    setPhase('simulation');
  }, []);

  const handleSimulationComplete = useCallback((data: VerdictData) => {
    setVerdictData(data);
    setPhase('verdict');
  }, []);

  const handleRetry = useCallback(() => {
    setPhase('selection');
    setSelectedJuror(null);
    setVerdictData(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white overflow-hidden relative">
      {/* CRT Scanline Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]">
        <div 
          className="w-full h-full"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          }}
        />
      </div>

      {/* Vignette Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Header */}
      <header className="relative z-30 border-b border-[#FFD700]/20 bg-[#121212]/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="text-[#FFD700] hover:text-[#FFD700] hover:bg-[#FFD700]/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg text-[#FFD700] tracking-wider uppercase">
              The Interrogation Room
            </h1>
            <p className="text-sm text-gray-500">
              {phase === 'selection' && 'Choose your opponent'}
              {phase === 'simulation' && 'Defend your pitch'}
              {phase === 'verdict' && 'The verdict is in'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {phase === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <JurorSelection onSelect={handleJurorSelect} />
            </motion.div>
          )}

          {phase === 'simulation' && selectedJuror && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <InterrogationSimulation
                juror={selectedJuror}
                dossierData={dossierData}
                onComplete={handleSimulationComplete}
                onBack={() => setPhase('selection')}
              />
            </motion.div>
          )}

          {phase === 'verdict' && verdictData && (
            <motion.div
              key="verdict"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <InterrogationVerdict
                data={verdictData}
                juror={selectedJuror!}
                onRetry={handleRetry}
                onBack={onBack}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
