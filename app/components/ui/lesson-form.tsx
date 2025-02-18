import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { VideoUploader } from './video-uploader';
import { useToast } from './use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';

const lessonFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  content: z.string().optional(),
  muxAssetId: z.string().min(1, 'Video is required'),
});

type LessonFormData = z.infer<typeof lessonFormSchema>;

interface LessonFormProps {
  initialData?: Partial<LessonFormData>;
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
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // Debug form state
  console.log('Form state:', {
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
    isUploading,
    isSubmitting,
    values: form.getValues()
  });

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      content: initialData?.content || '',
      muxAssetId: initialData?.muxAssetId || '',
    },
  });

  const handleSubmit = async (data: LessonFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save lesson',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Set to 0 for free lessons
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormDescription>
                  Additional content or notes for the lesson
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="muxAssetId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video</FormLabel>
                <FormControl>
                  <div>
                    <VideoUploader
                      endpoint="/api/video/upload"
                      onUploadStart={() => setIsUploading(true)}
                      onUploadComplete={(assetId) => {
                        setIsUploading(false);
                        field.onChange(assetId);
                        toast({
                          title: "Video uploaded",
                          description: "Your video has been uploaded successfully.",
                        });
                      }}
                      onError={(error) => {
                        setIsUploading(false);
                        toast({
                          title: "Upload failed",
                          description: error.message,
                          variant: "destructive",
                        });
                      }}
                    />
                    <div className="text-sm text-muted-foreground mt-2">
                      Upload state: {isUploading ? 'Uploading...' : field.value ? 'Uploaded' : 'Not uploaded'}
                      {field.value && <span className="ml-2">(Asset ID: {field.value})</span>}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? 'Saving...' : 'Save Lesson'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
