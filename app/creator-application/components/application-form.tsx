"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { useAuth } from "@/app/services/auth/AuthContext";
import { Button } from "@/app/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { toast } from "@/app/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";

const applicationFormSchema = z.object({
  motivation: z.string().min(100, {
    message: "Please tell us more about why you want to become a creator (minimum 100 characters).",
  }),
  lessonTitle: z.string().min(5, {
    message: "Lesson title must be at least 5 characters.",
  }).max(100, {
    message: "Lesson title must not exceed 100 characters."
  }),
  lessonContent: z.string().min(300, {
    message: "Please provide more content for your sample lesson (minimum 300 characters).",
  }),
  teachingApproach: z.string().min(100, {
    message: "Please describe your teaching approach in more detail (minimum 100 characters).",
  }),
  instagramHandle: z.string().optional()
    .refine(val => !val || val.startsWith('@'), {
      message: "Instagram handle should start with @",
    })
    .refine(val => !val || (val.length > 1 && val.length <= 31), {
      message: "Instagram handle should be between 1 and 30 characters (excluding @)",
    })
    .refine(val => !val || /^@[a-zA-Z0-9._]+$/.test(val), {
      message: "Instagram handle can only contain letters, numbers, periods, and underscores",
    }),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

interface ApplicationFormProps {
  onSubmitSuccess: () => void;
}

export function ApplicationForm({ onSubmitSuccess }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      motivation: "",
      lessonTitle: "",
      lessonContent: "",
      teachingApproach: "",
      instagramHandle: "",
    },
  });

  async function onSubmit(data: ApplicationFormValues) {
    if (!user) {
      setError("You must be logged in to submit an application.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/creator-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit application");
      }

      toast({
        title: "Application submitted",
        description: "Your creator application has been submitted successfully.",
      });
      
      onSubmitSuccess();
    } catch (err) {
      console.error('Application submission failed:', err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      
      toast({
        title: "Error",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="motivation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Why do you want to become a creator?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your motivation, experience, and what you hope to achieve as a creator..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Share your passion and explain why you'd be a great addition to our creator community.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lessonTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sample Lesson Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a title for your sample lesson" {...field} />
                </FormControl>
                <FormDescription>
                  Choose a clear, engaging title that represents your teaching style.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lessonContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sample Lesson Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write a short sample lesson demonstrating your teaching style and expertise..."
                    className="min-h-[200px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This helps us understand your teaching style and expertise. Include key points you would cover in a real lesson.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="teachingApproach"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Teaching Approach</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe how you would approach teaching your subject..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explain your teaching philosophy, methods, and how you engage students.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="instagramHandle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram Handle (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="@yourusername" {...field} />
                </FormControl>
                <FormDescription>
                  If you have an Instagram account showcasing your expertise, please share it.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
