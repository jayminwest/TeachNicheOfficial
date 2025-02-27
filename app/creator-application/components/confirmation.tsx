import { CheckCircle2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

export function Confirmation() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Application Submitted!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for applying to become a creator on Teach Niche. We've received your application and will review it shortly.
        </p>
      </div>
      
      <div className="space-y-4 max-w-md mx-auto">
        <div className="bg-muted p-4 rounded-lg text-left">
          <h3 className="font-medium mb-2">What happens next?</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Our team will review your application (typically within 3-5 business days)</li>
            <li>You'll receive an email notification about your application status</li>
            <li>If approved, you'll gain access to creator tools and can start publishing lessons</li>
          </ol>
        </div>
      </div>
      
      <div className="pt-4">
        <Link href="/profile">
          <Button>Return to Profile</Button>
        </Link>
      </div>
    </div>
  );
}
