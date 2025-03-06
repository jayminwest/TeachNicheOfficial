"use client";

import { cn } from "@/app/lib/utils";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MarkdownEditor } from "./markdown-editor";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ImageUploader } from "./image-uploader";
import { Button } from "./button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { VideoUploader } from "./video-uploader";
import { useToast } from "@/app/components/ui/use-toast";
import { Card } from "./card";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const lessonFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  content: z.string()
    .min(1, "Content is required")
    .max(50000, "Content must be less than 50000 characters"),
  muxAssetId: z.string().optional().nullable(),
  muxPlaybackId: z.union([
    z.string(),
    z.literal(""),
    z.null(),
    z.undefined()
  ]).optional().transform(val => val || ""), // Transform null/undefined to empty string
  thumbnail_url: z.string().optional().default(""),
  thumbnailUrl: z.string().optional().default(""), // Keep for backward compatibility
  price: z.number()
    .min(0, "Price must be positive")
    .max(999.99, "Price must be less than $1000")
    .optional(),
});

type LessonFormData = z.infer<typeof lessonFormSchema>;

interface LessonFormProps {
  initialData?: LessonFormData;
  onSubmit: (data: LessonFormData) => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
  isEditing?: boolean;
}

export function LessonForm({ 
  initialData, 
  onSubmit,
  isSubmitting = false,
  className,
  isEditing = false
}: LessonFormProps) {
  // Get toast function from the hook
  const { toast } = useToast();
  
  // Add state for Stripe account
  const [hasStripeAccount, setHasStripeAccount] = useState<boolean | null>(null);
  const [isCheckingStripe, setIsCheckingStripe] = useState(true);
  const [stripeAccountStatus, setStripeAccountStatus] = useState<{
    connected: boolean;
    onboardingComplete: boolean;
    error?: string;
  } | null>(null);
  
  // Check if user has a Stripe account
  useEffect(() => {
    async function checkStripeAccount() {
      try {
        setIsCheckingStripe(true);
        
        // First check if account exists
        const response = await fetch('/api/profile/stripe-status');
        
        if (!response.ok) {
          setStripeAccountStatus({
            connected: false,
            onboardingComplete: false,
            error: 'Failed to check Stripe account status'
          });
          setHasStripeAccount(false);
          return;
        }
        
        const data = await response.json();
        
        setStripeAccountStatus({
          connected: !!data.stripeAccountId,
          onboardingComplete: !!data.isComplete,
          error: data.error
        });
        
        setHasStripeAccount(!!data.stripeAccountId && !!data.isComplete);
      } catch (error) {
        console.error('Failed to check Stripe account:', error);
        setStripeAccountStatus({
          connected: false,
          onboardingComplete: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        setHasStripeAccount(false);
      } finally {
        setIsCheckingStripe(false);
      }
    }
    
    checkStripeAccount();
  }, []);
  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      // Ensure both thumbnail fields are set if one is provided
      thumbnail_url: initialData.thumbnail_url || initialData.thumbnailUrl || "",
      thumbnailUrl: initialData.thumbnailUrl || initialData.thumbnail_url || "",
    } : {
      title: "",
      description: "",
      content: "",
      price: 0,
      muxAssetId: "", // Initialize muxAssetId field
      muxPlaybackId: "", // Initialize muxPlaybackId field
      thumbnail_url: "", // Initialize thumbnail_url field (database column name)
      thumbnailUrl: "", // Keep for backward compatibility
    },
  });

  const [formIsDirty, setFormIsDirty] = useState(false);
  
  // Track form dirty state
  useEffect(() => {
    const subscription = form.watch(() => {
      if (!formIsDirty && form.formState.isDirty) {
        setFormIsDirty(true);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, formIsDirty]);
  
  // Add a beforeunload event listener to prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formIsDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formIsDirty, isSubmitting]);

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit((data) => {
          // Validate paid lessons require a Stripe account
          if (data.price > 0) {
            if (!hasStripeAccount) {
              toast({
                title: "Stripe Account Required",
                description: "You need to connect a Stripe account to create paid lessons",
                variant: "destructive",
              });
              return;
            }
            
            if (stripeAccountStatus && !stripeAccountStatus.onboardingComplete) {
              toast({
                title: "Stripe Onboarding Incomplete",
                description: "Please complete your Stripe onboarding before creating paid lessons",
                variant: "destructive",
              });
              return;
            }
          }
          
          // Ensure thumbnail_url is properly set
          // If only one of the thumbnail fields is set, copy it to the other
          if (data.thumbnail_url && !data.thumbnailUrl) {
            data.thumbnailUrl = data.thumbnail_url;
          } else if (data.thumbnailUrl && !data.thumbnail_url) {
            data.thumbnail_url = data.thumbnailUrl;
          }
          
          // Handle the case where a video is still processing
          if (data.muxAssetId && (!data.muxPlaybackId || data.muxPlaybackId === "processing" || data.muxPlaybackId === "")) {
            console.log("Video is still processing, setting muxPlaybackId to empty string for now");
            // Set to empty string to allow form submission - webhook will update it later
            data.muxPlaybackId = "";
            
            // Show a toast to inform the user
            toast({
              title: "Video Processing",
              description: "Your video is still processing. The lesson is published and will be updated when processing is complete.",
            });
            
            // Store a flag to redirect to the asset status page after form submission
            window.sessionStorage.setItem('redirectToAssetStatus', data.muxAssetId);
          }
          
          // Final validation check for muxPlaybackId
          if (data.muxAssetId && !data.muxPlaybackId) {
            console.log("Ensuring muxPlaybackId is set to empty string");
            data.muxPlaybackId = "";
          }
          
          console.log("Submitting lesson with data:", {
            title: data.title,
            thumbnail: {
              thumbnail_url: data.thumbnail_url,
              thumbnailUrl: data.thumbnailUrl
            },
            video: {
              muxAssetId: data.muxAssetId,
              muxPlaybackId: data.muxPlaybackId
            }
          });
          
          // Continue with form submission
          onSubmit(data);
        })}
        className={cn("space-y-8", className)}
      >
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Title</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Enter a clear, descriptive title"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Choose a title that clearly describes what students will learn
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Describe what your lesson covers and what students will learn..."
                    className="resize-none"
                    rows={4}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Provide a detailed description of your lesson content and learning outcomes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Lesson Content</FormLabel>
                <FormControl>
                  <MarkdownEditor
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Write your lesson content using Markdown. You can include headers, lists, code blocks, and more.
                </FormDescription>
                <FormMessage />
                {field.value.length === 0 && (
                  <p className="text-sm text-destructive mt-1">
                    Content is required. Please add some content for your lesson.
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (USD)</FormLabel>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      max="999.99"
                      className="pl-7"
                      {...field} 
                      value={field.value === 0 ? '' : field.value}
                      onChange={e => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Set a fair price for your lesson content (leave at 0 for free)
                </FormDescription>
              
                {/* Show detailed Stripe account status */}
                {field.value > 0 && (
                  <div className="mt-2">
                    {isCheckingStripe ? (
                      <p className="text-sm text-muted-foreground">Checking Stripe account status...</p>
                    ) : stripeAccountStatus?.connected ? (
                      stripeAccountStatus.onboardingComplete ? (
                        <p className="text-sm text-green-600">✓ Stripe account connected and ready for payments</p>
                      ) : (
                        <p className="text-sm text-destructive">
                          Your Stripe account needs to complete onboarding. Please visit your{" "}
                          <Link href="/profile/payments" className="underline font-medium">
                            payment settings
                          </Link>
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-destructive">
                        You need to{" "}
                        <Link href="/profile/payments" className="underline font-medium">
                          connect a Stripe account
                        </Link>{" "}
                        to create paid lessons
                      </p>
                    )}
                  </div>
                )}
              
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Lesson Thumbnail</h3>
              <p className="text-sm text-muted-foreground">
                Upload a thumbnail image for your lesson
              </p>
            </div>
            
            <ImageUploader
              initialImage={form.watch('thumbnail_url') || form.watch('thumbnailUrl')}
              onUploadComplete={(url) => {
                if (!url) {
                  console.log("No URL returned from upload");
                  return;
                }
                
                console.log("Thumbnail uploaded successfully:", url);
                // Set both properties for compatibility
                form.setValue("thumbnail_url", url, { 
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true
                });
                form.setValue("thumbnailUrl", url, { 
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true
                });
                
                // Ensure the form data will include both properties when submitted
                const currentValues = form.getValues();
                console.log("Form values after setting thumbnail:", {
                  thumbnail_url: currentValues.thumbnail_url,
                  thumbnailUrl: currentValues.thumbnailUrl
                });
                
                toast({
                  title: "Thumbnail uploaded",
                  description: "Your thumbnail has been uploaded successfully.",
                });
              }}
              onError={(error) => {
                console.error("Thumbnail upload error:", error);
                toast({
                  title: "Upload failed",
                  description: error.message,
                  variant: "destructive",
                });
              }}
              maxSizeMB={5}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Lesson Video</h3>
              <p className="text-sm text-muted-foreground">
                Upload your lesson video content
              </p>
            </div>
            
            <VideoUploader
              onUploadComplete={async (assetId) => {
                console.log("LessonForm received assetId:", assetId);
                try {
                  // Set the muxAssetId in the form
                  form.setValue("muxAssetId", assetId, { 
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true
                  });
                  
                  console.log("Set muxAssetId in form:", assetId);
                  console.log("Form values after setting muxAssetId:", form.getValues());
                  
                  // Store the asset ID in session storage for later use
                  try {
                    window.sessionStorage.setItem('lastMuxAssetId', assetId);
                    console.log("Stored asset ID in session storage:", assetId);
                    
                    // Try to fetch the playback ID immediately in case it's already available
                    // Use absolute URL to avoid parsing issues
                    try {
                      const apiUrl = new URL('/api/mux/playback-id', window.location.origin);
                      apiUrl.searchParams.append('assetId', assetId);
                      
                      console.log('Fetching playback ID from:', apiUrl.toString());
                      
                      fetch(apiUrl.toString(), {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        cache: 'no-store',
                        // Add a timeout to prevent hanging requests
                        signal: AbortSignal.timeout(10000) // 10 second timeout
                      })
                    .then(response => {
                      if (response.ok) {
                        return response.json();
                      }
                      // If not ready, that's expected - we'll continue with processing status
                      console.log("Playback ID not ready yet, will be set when processing completes");
                      return null;
                    })
                    .then(data => {
                      if (data && data.playbackId) {
                        console.log("Playback ID already available:", data.playbackId);
                        form.setValue("muxPlaybackId", data.playbackId, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true
                        });
                      }
                    })
                    .catch(error => {
                      // Just log the error, don't block the flow
                      console.error("Error checking for playback ID:", error);
                      // Continue with form submission even if playback ID check fails
                      console.log("Continuing with form submission despite playback ID check failure");
                    });
                    } catch (urlError) {
                      // Handle URL creation errors
                      console.error("Error creating URL for playback ID check:", urlError);
                      // Continue with form submission even if URL creation fails
                    }
                  } catch (storageError) {
                    console.error("Failed to store asset ID in session storage:", storageError);
                  }
                  
                  // Don't set a temporary playback ID - we'll get the real one from Mux
                  console.log("Setting only the asset ID for now, playback ID will be set when processing completes");
                  
                  // Set a temporary value for muxPlaybackId to indicate processing
                  // This will be updated by the webhook when processing is complete
                  form.setValue("muxPlaybackId", "processing", {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true
                  });
                  
                  // Ensure the form knows this field has been touched
                  form.trigger("muxPlaybackId");
                  
                  console.log("Form values after setting asset ID:", form.getValues());
                  
                  toast({
                    title: "Video uploaded",
                    description: "Your video has been uploaded and is now processing. You can continue filling out the form and submit when ready.",
                  });
                } catch (error) {
                  toast({
                    title: "Upload processing error",
                    description: error instanceof Error ? error.message : "Failed to process video",
                    variant: "destructive",
                  });
                }
              }}
              onError={(error) => {
                console.error("VideoUploader error:", error);
                toast({
                  title: "Upload failed",
                  description: error.message,
                  variant: "destructive",
                });
              }}
              onUploadStart={() => {
                console.log("Video upload started");
              }}
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting 
              ? (isEditing ? "Updating Lesson..." : "Creating Lesson...") 
              : (isEditing ? "Update Lesson" : "Create Lesson")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
