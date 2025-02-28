"use client"

import { useAuth } from "@/app/services/auth/AuthContext";
import { getTimeUntilCanCreateLesson } from "@/app/services/user-restrictions";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface LessonCreationRestrictionProps {
  className?: string;
}

export function LessonCreationRestriction({ className }: LessonCreationRestrictionProps) {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number, minutes: number } | null>(null);
  
  useEffect(() => {
    if (!user?.metadata?.creationTime) return;
    
    const updateTimeRemaining = () => {
      const remaining = getTimeUntilCanCreateLesson(user.metadata.creationTime);
      setTimeRemaining(remaining);
    };
    
    // Update immediately
    updateTimeRemaining();
    
    // Then update every minute
    const interval = setInterval(updateTimeRemaining, 60000);
    
    return () => clearInterval(interval);
  }, [user?.metadata?.creationTime]);
  
  if (!timeRemaining) return null;
  
  return (
    <Alert variant="warning" className={className}>
      <Clock className="h-4 w-4" />
      <AlertTitle>New Account Restriction</AlertTitle>
      <AlertDescription>
        For security reasons, new accounts must wait 48 hours before creating lessons.
        {timeRemaining && (
          <div className="mt-2">
            Time remaining: {timeRemaining.hours} hours and {timeRemaining.minutes} minutes
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
