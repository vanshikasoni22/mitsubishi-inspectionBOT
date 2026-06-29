'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Camera, RefreshCw, Sliders, ShieldCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const [cvLoaded, setCvLoaded] = useState(false);
  const [cvInitializing, setCvInitializing] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'normal' | 'grayscale' | 'canny' | 'threshold'>('normal');
  
  // Quality Check state
  const [blurScore, setBlurScore] = useState<number>(0);
  const [focusStatus, setFocusStatus] = useState<'calibrating' | 'blurry' | 'clear'>('calibrating');
  const [enableQualityCheck, setEnableQualityCheck] = useState(true);

  // References for processing loop
  const loopRef = useRef<number | null>(null);
  const cvRef = useRef<any>(null);

  // Initialize OpenCV script loading check
  useEffect(() => {
    // If cv is already in window
    if (typeof window !== 'undefined' && (window as any).cv) {
      cvRef.current = (window as any).cv;
      setCvLoaded(true);
      setCvInitializing(false);
    }
  }, []);

  const handleCvLoad = () => {
    if (typeof window !== 'undefined' && (window as any).cv) {
      // opencv.js sometimes takes a second to compile WASM after loading script
      const checkCvReady = setInterval(() => {
        try {
          // Attempt to call a simple CV construct to test WASM binding
          const mat = new (window as any).cv.Mat();
          mat.delete();
          clearInterval(checkCvReady);
          cvRef.current = (window as any).cv;
          setCvLoaded(true);
          setCvInitializing(false);
          toast.success('OpenCV.js WebAssembly loaded!');
        } catch (e) {
          // WASM still compiling
        }
      }, 200);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // back camera for inspections
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access failed:', err);
      toast.error('Unable to access camera. Please verify permissions.');
    }
  };

  const stopCamera = () => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setFocusStatus('calibrating');
  };

  // Auto-start camera when active
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Frame processing loop using OpenCV
  useEffect(() => {
    if (!cameraActive || !cvLoaded) return;

    const video = videoRef.current;
    const displayCanvas = displayCanvasRef.current;
    const hiddenCanvas = hiddenCanvasRef.current;
    const cv = cvRef.current;

    if (!video || !displayCanvas || !hiddenCanvas || !cv) return;

    const processFrame = () => {
      if (video.paused || video.ended) {
        loopRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      // Adjust canvas sizes
      if (displayCanvas.width !== width) {
        displayCanvas.width = width;
        displayCanvas.height = height;
      }
      if (hiddenCanvas.width !== width) {
        hiddenCanvas.width = width;
        hiddenCanvas.height = height;
      }

      const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        loopRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Draw current video frame to hidden canvas
      ctx.drawImage(video, 0, 0, width, height);

      try {
        // Read src from hidden canvas
        const src = cv.imread(hiddenCanvas);
        const dst = new cv.Mat();

        // Apply Focus/Blur Quality Check using Laplacian Variance (on Grayscale)
        if (enableQualityCheck) {
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
          
          const laplacianMat = new cv.Mat();
          cv.Laplacian(gray, laplacianMat, cv.CV_64F);
          
          const mean = new cv.Mat();
          const stddev = new cv.Mat();
          cv.meanStdDev(laplacianMat, mean, stddev);
          
          const variance = stddev.data64F[0] * stddev.data64F[0];
          setBlurScore(Math.round(variance));
          
          if (variance < 10) {
            setFocusStatus('blurry');
          } else {
            setFocusStatus('clear');
          }

          gray.delete();
          laplacianMat.delete();
          mean.delete();
          stddev.delete();
        }

        // Apply selected Filter
        switch (selectedFilter) {
          case 'grayscale':
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
            break;
          case 'canny':
            const grayCanny = new cv.Mat();
            cv.cvtColor(src, grayCanny, cv.COLOR_RGBA2GRAY);
            cv.Canny(grayCanny, dst, 50, 120, 3, false);
            grayCanny.delete();
            break;
          case 'threshold':
            const grayThresh = new cv.Mat();
            cv.cvtColor(src, grayThresh, cv.COLOR_RGBA2GRAY);
            cv.threshold(grayThresh, dst, 100, 255, cv.THRESH_BINARY);
            grayThresh.delete();
            break;
          case 'normal':
          default:
            src.copyTo(dst);
            break;
        }

        // Render processed Mat to display canvas
        cv.imshow(displayCanvas, dst);

        // Delete Mats to prevent WebAssembly memory leaks
        src.delete();
        dst.delete();
      } catch (err) {
        console.error('OpenCV frame processing error:', err);
      }

      loopRef.current = requestAnimationFrame(processFrame);
    };

    loopRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current);
        loopRef.current = null;
      }
    };
  }, [cameraActive, cvLoaded, selectedFilter, enableQualityCheck]);

  // Capture image handler
  const handleCapture = () => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;

    if (enableQualityCheck && focusStatus === 'blurry') {
      toast.error('⚠️ Capture blocked! Image is too blurry. Re-focus the camera.', { duration: 4000 });
      return;
    }

    displayCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `captured-part-${Date.now()}.png`, { type: 'image/png' });
        onCapture(file);
        toast.success('Photo captured and processed by OpenCV!');
      }
    }, 'image/png');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Dynamic OpenCV Script Injector */}
      <Script 
        src="https://docs.opencv.org/4.7.0/opencv.js" 
        strategy="lazyOnload"
        onLoad={handleCvLoad}
        onError={() => {
          setCvInitializing(false);
          toast.error('Failed to load OpenCV.js. Local processing unavailable.');
        }}
      />

      {/* Camera Panel wrapper */}
      <div className="glass-card" style={{ padding: 16, border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
        
        {/* Video feed container */}
        <div style={{ position: 'relative', width: '100%', background: '#000', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9' }}>
          
          {/* Invisible elements for feed */}
          <video 
            ref={videoRef} 
            style={{ display: 'none' }} 
            playsInline 
            muted 
          />
          <canvas 
            ref={hiddenCanvasRef} 
            style={{ display: 'none' }} 
          />

          {/* Visible Display Canvas with OpenCV Processing */}
          {cvLoaded && cameraActive ? (
            <canvas 
              ref={displayCanvasRef} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <RefreshCw size={36} className="animate-spin-slow" />
              <p style={{ fontSize: 14 }}>
                {cvInitializing ? 'Compiling OpenCV WebAssembly...' : 'Starting camera feed...'}
              </p>
            </div>
          )}

          {/* Blur Warning Overlay */}
          {enableQualityCheck && focusStatus === 'blurry' && (
            <div style={{
              position: 'absolute', top: 12, left: 12, right: 12,
              background: 'rgba(255, 75, 107, 0.85)', backdropFilter: 'blur(4px)',
              padding: '8px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(255, 75, 107, 0.3)', color: '#fff', fontSize: 13, fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <AlertTriangle size={16} />
              <span>Camera focus blurry (Score: {blurScore}). Please stabilize or clean your camera lens.</span>
            </div>
          )}

          {/* Clear Focus Tag Overlay */}
          {enableQualityCheck && focusStatus === 'clear' && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'rgba(0, 230, 118, 0.85)', backdropFilter: 'blur(4px)',
              padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
              color: '#000', fontSize: 12, fontWeight: 700,
            }}>
              <ShieldCheck size={14} />
              <span>Optimal Focus (Score: {blurScore})</span>
            </div>
          )}

          {/* Filter Badge overlay */}
          {selectedFilter !== 'normal' && (
            <div style={{
              position: 'absolute', bottom: 12, left: 12,
              background: 'rgba(0, 102, 204, 0.75)', padding: '4px 10px', borderRadius: 4,
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#fff',
              letterSpacing: '0.05em'
            }}>
              CV FILTER: {selectedFilter}
            </div>
          )}
        </div>

        {/* OpenCV & Camera Controls */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Controls line 1: Filters selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
              <Sliders size={14} />
              <span>OpenCV Filter:</span>
            </div>
            
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'grayscale', label: 'Grayscale' },
                { id: 'canny', label: 'Canny Edge' },
                { id: 'threshold', label: 'Binarize' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as any)}
                  className={`btn-ghost ${selectedFilter === f.id ? 'active' : ''}`}
                  style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 6,
                    background: selectedFilter === f.id ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                    color: selectedFilter === f.id ? '#fff' : 'var(--text-secondary)',
                    border: selectedFilter === f.id ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls line 2: Settings and Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 10, borderTop: '1px solid var(--glass-border)' }}>
            
            {/* Toggle Blur check */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={enableQualityCheck} 
                onChange={(e) => setEnableQualityCheck(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>Check Image Blur (Laplacian check)</span>
            </label>

            {/* Primary Action Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-secondary" 
                style={{ fontSize: 13, padding: '8px 16px' }}
              >
                Close Camera
              </button>

              <button
                type="button"
                onClick={handleCapture}
                disabled={!cvLoaded || !cameraActive || (enableQualityCheck && focusStatus === 'blurry')}
                className="btn-primary"
                style={{
                  fontSize: 13, padding: '8px 20px',
                  opacity: (enableQualityCheck && focusStatus === 'blurry') ? 0.5 : 1
                }}
              >
                <Camera size={14} />
                Capture Frame
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
