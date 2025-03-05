"use client";

import { useEffect, useState } from "react";
import { hasSuccessfulPurchaseParams, cleanPurchaseParams } from "@/app/utils/purchase-helpers";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { LessonGrid } from "@/app/components/ui/lesson-grid";
import Link from "next/link";
import { useLessons } from "@/app/hooks/use-lessons";
import { toast } from "@/app/components/ui/use-toast";
import { Toaster } from "@/app/components/ui/toaster";

export default function LessonsPage() {
  const { lessons, loading, error } = useLessons();
  
  // Track if we've detected a purchase success
  const [purchaseDetected, setPurchaseDetected] = useState(false);
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load lessons. Please try again.",
        variant: "destructive",
      });
    }
    
    // Check if there's a purchase success parameter in the URL
    const hasPurchaseParams = hasSuccessfulPurchaseParams();
    if (hasPurchaseParams) {
      setPurchaseDetected(true);
      
      // Show success toast
      toast({
        title: "Purchase Successful",
        description: "Your lesson purchase was successful. You now have access to this content.",
        variant: "default",
      });
      
      // Clean up URL parameters
      cleanPurchaseParams();
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Lessons
            </h1>
            <p className="mt-2 text-muted-foreground">
              Browse and manage your lessons
            </p>
          </div>
          <Link href="/lessons/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Lesson
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : lessons.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="font-semibold mb-2">No lessons yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first lesson
            </p>
            <Link href="/lessons/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Lesson
              </Button>
            </Link>
          </Card>
        ) : (
          <LessonGrid 
            lessons={lessons} 
            key={purchaseDetected ? 'post-purchase' : 'normal'}
          />
        )}
      </div>
      <Toaster />
    </div>
  );
}
