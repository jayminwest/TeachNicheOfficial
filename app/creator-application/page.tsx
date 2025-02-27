"use client"

import { useAuth } from "@/app/services/auth/AuthContext";
import { ApplicationForm } from "./components/application-form";
import { Confirmation } from "./components/confirmation";
import { useState } from "react";
import { redirect } from "next/navigation";

export default function CreatorApplicationPage() {
  const { isAuthenticated, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  
  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    redirect("/login?callbackUrl=/creator-application");
  }
  
  return (
    <div className="container max-w-3xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Creator Application</h1>
          <p className="text-muted-foreground mt-2">
            Share your expertise and join our community of creators.
          </p>
        </div>
        
        {submitted ? (
          <Confirmation />
        ) : (
          <ApplicationForm onSubmitSuccess={() => setSubmitted(true)} />
        )}
      </div>
    </div>
  );
}
