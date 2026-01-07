// AI Coach Setup View - Camera/Mic permissions and preview

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Mic, Camera, AlertCircle, Check, Settings, FileText, Trash2, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AICoachSettings } from './AICoachSettings';
import { hasApiKey } from '@/services/openai';
import { useAICoachStore, type ScriptBlock } from '@/stores/aiCoachStore';

interface AICoachSetupProps {
  onReady: () => void;
}

export const AICoachSetup = ({ onReady }: AICoachSetupProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [showAllBlocks, setShowAllBlocks] = useState(false);
  const [loadScriptOpen, setLoadScriptOpen] = useState(false);
  const [pastedScript, setPastedScript] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasKey = hasApiKey();
  
  const { scriptBlocks, setScriptBlocks } = useAICoachStore();
  const hasScript = scriptBlocks.length > 0;

  const handleClearScript = () => {
    setScriptBlocks([]);
  };

  const handleLoadScript = () => {
    if (!pastedScript.trim()) return;
    
    // Parse the pasted script into blocks
    // Split by double newlines or numbered sections
    const lines = pastedScript.trim().split(/\n\n+/);
    const blocks: ScriptBlock[] = lines
      .filter(line => line.trim())
      .map((line, index) => {
        // Try to extract a title if line starts with a number, bullet, or has a colon
        const titleMatch = line.match(/^(?:\d+[\.\)]\s*)?(?:[\*\-]\s*)?([^:]+):\s*(.+)$/s);
        if (titleMatch) {
          return {
            title: titleMatch[1].trim(),
            content: titleMatch[2].trim(),
          };
        }
        return {
          title: `Section ${index + 1}`,
          content: line.trim(),
        };
      });
    
    if (blocks.length > 0) {
      setScriptBlocks(blocks);
      setPastedScript('');
      setLoadScriptOpen(false);
    }
  };

  useEffect(() => {
    requestPermissions();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true,
      });
      
      setStream(mediaStream);
      setPermissionStatus('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Permission error:', err);
      setPermissionStatus('denied');
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to access camera and microphone'
      );
    }
  };

  const handleStart = () => {
    if (stream) {
      onReady();
    }
  };

  // Determine how many blocks to show in preview
  const previewBlocks = showAllBlocks ? scriptBlocks : scriptBlocks.slice(0, 3);
  const hasMoreBlocks = scriptBlocks.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Coach Setup</h2>
          <p className="text-muted-foreground">
            Grant camera and microphone access to begin
          </p>
        </div>
        <AICoachSettings />
      </div>

      {/* Script Mode Indicator */}
      <div className="rounded-lg bg-muted/50 border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasScript ? 'bg-primary/10' : 'bg-muted'
            }`}>
              <FileText className={`w-5 h-5 ${hasScript ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">
                {hasScript ? 'Teleprompter Mode' : 'Live Transcription Mode'}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasScript 
                  ? `${scriptBlocks.length} script blocks loaded`
                  : 'Speech will be transcribed in real-time'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasScript ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearScript}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            ) : (
              <Dialog open={loadScriptOpen} onOpenChange={setLoadScriptOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Load Script
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Load Your Script</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Paste your script below. Separate sections with blank lines. 
                      Optionally use "Title: content" format for named sections.
                    </p>
                    <Textarea
                      placeholder={`Example:\n\nHook: Welcome everyone! Today I'm going to show you something amazing.\n\nProblem: Have you ever struggled with...\n\nSolution: That's why we built...`}
                      value={pastedScript}
                      onChange={(e) => setPastedScript(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setLoadScriptOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleLoadScript} disabled={!pastedScript.trim()}>
                      Load Script
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Script Preview */}
        <AnimatePresence>
          {hasScript && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border"
            >
              <div className="p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Script Preview
                </p>
                <div className="space-y-2">
                  {previewBlocks.map((block, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-md bg-background border border-border"
                    >
                      <p className="text-xs font-medium text-primary mb-1">
                        {block.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {block.content}
                      </p>
                    </div>
                  ))}
                </div>
                {hasMoreBlocks && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllBlocks(!showAllBlocks)}
                    className="w-full text-muted-foreground"
                  >
                    {showAllBlocks ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Show {scriptBlocks.length - 3} More Blocks
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* API Key Status */}
      {!hasKey && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No OpenAI API key configured. Using mock data for demo.</span>
            <AICoachSettings 
              trigger={
                <Button variant="outline" size="sm" className="ml-2">
                  <Settings className="w-4 h-4 mr-2" />
                  Add API Key
                </Button>
              } 
            />
          </AlertDescription>
        </Alert>
      )}

      {/* Video Preview */}
      <div className="relative aspect-video bg-muted rounded-xl overflow-hidden border border-border">
        {permissionStatus === 'pending' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Requesting permissions...</p>
            </div>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg">Permission Required</h3>
              <p className="text-sm text-muted-foreground">
                {error || 'Please allow camera and microphone access to use AI Coach.'}
              </p>
              <Button onClick={requestPermissions}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {permissionStatus === 'granted' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
      </div>

      {/* Permission indicators */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            permissionStatus === 'granted' ? 'bg-success/10' : 'bg-muted'
          }`}>
            <Camera className={`w-4 h-4 ${
              permissionStatus === 'granted' ? 'text-success' : 'text-muted-foreground'
            }`} />
          </div>
          <span className="text-sm">Camera</span>
          {permissionStatus === 'granted' && (
            <Check className="w-4 h-4 text-success" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            permissionStatus === 'granted' ? 'bg-success/10' : 'bg-muted'
          }`}>
            <Mic className={`w-4 h-4 ${
              permissionStatus === 'granted' ? 'text-success' : 'text-muted-foreground'
            }`} />
          </div>
          <span className="text-sm">Microphone</span>
          {permissionStatus === 'granted' && (
            <Check className="w-4 h-4 text-success" />
          )}
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={permissionStatus !== 'granted'}
          className="px-8"
        >
          <Video className="w-5 h-5 mr-2" />
          Start Recording
        </Button>
      </div>

      {/* Tips */}
      <div className="grid sm:grid-cols-3 gap-4 pt-4">
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl mb-2">💡</div>
          <p className="text-sm text-muted-foreground">Good lighting helps face detection</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-sm text-muted-foreground">Look directly at the camera</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <div className="text-2xl mb-2">🔇</div>
          <p className="text-sm text-muted-foreground">Find a quiet environment</p>
        </div>
      </div>
    </motion.div>
  );
};
