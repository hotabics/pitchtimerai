// Video Compression Service - Compress videos before upload using canvas re-encoding

/**
 * Compress a video blob by re-encoding it at lower quality/resolution
 */
export const compressVideo = async (
  videoBlob: Blob,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    videoBitrate?: number; // in bps
    targetSizeMB?: number;
  } = {}
): Promise<{ compressed: Blob; originalSize: number; compressedSize: number; compressionRatio: number }> => {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    videoBitrate = 1500000, // 1.5 Mbps default
  } = options;

  const originalSize = videoBlob.size;

  // If already small enough (< 5MB), skip compression
  if (originalSize < 5 * 1024 * 1024) {
    return {
      compressed: videoBlob,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const videoUrl = URL.createObjectURL(videoBlob);
    video.src = videoUrl;

    const cleanup = () => {
      URL.revokeObjectURL(videoUrl);
      video.remove();
      canvas.remove();
    };

    video.onerror = () => {
      cleanup();
      // Return original on error
      resolve({
        compressed: videoBlob,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
      });
    };

    video.onloadedmetadata = async () => {
      try {
        // Calculate scaled dimensions
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > maxWidth) {
            width = maxWidth;
            height = Math.round(width / aspectRatio);
          }
          if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(height * aspectRatio);
          }
        }

        // Ensure dimensions are even (required for some codecs)
        width = Math.floor(width / 2) * 2;
        height = Math.floor(height / 2) * 2;

        canvas.width = width;
        canvas.height = height;

        // Check if MediaRecorder supports canvas capture
        const canvasStream = canvas.captureStream(30);
        
        // Add audio tracks from original video if available
        const originalAudio = await extractAudioTrack(videoBlob);
        if (originalAudio) {
          const audioStream = new MediaStream([originalAudio]);
          audioStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));
        }

        // Determine best codec
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

        const mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: videoBitrate,
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          cleanup();
          const compressedBlob = new Blob(chunks, { type: mimeType });
          const compressedSize = compressedBlob.size;
          
          resolve({
            compressed: compressedBlob,
            originalSize,
            compressedSize,
            compressionRatio: originalSize / compressedSize,
          });
        };

        // Start recording and play video
        mediaRecorder.start();
        video.currentTime = 0;

        const drawFrame = () => {
          if (video.ended || video.paused) {
            mediaRecorder.stop();
            return;
          }
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
          }
          requestAnimationFrame(drawFrame);
        };

        video.onplay = drawFrame;
        video.onended = () => mediaRecorder.stop();

        await video.play();
      } catch (error) {
        console.error('Compression error:', error);
        cleanup();
        // Return original on error
        resolve({
          compressed: videoBlob,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
        });
      }
    };

    // Timeout fallback (max 2 minutes for compression)
    setTimeout(() => {
      cleanup();
      resolve({
        compressed: videoBlob,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
      });
    }, 120000);
  });
};

/**
 * Extract audio track from a video blob
 */
const extractAudioTrack = async (videoBlob: Blob): Promise<MediaStreamTrack | null> => {
  try {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.muted = false;
    
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
      setTimeout(reject, 5000);
    });

    // Use captureStream to get audio
    const stream = (video as any).captureStream?.() || (video as any).mozCaptureStream?.();
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      URL.revokeObjectURL(video.src);
      video.remove();
      return audioTrack || null;
    }

    URL.revokeObjectURL(video.src);
    video.remove();
    return null;
  } catch {
    return null;
  }
};

/**
 * Quick compression using lower quality MediaRecorder settings
 * This is faster but less precise than full re-encoding
 */
export const quickCompressBlob = async (
  originalBlob: Blob,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<Blob> => {
  const qualitySettings = {
    low: { bitrate: 500000, width: 640 },
    medium: { bitrate: 1000000, width: 1280 },
    high: { bitrate: 2000000, width: 1920 },
  };

  const settings = qualitySettings[quality];
  
  const result = await compressVideo(originalBlob, {
    maxWidth: settings.width,
    videoBitrate: settings.bitrate,
  });

  return result.compressed;
};

/**
 * Estimate compressed file size based on duration and quality
 */
export const estimateCompressedSize = (
  durationSeconds: number,
  bitrate: number = 1500000
): number => {
  // Size in bytes = (bitrate in bps * duration in seconds) / 8
  return Math.round((bitrate * durationSeconds) / 8);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};
