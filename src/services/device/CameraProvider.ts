/**
 * CameraProvider
 * 
 * Capability abstraction for camera capture across Web, Mobile Browser, and Android APK (Capacitor/WebView).
 * 
 * CORE RULES:
 * - NO FAKE HARDWARE CLAIMS: Truthfully detects whether camera hardware and permissions are available.
 * - Supports real HTML5 getUserMedia live viewfinder streaming with canvas snapshot.
 * - Supports fallback direct mobile camera capture (input capture="environment").
 * - Designed to plug into Capacitor Camera plugin or native Android bridge when running as APK.
 */

export interface CameraAvailability {
  hasCamera: boolean;
  canStream: boolean;
  permissionStatus: 'granted' | 'prompt' | 'denied' | 'unknown';
  disclaimer: string;
}

export interface CameraSnapshotResult {
  dataUrl: string;
  timestamp: string;
  source: 'LOCAL_LIVE_CAMERA' | 'LOCAL_FILE_CAPTURE';
  dimensions: { width: number; height: number };
}

export interface ICameraProvider {
  checkAvailability(): Promise<CameraAvailability>;
  startViewfinder(videoEl: HTMLVideoElement): Promise<MediaStream | null>;
  stopViewfinder(stream: MediaStream | null): void;
  captureSnapshot(videoEl: HTMLVideoElement): CameraSnapshotResult | null;
}

export class BrowserCameraProvider implements ICameraProvider {
  async checkAvailability(): Promise<CameraAvailability> {
    if (typeof window === 'undefined' || !navigator?.mediaDevices) {
      return {
        hasCamera: false,
        canStream: false,
        permissionStatus: 'unknown',
        disclaimer: 'Camera API unavailable in this environment. Falling back to native file selector.',
      };
    }

    try {
      // Check devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const hasCamera = videoDevices.length > 0;

      // Check permission query if supported
      let permissionStatus: 'granted' | 'prompt' | 'denied' | 'unknown' = 'prompt';
      if (navigator.permissions && (navigator.permissions as any).query) {
        try {
          const res = await (navigator.permissions as any).query({ name: 'camera' });
          permissionStatus = res.state || 'prompt';
        } catch {
          permissionStatus = 'unknown';
        }
      }

      return {
        hasCamera,
        canStream: hasCamera && typeof navigator.mediaDevices.getUserMedia === 'function',
        permissionStatus,
        disclaimer: hasCamera
          ? 'Live camera ready on device. All processing occurs locally — no photos are uploaded to any server.'
          : 'No camera hardware detected on this device. File upload fallback will be used.',
      };
    } catch {
      return {
        hasCamera: false,
        canStream: false,
        permissionStatus: 'denied',
        disclaimer: 'Camera access denied or restricted by device security policy.',
      };
    }
  }

  async startViewfinder(videoEl: HTMLVideoElement): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Live camera streaming is not supported on this browser or platform.');
    }

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' }, // Prefer rear camera on mobile
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    await videoEl.play();
    return stream;
  }

  stopViewfinder(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch {
        // ignore
      }
    });
  }

  captureSnapshot(videoEl: HTMLVideoElement): CameraSnapshotResult | null {
    if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    return {
      dataUrl,
      timestamp: new Date().toISOString(),
      source: 'LOCAL_LIVE_CAMERA',
      dimensions: {
        width: canvas.width,
        height: canvas.height,
      },
    };
  }
}

export const cameraProvider: ICameraProvider = new BrowserCameraProvider();
