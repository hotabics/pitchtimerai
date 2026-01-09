// Video Storage Service - Upload recordings to Supabase Storage with thumbnail generation and compression

import { supabase } from '@/integrations/supabase/client';
import { compressVideo, formatFileSize } from './videoCompression';

/**
 * Generate a thumbnail from the first frame of a video blob
 */
export const generateThumbnail = async (videoBlob: Blob): Promise<Blob | null> => {
  return new Promise((resolve) => {
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

    video.onloadedmetadata = () => {
      // Set canvas size to video dimensions (scaled down for thumbnail)
      const maxWidth = 640;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      // Seek to first frame
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }

      // Draw the frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          cleanup();
          resolve(blob);
        },
        'image/jpeg',
        0.8
      );
    };

    video.onerror = () => {
      console.error('Failed to load video for thumbnail generation');
      cleanup();
      resolve(null);
    };

    // Timeout fallback
    setTimeout(() => {
      cleanup();
      resolve(null);
    }, 10000);
  });
};

/**
 * Generate a unique filename for storage
 */
const generateFilename = (prefix: string, extension: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.${extension}`;
};

/**
 * Upload a recording and its thumbnail to Supabase Storage
 */
export const uploadRecording = async (
  videoBlob: Blob,
  sessionId?: string,
  onProgress?: (step: string, progress: number) => void
): Promise<{ 
  videoUrl: string | null; 
  thumbnailUrl: string | null; 
  error: string | null;
  originalSize?: number;
  compressedSize?: number;
}> => {
  try {
    const prefix = sessionId || 'recording';
    
    // Step 1: Compress video if needed
    onProgress?.('Compressing video...', 10);
    const originalSize = videoBlob.size;
    console.log(`Original video size: ${formatFileSize(originalSize)}`);
    
    let uploadBlob = videoBlob;
    let compressedSize = originalSize;
    
    // Compress if > 5MB
    if (originalSize > 5 * 1024 * 1024) {
      try {
        const result = await compressVideo(videoBlob, {
          maxWidth: 1280,
          maxHeight: 720,
          videoBitrate: 1500000, // 1.5 Mbps
        });
        uploadBlob = result.compressed;
        compressedSize = result.compressedSize;
        console.log(`Compressed to: ${formatFileSize(compressedSize)} (${result.compressionRatio.toFixed(1)}x reduction)`);
      } catch (compErr) {
        console.warn('Compression failed, uploading original:', compErr);
      }
    }
    
    onProgress?.('Uploading video...', 40);
    
    // Upload video
    const videoFilename = generateFilename(prefix, 'webm');
    const { data: videoData, error: videoError } = await supabase.storage
      .from('pitch-recordings')
      .upload(videoFilename, uploadBlob, {
        contentType: 'video/webm',
        cacheControl: '3600',
      });

    if (videoError) {
      console.error('Video upload error:', videoError);
      return { videoUrl: null, thumbnailUrl: null, error: videoError.message, originalSize, compressedSize };
    }
    
    onProgress?.('Generating thumbnail...', 70);

    // Get video URL
    const { data: videoUrlData } = supabase.storage
      .from('pitch-recordings')
      .getPublicUrl(videoFilename);
    
    // For private buckets, use signed URL instead
    const { data: signedVideoUrl } = await supabase.storage
      .from('pitch-recordings')
      .createSignedUrl(videoFilename, 60 * 60 * 24 * 7); // 7 days

    const videoUrl = signedVideoUrl?.signedUrl || videoUrlData?.publicUrl || null;

    // Generate and upload thumbnail (use original blob for better quality)
    let thumbnailUrl: string | null = null;
    const thumbnailBlob = await generateThumbnail(videoBlob);
    
    onProgress?.('Uploading thumbnail...', 85);
    
    if (thumbnailBlob) {
      const thumbnailFilename = generateFilename(`${prefix}_thumb`, 'jpg');
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('pitch-recordings')
        .upload(thumbnailFilename, thumbnailBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (!thumbError && thumbData) {
        const { data: signedThumbUrl } = await supabase.storage
          .from('pitch-recordings')
          .createSignedUrl(thumbnailFilename, 60 * 60 * 24 * 7); // 7 days
        
        thumbnailUrl = signedThumbUrl?.signedUrl || null;
      }
    }

    onProgress?.('Complete!', 100);
    return { videoUrl, thumbnailUrl, error: null, originalSize, compressedSize };
  } catch (error) {
    console.error('Upload failed:', error);
    return { 
      videoUrl: null, 
      thumbnailUrl: null, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

/**
 * Update a practice session with video URLs
 */
export const updateSessionWithVideo = async (
  sessionId: string,
  videoUrl: string,
  thumbnailUrl: string | null
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('practice_sessions')
      .update({
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to update session with video:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Update session error:', error);
    return false;
  }
};

/**
 * Delete a recording from storage
 */
export const deleteRecording = async (videoUrl: string, thumbnailUrl?: string | null): Promise<boolean> => {
  try {
    // Extract filename from URL
    const extractFilename = (url: string) => {
      const match = url.match(/pitch-recordings\/([^?]+)/);
      return match ? match[1] : null;
    };

    const videoFilename = extractFilename(videoUrl);
    if (videoFilename) {
      await supabase.storage.from('pitch-recordings').remove([videoFilename]);
    }

    if (thumbnailUrl) {
      const thumbFilename = extractFilename(thumbnailUrl);
      if (thumbFilename) {
        await supabase.storage.from('pitch-recordings').remove([thumbFilename]);
      }
    }

    return true;
  } catch (error) {
    console.error('Delete recording error:', error);
    return false;
  }
};
