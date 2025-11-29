import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { MediaAttachment } from "@shared/schema";

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadMedia = async (
    file: File,
    messageId: string,
    fileType: "image" | "video" | "file"
  ): Promise<MediaAttachment | null> => {
    try {
      setIsUploading(true);

      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = async (e) => {
          try {
            const base64Data = (e.target?.result as string)?.split(",")[1];

            const response = await fetch("/api/media/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messageId,
                fileName: file.name,
                fileType,
                mimeType: file.type,
                base64Data,
              }),
            });

            if (!response.ok) {
              throw new Error("Upload failed");
            }

            const media = await response.json();
            toast({
              title: "Upload complete",
              description: `${file.name} uploaded successfully`,
            });
            resolve(media);
          } catch (error) {
            toast({
              title: "Upload failed",
              description: "Failed to upload media",
              variant: "destructive",
            });
            resolve(null);
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive",
      });
      return null;
    }
  };

  return { uploadMedia, isUploading };
}
