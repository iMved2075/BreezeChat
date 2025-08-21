import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X, Download, Maximize2, Minimize2 } from "lucide-react";

export default function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  fileName, 
  onDownload 
}) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${
          isFullscreen 
            ? 'max-w-none w-screen h-screen rounded-none' 
            : 'max-w-4xl w-full'
        } p-0 bg-black/95 border-none transition-all duration-300 [&>button]:hidden`}
      >
        <VisuallyHidden.Root>
          <DialogTitle>{fileName ? `Image: ${fileName}` : 'Image Viewer'}</DialogTitle>
        </VisuallyHidden.Root>
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {/* Image */}
          <img
            src={imageUrl}
            alt={fileName || 'Image'}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ maxHeight: isFullscreen ? '100vh' : '80vh' }}
          />
          
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 dark:bg-white/20 dark:hover:bg-white/30 text-white border-0"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 dark:bg-white/20 dark:hover:bg-white/30 text-white border-0"
              onClick={() => onDownload(imageUrl, fileName)}
              title="Download image"
            >
              <Download size={14} />
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 dark:bg-white/20 dark:hover:bg-white/30 text-white border-0"
              onClick={onClose}
              title="Close"
            >
              <X size={14} />
            </Button>
          </div>
          
          {/* Image info */}
          {fileName && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 dark:bg-black/80 text-white p-3 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-medium truncate">{fileName}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
