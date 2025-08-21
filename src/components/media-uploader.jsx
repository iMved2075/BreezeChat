import * as React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Paperclip, 
  Image, 
  Video, 
  Music, 
  FileText, 
  Upload, 
  X, 
  Check,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_FILE_TYPES = {
  image: {
    accept: "image/*",
    types: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: Image,
    color: "text-blue-500"
  },
  video: {
    accept: "video/*",
    types: ["video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov"],
    maxSize: 50 * 1024 * 1024, // 50MB
    icon: Video,
    color: "text-red-500"
  },
  audio: {
    accept: "audio/*",
    types: ["audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/m4a"],
    maxSize: 20 * 1024 * 1024, // 20MB
    icon: Music,
    color: "text-green-600"
  },
  document: {
    accept: ".pdf,.doc,.docx,.txt,.rtf",
    types: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/rtf"],
    maxSize: 25 * 1024 * 1024, // 25MB
    icon: FileText,
    color: "text-purple-500"
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (file) => {
  const mimeType = file.type;
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

const FilePreview = ({ file, onRemove, uploadProgress, uploadStatus }) => {
  const fileType = getFileType(file);
  const config = ACCEPTED_FILE_TYPES[fileType];
  const Icon = config.icon;

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.color)} />
          <CardTitle className="text-sm truncate flex-1">{file.name}</CardTitle>
          {uploadStatus !== 'uploading' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(file)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            <span className="capitalize">{fileType}</span>
          </div>
          
          {/* File preview */}
          {fileType === 'image' && (
            <div className="relative h-20 w-full overflow-hidden rounded-md">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          
          {/* Upload progress */}
          {uploadProgress > 0 && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-1" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {uploadProgress}%
                </span>
                <div className="flex items-center gap-1">
                  {uploadStatus === 'success' && (
                    <Check className="h-3 w-3 text-green-600" />
                  )}
                  {uploadStatus === 'error' && (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span className="capitalize text-muted-foreground">
                    {uploadStatus}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function MediaUploader({ 
  onUpload, 
  isOpen, 
  onClose, 
  maxFiles = 5,
  allowMultiple = true 
}) {
  const [selectedFiles, setSelectedFiles] = React.useState([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState({});
  const [uploadStatus, setUploadStatus] = React.useState({});
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const validateFile = (file) => {
    const fileType = getFileType(file);
    const config = ACCEPTED_FILE_TYPES[fileType];
    
    if (!config.types.includes(file.type)) {
      return `Unsupported file type. Please select a valid ${fileType} file.`;
    }
    
    if (file.size > config.maxSize) {
      return `File size too large. Maximum size for ${fileType} files is ${formatFileSize(config.maxSize)}.`;
    }
    
    return null;
  };

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      if (allowMultiple) {
        const totalFiles = selectedFiles.length + validFiles.length;
        if (totalFiles > maxFiles) {
          alert(`Maximum ${maxFiles} files allowed. Please select fewer files.`);
          return;
        }
        setSelectedFiles(prev => [...prev, ...validFiles]);
      } else {
        setSelectedFiles(validFiles.slice(0, 1));
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const removeFile = (fileToRemove) => {
    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
    const fileName = fileToRemove.name;
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const results = [];

    for (const file of selectedFiles) {
      try {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.name] || 0;
            if (current >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [file.name]: current + 10 };
          });
        }, 200);

        // Call the actual upload function
        const result = await onUpload(file);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
        
        results.push(result);
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
      }
    }

    setIsUploading(false);
    
    // Close dialog after successful uploads
    if (results.length > 0) {
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setUploadProgress({});
    setUploadStatus({});
    setIsUploading(false);
    onClose();
  };

  const allFileTypes = Object.values(ACCEPTED_FILE_TYPES)
    .map(config => config.accept)
    .join(',');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload Media Files</DialogTitle>
          <DialogDescription>
            Select up to {maxFiles} files to upload. Supported formats: Images, Videos, Audio, and Documents.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Drop Zone */}
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary/50 hover:bg-primary/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={allowMultiple}
              accept={allFileTypes}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 text-muted-foreground">
                <Upload className="h-full w-full" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Support for images, videos, audio, and documents
                </p>
              </div>
              
              {/* File type indicators */}
              <div className="flex justify-center gap-4 pt-4">
                {Object.entries(ACCEPTED_FILE_TYPES).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={type} className="flex flex-col items-center gap-1">
                      <Icon className={cn("h-6 w-6", config.color)} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Selected Files ({selectedFiles.length}/{maxFiles})
                </h3>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <FilePreview
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={removeFile}
                    uploadProgress={uploadProgress[file.name] || 0}
                    uploadStatus={uploadStatus[file.name]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
