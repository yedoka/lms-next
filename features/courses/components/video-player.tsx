"use client";

import { useRef, useState } from "react";
import { markLessonAsComplete } from "@/features/courses/actions/progress-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface VideoPlayerProps {
  url: string;
  lessonId: string;
  isCompleted?: boolean;
}

export function VideoPlayer({ url, lessonId, isCompleted = false }: VideoPlayerProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const isUpdatingRef = useRef(false);

  const handleTimeUpdate = async () => {
    if (completed || isUpdatingRef.current) return;
    
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const percentage = (video.currentTime / video.duration) * 100;
    
    if (percentage >= 90) {
      isUpdatingRef.current = true;
      setCompleted(true);
      try {
        const result = await markLessonAsComplete(lessonId);
        if (result.success && result.message !== "Already completed") {
          toast.success(result.message);
          router.refresh();
        }
      } catch (error) {
        setCompleted(false);
        isUpdatingRef.current = false;
        console.error("Failed to mark lesson as complete", error);
      }
    }
  };

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      className="w-full h-full"
      onTimeUpdate={handleTimeUpdate}
      poster={url.replace(/\.[^/.]+$/, ".jpg")}
    />
  );
}
