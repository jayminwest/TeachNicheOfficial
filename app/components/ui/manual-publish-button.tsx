"use client";

import { useState } from 'react';
import { Button } from './button';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ManualPublishButtonProps {
  lessonId: string;
  onSuccess?: () => void;
  className?: string;
}

export function ManualPublishButton({ 
  lessonId, 
  onSuccess,
  className 
}: ManualPublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch(`/api/lessons/${lessonId}/publish`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish lesson');
      }
      
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <div className={className}>
      {error && (
        <div className="mb-2 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-2 text-sm text-green-600 flex items-center">
          <CheckCircle className="h-4 w-4 mr-1" />
          Lesson published successfully!
        </div>
      )}
      
      <Button
        onClick={handlePublish}
        disabled={isPublishing || success}
        variant={success ? "outline" : "default"}
      >
        {isPublishing ? 'Publishing...' : success ? 'Published' : 'Publish Lesson'}
      </Button>
    </div>
  );
}
