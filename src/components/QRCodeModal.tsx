import React, { useEffect, useState, useRef } from 'react';
import { X, Download, Copy, Check, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { copyToClipboard } from '../utils/linkUtils';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ 
  isOpen, 
  onClose, 
  url, 
  title 
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !url) return;

    const generateQRCode = async () => {
      try {
        setLoading(true);
        
        // Generate QR code with custom styling
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1E3A8A', // Dark blue
            light: '#FFFFFF', // White background
          },
          errorCorrectionLevel: 'M',
        });
        
        setQrCodeDataUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQRCode();
  }, [isOpen, url]);

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = `qr-${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (error) {
        // Fallback to copy if share fails
        handleCopyUrl();
      }
    } else {
      // Fallback to copy if Web Share API is not supported
      handleCopyUrl();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">QR код за линк</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* QR Code Display */}
        <div className="text-center mb-6">
          <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-lg">
            {loading ? (
              <div className="w-[300px] h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <img 
                src={qrCodeDataUrl} 
                alt={`QR код за ${title}`}
                className="w-[300px] h-[300px] object-contain"
              />
            )}
          </div>
          
          <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
          <p className="text-blue-200 text-sm break-all bg-white/5 p-2 rounded-lg">
            {url}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex flex-col items-center gap-2 p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 text-blue-300" />
            <span className="text-blue-200 text-xs font-medium">Преузми</span>
          </button>
          
          <button
            onClick={handleCopyUrl}
            className="flex flex-col items-center gap-2 p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-300" />
            ) : (
              <Copy className="w-5 h-5 text-green-300" />
            )}
            <span className="text-green-200 text-xs font-medium">
              {copied ? 'Копирано!' : 'Копирај'}
            </span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-2 p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5 text-purple-300" />
            <span className="text-purple-200 text-xs font-medium">Подели</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
          <p className="text-blue-200 text-xs text-center">
            Скенирајте овај QR код да отворите линк на другом уређају
          </p>
        </div>
      </div>
    </div>
  );
};