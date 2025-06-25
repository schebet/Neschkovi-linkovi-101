import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, CameraOff, Zap, RotateCcw } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (url: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>('');
  const [hasFlash, setHasFlash] = useState(false);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const initScanner = async () => {
      try {
        setError('');
        setIsScanning(false);

        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError('Камера није доступна на овом уређају');
          return;
        }

        // Get available cameras
        const availableCameras = await QrScanner.listCameras(true);
        setCameras(availableCameras);

        // Prefer back camera for mobile devices
        let preferredCamera = availableCameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        );

        if (!preferredCamera && availableCameras.length > 0) {
          preferredCamera = availableCameras[0];
        }

        const cameraId = preferredCamera?.id || 'environment';
        setCurrentCameraId(cameraId);

        // Create scanner instance with improved settings for mobile
        const scanner = new QrScanner(
          videoRef.current!,
          (result) => {
            try {
              const scannedText = result.data.trim();
              console.log('Scanned text:', scannedText);
              
              // More flexible URL detection
              const isUrl = isValidUrl(scannedText);
              
              if (isUrl) {
                onScan(scannedText);
                scanner.stop();
              } else {
                // Show error but continue scanning
                setError(`Скениран садржај није валидан URL: ${scannedText.substring(0, 50)}...`);
                setTimeout(() => setError(''), 4000);
              }
            } catch (err) {
              console.error('Error processing scan result:', err);
              setError('Грешка при обради скенираног садржаја');
              setTimeout(() => setError(''), 3000);
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: cameraId,
            maxScansPerSecond: 3, // Reduced for better performance on mobile
            returnDetailedScanResult: true,
            calculateScanRegion: (video) => {
              // Custom scan region for better mobile performance
              const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
              const scanRegionSize = Math.round(0.7 * smallerDimension);
              
              return {
                x: Math.round((video.videoWidth - scanRegionSize) / 2),
                y: Math.round((video.videoHeight - scanRegionSize) / 2),
                width: scanRegionSize,
                height: scanRegionSize,
              };
            },
          }
        );

        scannerRef.current = scanner;

        // Start scanner
        await scanner.start();
        setIsScanning(true);

        // Check if flash is available
        const hasFlashSupport = await scanner.hasFlash();
        setHasFlash(hasFlashSupport);

      } catch (err) {
        console.error('Scanner initialization error:', err);
        let errorMessage = 'Грешка при покретању камере.';
        
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            errorMessage = 'Приступ камери је одбијен. Молимо дозволите приступ камери у подешавањима прегледача.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'Камера није пронађена на овом уређају.';
          } else if (err.name === 'NotSupportedError') {
            errorMessage = 'Камера није подржана на овом уређају.';
          } else if (err.name === 'NotReadableError') {
            errorMessage = 'Камера је заузета другом апликацијом.';
          }
        }
        
        setError(errorMessage);
        setIsScanning(false);
      }
    };

    // Add delay to ensure proper initialization on mobile
    const timer = setTimeout(initScanner, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      setIsScanning(false);
      setFlashEnabled(false);
    };
  }, [isOpen, onScan]);

  // Improved URL validation
  const isValidUrl = (text: string): boolean => {
    // Check for common URL patterns
    const urlPatterns = [
      /^https?:\/\/.+/i,
      /^www\..+\..+/i,
      /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/,
    ];

    return urlPatterns.some(pattern => pattern.test(text)) || 
           (text.includes('.') && !text.includes(' ') && text.length > 4);
  };

  const toggleFlash = async () => {
    if (scannerRef.current && hasFlash) {
      try {
        if (flashEnabled) {
          await scannerRef.current.turnFlashOff();
          setFlashEnabled(false);
        } else {
          await scannerRef.current.turnFlashOn();
          setFlashEnabled(true);
        }
      } catch (err) {
        console.error('Flash toggle error:', err);
        setError('Блиц није доступан на овом уређају');
        setTimeout(() => setError(''), 2000);
      }
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;

    try {
      const currentIndex = cameras.findIndex(cam => cam.id === currentCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];

      await scannerRef.current.setCamera(nextCamera.id);
      setCurrentCameraId(nextCamera.id);
    } catch (err) {
      console.error('Camera switch error:', err);
      setError('Грешка при промени камере');
      setTimeout(() => setError(''), 2000);
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Скенирај QR код
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative">
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-80 object-cover bg-black"
                playsInline
                muted
                autoPlay
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Scanning frame */}
                  <div className="w-56 h-56 border-2 border-blue-400 rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    {isScanning && (
                      <div className="absolute inset-0 overflow-hidden rounded-lg">
                        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse top-1/2 transform -translate-y-1/2"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {/* Flash Toggle Button */}
                {hasFlash && (
                  <button
                    onClick={toggleFlash}
                    className={`p-3 rounded-full transition-all ${
                      flashEnabled 
                        ? 'bg-yellow-500/80 text-yellow-900' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={flashEnabled ? 'Искључи блиц' : 'Укључи блиц'}
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                )}

                {/* Camera Switch Button */}
                {cameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
                    title="Промени камеру"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-white text-lg font-medium">Камера није доступна</p>
                <p className="text-gray-300 text-sm">Проверите дозволе за камеру</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions and Error */}
        <div className="p-4 space-y-3">
          {error ? (
            <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          ) : (
            <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
              <p className="text-blue-200 text-sm text-center">
                Усмерите камеру на QR код који садржи URL
              </p>
              <p className="text-blue-300 text-xs text-center mt-1">
                Држите телефон стабилно и обезбедите добро осветљење
              </p>
            </div>
          )}

          {isScanning && (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Скенирање активно...</span>
            </div>
          )}

          {/* Camera info */}
          {cameras.length > 0 && (
            <div className="text-center">
              <p className="text-blue-300 text-xs">
                Камера: {cameras.find(cam => cam.id === currentCameraId)?.label || 'Непознато'}
              </p>
              {cameras.length > 1 && (
                <p className="text-blue-400 text-xs mt-1">
                  Притисните дугме за промену камере
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};