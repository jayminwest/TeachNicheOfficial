'use client';

import { SuccessMessage } from "@/app/components/ui/success-message";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    console.log('Success page loaded with session ID:', sessionId);
    
    // In a real app, you would verify the session with your backend
    // For the test, we'll just simulate a successful verification
    const timer = setTimeout(() => {
      console.log('Setting loading to false');
      setIsLoading(false);
    }, 100); // Reduced timeout for faster tests
    
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
    <div className="container mx-auto py-12" data-testid="success-page-container">
      <SuccessMessage />
    </div>
  );
}
