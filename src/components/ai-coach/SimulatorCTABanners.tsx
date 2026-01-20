// CTA Banners for Sales and Interview Simulators on AI Coach page
import { motion } from 'framer-motion';
import { Briefcase, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const SimulatorCTABanners = () => {
  const navigate = useNavigate();

  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
      {/* Interview Simulator CTA */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card 
          className="relative overflow-hidden cursor-pointer bg-gradient-to-br from-[#1a1a1a] to-[#121212] border-2 border-[#FFD700]/30 hover:border-[#FFD700]/60 transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]"
          onClick={() => navigate('/interview-simulator')}
        >
          {/* Subtle scanline effect */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,215,0,0.1) 2px, rgba(255,215,0,0.1) 4px)' }}
          />
          
          <CardContent className="p-5 flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B0000] to-[#FFD700]/80 flex items-center justify-center shadow-lg shrink-0">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[#FFD700] uppercase tracking-wider mb-0.5">
                First Round Simulator
              </h4>
              <p className="text-xs text-gray-400 line-clamp-2">
                Practice job interviews with AI that knows your CV and job requirements
              </p>
            </div>
            
            <Button 
              size="sm" 
              className="shrink-0 gap-1.5 bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
            >
              Try It
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sales Simulator CTA */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card 
          className="relative overflow-hidden cursor-pointer bg-card border-border hover:border-primary/50 transition-all hover:scale-[1.02] hover:shadow-lg"
          onClick={() => navigate('/sales-simulator')}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shrink-0">
              <Phone className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground mb-0.5">
                Sales Cold Call Simulator
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Practice with AI clients and get real-time coaching feedback
              </p>
            </div>
            
            <Button 
              size="sm" 
              variant="outline"
              className="shrink-0 gap-1.5"
            >
              Try It
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
