import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  fileName?: string;
}

export function MediaViewer({ isOpen, onClose, mediaUrl, mediaType, fileName }: MediaViewerProps) {
  // Always render Dialog - Radix UI Dialog needs to be mounted to work
  console.log('🎬 MediaViewer render:', { isOpen, hasMediaUrl: !!mediaUrl, mediaType, fileName });
  
  return (
    <Dialog open={isOpen && !!mediaUrl} onOpenChange={(open) => {
      console.log('🔄 Dialog onOpenChange:', { open, isOpen, hasMediaUrl: !!mediaUrl });
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 bg-black/95 border-none"
        showCloseButton={false}
        onInteractOutside={(e) => {
          // Allow closing by clicking outside
          onClose();
        }}
        onEscapeKeyDown={onClose}
      >
        <div className="relative w-full h-full flex items-center justify-center min-h-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
            onClick={onClose}
            aria-label="Close media viewer"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
            {mediaType === 'image' ? (
              <img
                src={mediaUrl}
                alt={fileName || 'Media'}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: 'calc(95vh - 2rem)' }}
                onError={(e) => {
                  console.error('Failed to load image:', mediaUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-full"
                style={{ maxHeight: 'calc(95vh - 2rem)' }}
                onError={(e) => {
                  console.error('Failed to load video:', mediaUrl);
                }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          
          {fileName && (
            <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
              <p className="text-white text-sm bg-black/70 px-3 py-1 rounded inline-block backdrop-blur-sm">
                {fileName}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

