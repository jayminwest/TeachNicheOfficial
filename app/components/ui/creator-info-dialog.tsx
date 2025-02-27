import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface CreatorInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatorInfoDialog({ open, onOpenChange }: CreatorInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Become a Creator</DialogTitle>
          <DialogDescription>
            Share your expertise and earn income by becoming a creator on Teach Niche.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Benefits</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Earn 85% of lesson revenue</li>
              <li>Build your personal brand and audience</li>
              <li>Flexible content creation schedule</li>
              <li>Access to analytics and student feedback</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Requirements</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Expertise in your subject area</li>
              <li>Ability to create high-quality video content</li>
              <li>Complete profile with accurate information</li>
              <li>Agree to creator terms and conditions</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Application Process</h4>
            <p className="text-sm text-muted-foreground">
              After applying, our team will review your application within 3-5 business days. 
              You&apos;ll receive an email notification once your creator status is approved.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Link href="/creator-application">
            <Button>Apply Now</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
