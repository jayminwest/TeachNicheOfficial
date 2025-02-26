'use client';

import { SuccessMessage } from "@/app/components/ui/success-message";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, you would verify the session with your backend
    // For the test, we'll just simulate a successful verification
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [sessionId]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12">
      <SuccessMessage />
    </div>
  );
}
