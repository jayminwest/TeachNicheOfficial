"use client";

import { cn } from "@/app/lib/utils";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MarkdownEditor } from "./markdown-editor";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "./button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { VideoUploader } from "./video-uploader";
import { toast } from "@/app/components/ui/use-toast";
import { Card } from "./card";
import { Loader2 } from "lucide-react";

const lessonFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  content: z.string()
    .min(1, "Content is required")
    .max(50000, "Content must be less than 50000 characters"),
  muxAssetId: z.string().optional(),
  muxPlaybackId: z.string().optional(),
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
}

export function LessonForm({ 
  initialData, 
  onSubmit,
  isSubmitting = false,
  className 
}: LessonFormProps) {
  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      content: "",
      price: 0,
      muxAssetId: "", // Initialize muxAssetId field
      muxPlaybackId: "", // Initialize muxPlaybackId field
    },
  });

  const [videoUploaded, setVideoUploaded] = useState(false);
  const hasVideo = videoUploaded || !!form.watch("muxAssetId");
  
  console.log("Form State:", {
    muxAssetId: form.watch("muxAssetId"),
    muxPlaybackId: form.watch("muxPlaybackId"),
    hasVideo,
    videoUploaded
  });

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
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
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Set a fair price for your lesson content (leave at 0 for free)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Lesson Video</h3>
              <p className="text-sm text-muted-foreground">
                Upload your lesson video content
              </p>
            </div>
            
            <VideoUploader
              endpoint="/api/video/upload"
              onUploadComplete={async (assetId) => {
                try {
                  setVideoUploaded(true);
                  form.setValue("muxAssetId", assetId, { 
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true
                  });
                  
                  // Wait for the asset to be ready and get the playback ID
                  const response = await fetch(`/api/mux/asset-status?assetId=${assetId}`);
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                      errorData.error || errorData.details || 
                      `Failed to get asset status: ${response.status}`
                    );
                  }
                  
                  const data = await response.json();
                  console.log("Asset status response:", data);
                  if (data.playbackId) {
                    form.setValue("muxPlaybackId", data.playbackId, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true
                    });
                    console.log("Asset and Playback IDs set:", {
                      assetId,
                      playbackId: data.playbackId
                    });
                  } else {
                    throw new Error('No playback ID received');
                  }
                  
                  console.log("Form values after upload:", form.getValues());
                  toast({
                    title: "Video uploaded",
                    description: "Your video has been uploaded and processed successfully.",
                  });
                } catch (error) {
                  console.error("Error processing video:", error);
                  toast({
                    title: "Upload processing error",
                    description: error instanceof Error ? error.message : "Failed to process video",
                    variant: "destructive",
                  });
                }
              }}
              onError={(error) => {
                toast({
                  title: "Upload failed",
                  description: error.message,
                  variant: "destructive",
                });
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
            {isSubmitting ? "Creating Lesson..." : "Create Lesson"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
