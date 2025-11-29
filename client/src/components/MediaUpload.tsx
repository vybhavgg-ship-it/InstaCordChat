import { useState, useRef } from "react";
import { Image, Video, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  onMediaSelect: (file: File, type: "image" | "video" | "file") => void;
  disabled?: boolean;
}

export function MediaUpload({ onMediaSelect, disabled }: MediaUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File, type: "image" | "video" | "file") => {
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    onMediaSelect(file, type);
  };

  return (
    <div className="flex gap-2">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, "image");
        }}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, "video");
        }}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, "file");
        }}
        className="hidden"
      />

      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={disabled}
        onClick={() => imageInputRef.current?.click()}
        title="Upload image"
        data-testid="button-upload-image"
      >
        <Image className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={disabled}
        onClick={() => videoInputRef.current?.click()}
        title="Upload video"
        data-testid="button-upload-video"
      >
        <Video className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        title="Upload file"
        data-testid="button-upload-file"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {selectedFile && (
        <div className="flex items-center gap-2 px-2 py-1 bg-secondary rounded text-sm text-foreground">
          <span className="truncate">{selectedFile.name}</span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-4 w-4"
            onClick={() => setSelectedFile(null)}
            data-testid="button-remove-media"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
