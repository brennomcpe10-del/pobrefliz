import { Episode } from '../types';

export interface GoogleDriveMediaInfo {
  isGoogleDrive: boolean;
  fileId?: string;
  previewUrl?: string;
  downloadUrl?: string;
  viewUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Parses Google Drive links in various formats:
 * - https://drive.google.com/file/d/1LG2AOqsH22g8Ep7hZOY_qsnqU4pXDb61/view
 * - https://drive.google.com/file/d/1LG2AOqsH22g8Ep7hZOY_qsnqU4pXDb61/preview
 * - https://drive.google.com/open?id=1LG2AOqsH22g8Ep7hZOY_qsnqU4pXDb61
 * - https://drive.google.com/uc?id=1LG2AOqsH22g8Ep7hZOY_qsnqU4pXDb61
 */
export function parseGoogleDriveUrl(url?: string): GoogleDriveMediaInfo {
  if (!url || typeof url !== 'string') {
    return { isGoogleDrive: false };
  }

  const trimmed = url.trim();

  // Pattern 1: /file/d/ID/...
  const matchFile = trimmed.match(/(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  // Pattern 2: id=ID query param
  const matchParam = trimmed.match(/(?:drive|docs)\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i);
  // Pattern 3: googleusercontent.com/d/ID
  const matchUserContent = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);

  const fileId = matchFile?.[1] || matchParam?.[1] || matchUserContent?.[1];

  if (fileId && fileId.length >= 10) {
    return {
      isGoogleDrive: true,
      fileId,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
      thumbnailUrl: `https://lh3.googleusercontent.com/d/${fileId}=w640`,
    };
  }

  return { isGoogleDrive: false };
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function cleanFileNameToTitle(fileName: string): string {
  // Remove extension
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  // Replace underscores, dots, hyphens with spaces
  let cleaned = withoutExt
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Clean common tags like 1080p, 720p, WEB-DL, x264, etc.
  cleaned = cleaned.replace(/\b(1080p|720p|480p|4k|2160p|web-dl|webrip|bluray|x264|x265|hevc|aac)\b/gi, '').trim();
  
  // If starts with S01E01 or similar, extract
  const epMatch = cleaned.match(/(?:S|Temporada\s*)(\d+)[xEe](\d+)/i);
  if (epMatch) {
    cleaned = cleaned.replace(/(?:S|Temporada\s*)(\d+)[xEe](\d+)/i, '').trim();
  }

  return cleaned || 'Novo Episódio';
}

/**
 * Extracts a thumbnail frame from a video file and detects its duration.
 */
export async function generateVideoThumbnail(
  fileOrBlob: Blob
): Promise<{ thumbnailUrl: string; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(fileOrBlob);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const cleanUp = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      // Seek to either 2s or 10% of duration to get a representative frame
      const targetTime = Math.min(2.5, (video.duration || 10) * 0.1);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        // Scale to 16:9 ratio with maximum width of 640px
        const width = 640;
        const height = Math.round((video.videoHeight / (video.videoWidth || 16 / 9)) * width) || 360;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve({
            thumbnailUrl: dataUrl,
            duration: Math.round(video.duration || 0),
          });
        } else {
          resolve({
            thumbnailUrl: '',
            duration: Math.round(video.duration || 0),
          });
        }
      } catch {
        resolve({
          thumbnailUrl: '',
          duration: Math.round(video.duration || 0),
        });
      } finally {
        cleanUp();
      }
    };

    video.onerror = () => {
      cleanUp();
      resolve({ thumbnailUrl: '', duration: 0 });
    };

    // Timeout safety fallback
    setTimeout(() => {
      cleanUp();
      resolve({ thumbnailUrl: '', duration: 0 });
    }, 6000);
  });
}

/**
 * Triggers direct browser download of the episode video file
 */
export function downloadEpisodeFile(episode: Episode): void {
  const gdrive = parseGoogleDriveUrl(episode.videoUrl);
  if (gdrive.isGoogleDrive && (gdrive.downloadUrl || gdrive.viewUrl)) {
    const targetUrl = gdrive.downloadUrl || gdrive.viewUrl!;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  const fileExt = episode.fileName ? episode.fileName.split('.').pop() || 'mp4' : 'mp4';
  const cleanTitle = episode.title.replace(/[/\\?%*:|"<>]/g, '_').trim();
  const downloadFileName = `S${String(episode.season).padStart(2, '0')}E${String(
    episode.episodeNumber
  ).padStart(2, '0')} - ${cleanTitle}.${fileExt}`;

  if (episode.videoBlob) {
    const url = URL.createObjectURL(episode.videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } else if (episode.videoUrl) {
    const a = document.createElement('a');
    a.href = episode.videoUrl;
    a.download = downloadFileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
