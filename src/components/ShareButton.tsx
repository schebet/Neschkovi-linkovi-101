import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Mail, Link as LinkIcon } from 'lucide-react';
import { copyToClipboard } from '../utils/linkUtils';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ url, title, description }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const canShare = navigator.share !== undefined;

  const handleNativeShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        setShowMenu(false);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fallback to copy
          handleCopyLink();
        }
      }
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n${description || ''}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowMenu(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description || ''}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShowMenu(false);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`${title} ${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    setShowMenu(false);
  };

  const shareViaFacebook = () => {
    const shareUrl = encodeURIComponent(url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 transition-colors group"
        title="Подели линк"
      >
        <Share2 className="w-4 h-4 text-purple-300 group-hover:text-purple-200" />
      </button>

      {showMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 shadow-xl z-50">
          <div className="space-y-1">
            {/* Native Share (if supported) */}
            {canShare && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <Share2 className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm">Подели</span>
              </button>
            )}

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-green-400" />
              )}
              <span className="text-white text-sm">
                {copied ? 'Копирано!' : 'Копирај линк'}
              </span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={shareViaWhatsApp}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <MessageCircle className="w-4 h-4 text-green-500" />
              <span className="text-white text-sm">WhatsApp</span>
            </button>

            {/* Email */}
            <button
              onClick={shareViaEmail}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <Mail className="w-4 h-4 text-blue-500" />
              <span className="text-white text-sm">Email</span>
            </button>

            {/* Twitter */}
            <button
              onClick={shareViaTwitter}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-4 h-4 bg-blue-400 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">𝕏</span>
              </div>
              <span className="text-white text-sm">Twitter/X</span>
            </button>

            {/* Facebook */}
            <button
              onClick={shareViaFacebook}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              <span className="text-white text-sm">Facebook</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};