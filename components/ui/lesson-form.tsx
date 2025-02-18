"use client";

import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "./button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { VideoUploader } from "./video-uploader";
import { toast } from "@/components/ui/use-toast";
import { Card } from "./card";
import { Loader2 } from "lucide-react";

const lessonFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  muxAssetId: z.string().optional(),
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
      price: 0,
      muxAssetId: "", // Initialize muxAssetId field
    },
  });

  const hasVideo = !!form.watch("muxAssetId");

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
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (USD)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
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
                  </div>
                </FormControl>
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
              onUploadComplete={(assetId) => {
                form.setValue("muxAssetId", assetId, { shouldValidate: true });
                console.log("Asset ID set:", assetId);
                console.log("Form values:", form.getValues()); // Debug log
                toast({
                  title: "Video uploaded",
                  description: "Your video has been uploaded successfully.",
                });
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
