// Audio Waveform Visualization Component for Blog Audio Player

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  className?: string;
  barCount?: number;
}

const AudioWaveform = ({ audioElement, isPlaying, className, barCount = 32 }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!audioElement || isInitialized) return;

    try {
      // Create audio context and analyser
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      // Connect audio element to analyser
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio visualization:', error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isInitialized]);

  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) {
        // Draw idle state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = canvas.width / barCount;
        const gap = 2;
        
        for (let i = 0; i < barCount; i++) {
          const x = i * barWidth;
          const height = 4;
          const y = (canvas.height - height) / 2;
          
          ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.3)';
          ctx.beginPath();
          ctx.roundRect(x + gap / 2, y, barWidth - gap, height, 2);
          ctx.fill();
        }
        return;
      }

      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / barCount;
      const gap = 2;
      
      for (let i = 0; i < barCount; i++) {
        // Sample from different parts of frequency spectrum
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex];
        const percent = value / 255;
        
        const minHeight = 4;
        const maxHeight = canvas.height * 0.9;
        const height = minHeight + (maxHeight - minHeight) * percent;
        
        const x = i * barWidth;
        const y = (canvas.height - height) / 2;
        
        // Create gradient based on height
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, `hsl(var(--primary) / ${0.6 + percent * 0.4})`);
        gradient.addColorStop(0.5, `hsl(var(--primary))`);
        gradient.addColorStop(1, `hsl(var(--primary) / ${0.6 + percent * 0.4})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + gap / 2, y, barWidth - gap, height, 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, barCount]);

  // Resume audio context on user interaction
  useEffect(() => {
    if (audioContextRef.current?.state === 'suspended' && isPlaying) {
      audioContextRef.current.resume();
    }
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      className={cn('rounded-md', className)}
    />
  );
};

export default AudioWaveform;
