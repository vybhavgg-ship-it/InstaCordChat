import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface VoiceCallWidgetProps {
  channelId: string;
  currentUserId: string;
  isVisible: boolean;
  onClose: () => void;
}

export function VoiceCallWidget({
  channelId,
  currentUserId,
  isVisible,
  onClose,
}: VoiceCallWidgetProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isCallActive) return;
    const interval = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCallActive]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      localStreamRef.current = stream;
      setIsCallActive(true);
      toast({
        title: "Call started",
        description: "Voice call is now active",
      });
    } catch (error) {
      toast({
        title: "Permission denied",
        description: "Unable to access microphone",
        variant: "destructive",
      });
    }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    setIsCallActive(false);
    setCallDuration(0);
    setIsMuted(false);
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  if (!isVisible) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Card className="fixed bottom-4 right-4 p-4 z-40 w-80">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Voice Call</h3>
          <span className="text-sm text-muted-foreground">
            {formatDuration(callDuration)}
          </span>
        </div>

        <div className="flex gap-2 justify-center">
          {!isCallActive ? (
            <Button
              onClick={startCall}
              className="gap-2"
              data-testid="button-start-call"
            >
              <Phone className="h-4 w-4" />
              Start Call
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "default"}
                size="icon"
                data-testid="button-toggle-mute"
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={endCall}
                variant="destructive"
                className="gap-2"
                data-testid="button-end-call"
              >
                <PhoneOff className="h-4 w-4" />
                End Call
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
