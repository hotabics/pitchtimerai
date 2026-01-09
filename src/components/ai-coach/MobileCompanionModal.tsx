// Mobile Companion Modal - QR Code pairing for phone camera recording

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Smartphone, X, Loader2, CheckCircle, Video, Wifi } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type ConnectionStatus = 'waiting' | 'connected' | 'recording' | 'uploading' | 'complete';

interface MobileCompanionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onVideoReceived: (videoUrl: string) => void;
}

export const MobileCompanionModal = ({
  open,
  onOpenChange,
  sessionId,
  onVideoReceived,
}: MobileCompanionModalProps) => {
  const [status, setStatus] = useState<ConnectionStatus>('waiting');
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  const mobileUrl = `${window.location.origin}/mobile-record/${sessionId}`;

  // Subscribe to realtime channel
  useEffect(() => {
    if (!open || !sessionId) return;

    console.log('Setting up realtime channel:', `room-${sessionId}`);
    
    const newChannel = supabase.channel(`room-${sessionId}`)
      .on('broadcast', { event: 'DEVICE_CONNECTED' }, () => {
        console.log('Phone connected!');
        setStatus('connected');
      })
      .on('broadcast', { event: 'RECORDING_STARTED' }, () => {
        console.log('Recording started on phone');
        setStatus('recording');
      })
      .on('broadcast', { event: 'RECORDING_STOPPED' }, () => {
        console.log('Recording stopped, uploading...');
        setStatus('uploading');
      })
      .on('broadcast', { event: 'UPLOAD_COMPLETE' }, (payload) => {
        console.log('Upload complete:', payload);
        setStatus('complete');
        const videoUrl = payload.payload?.videoUrl;
        if (videoUrl) {
          // Small delay for UX before triggering analysis
          setTimeout(() => {
            onVideoReceived(videoUrl);
            onOpenChange(false);
          }, 1500);
        }
      })
      .subscribe((status) => {
        console.log('Channel subscription status:', status);
      });

    setChannel(newChannel);

    return () => {
      console.log('Cleaning up channel');
      supabase.removeChannel(newChannel);
    };
  }, [open, sessionId, onVideoReceived, onOpenChange]);

  // Reset status when modal closes
  useEffect(() => {
    if (!open) {
      setStatus('waiting');
    }
  }, [open]);

  const handleCancel = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
    }
    onOpenChange(false);
  }, [channel, onOpenChange]);

  const getStatusContent = () => {
    switch (status) {
      case 'waiting':
        return {
          icon: <Smartphone className="w-8 h-8 text-primary" />,
          title: 'Scan with your phone',
          description: 'Open your camera app and scan the QR code to connect',
          showQR: true,
        };
      case 'connected':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: 'Phone Connected!',
          description: 'Waiting for you to start recording on your phone...',
          showQR: false,
        };
      case 'recording':
        return {
          icon: (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Video className="w-8 h-8 text-red-500" />
            </motion.div>
          ),
          title: 'Recording in Progress',
          description: 'Your phone is recording. When done, tap Stop on your phone.',
          showQR: false,
        };
      case 'uploading':
        return {
          icon: <Loader2 className="w-8 h-8 text-primary animate-spin" />,
          title: 'Uploading Video...',
          description: 'Your recording is being uploaded. Please wait...',
          showQR: false,
        };
      case 'complete':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: 'Video Received!',
          description: 'Starting analysis...',
          showQR: false,
        };
    }
  };

  const content = getStatusContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Mobile Companion
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-6">
          {/* Status Icon */}
          <motion.div
            key={status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            {content.icon}
            <h3 className="text-lg font-semibold text-center">{content.title}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {content.description}
            </p>
          </motion.div>

          {/* QR Code */}
          <AnimatePresence>
            {content.showQR && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-4 rounded-xl shadow-lg"
              >
                <QRCode value={mobileUrl} size={200} level="H" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection Status Indicator */}
          {status !== 'waiting' && status !== 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Wifi className="w-4 h-4 text-green-500" />
              <span>Connected to phone</span>
            </motion.div>
          )}

          {/* Cancel Button */}
          {status !== 'complete' && (
            <Button variant="outline" onClick={handleCancel} className="mt-4">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
