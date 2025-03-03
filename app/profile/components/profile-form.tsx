"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/app/components/ui/button"
import { useAuth } from "@/app/services/auth/AuthContext"
import { supabase } from "@/app/services/supabase"
import { useEffect, useState } from "react"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { toast } from "@/app/components/ui/use-toast"

const profileFormSchema = z.object({
  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  bio: z.string().max(500, {
    message: "Bio must not be longer than 500 characters.",
  }),
  social_media_tag: z.string().max(100, {
    message: "Social media tag must not be longer than 100 characters.",
  }).optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
      bio: "",
      social_media_tag: "",
    },
  })
  
  // We'll use a single useEffect that calls our fetchProfileData function
  useEffect(() => {
    if (user?.id) {
      console.log('User changed, fetching profile data');
      fetchProfileData();
    }
  }, [user?.id]); // Only depend on user.id to prevent unnecessary fetches

  // Define fetchProfileData outside useEffect so we can call it from the refresh button
  async function fetchProfileData() {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching profile data for user ID:', user.id);
      
      // Use the server-side API to fetch profile data to bypass RLS issues
      const response = await fetch(`/api/profile/get?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch profile');
      }
      
      if (result.data) {
        console.log('Profile data loaded:', result.data);
        
        // Create a clean object with just the fields we need
        const formData = {
          full_name: result.data.full_name || "",
          bio: result.data.bio || "",
          social_media_tag: result.data.social_media_tag || "",
        };
        
        console.log('Setting form data:', formData);
        
        // Reset the form with all values at once
        form.reset(formData);
        
        // Log the current form values after setting
        console.log('Form values after setting:', form.getValues());
      } else {
        // No data found, try to use user metadata
        console.log('No profile data found, using user metadata as fallback');
        if (user.user_metadata) {
          const userData = {
            full_name: user.user_metadata.full_name || user.user_metadata.name || "",
            bio: user.user_metadata.bio || "",
            social_media_tag: user.user_metadata.social_media_tag || "",
          };
          console.log('Setting form data from user metadata:', userData);
          
          // Reset the form with all values at once
          form.reset(userData);
          
          // Create profile if it doesn't exist
          try {
            await fetch('/api/profile/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...userData,
                userId: user.id,
                userEmail: user.email,
              }),
            });
            console.log('Created profile from metadata');
          } catch (err) {
            console.error('Failed to create profile from metadata:', err);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching profile data:', err);
      toast({
        title: "Error loading profile",
        description: err instanceof Error ? err.message : "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Remove the duplicate useEffect - we already have one above

  async function onSubmit(data: ProfileFormValues) {
    if (!user?.id || !user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in with a valid email to update your profile.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Use the server-side API endpoint to update the profile
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: data.full_name,
          bio: data.bio,
          social_media_tag: data.social_media_tag,
          userId: user.id,
          userEmail: user.email,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Refresh the form with the updated data
      form.reset({
        full_name: data.full_name,
        bio: data.bio,
        social_media_tag: data.social_media_tag,
      });
      
      // Fetch the updated profile data to ensure the form shows the latest data
      setTimeout(() => {
        fetchProfileData();
      }, 500); // Small delay to ensure the database has updated
    } catch (error) {
      console.error('Profile update failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {isLoading && (
          <div className="text-center p-4">
            <div className="animate-pulse">Loading profile data...</div>
          </div>
        )}
        <div className="text-sm text-muted-foreground mb-4">
          {user?.email && (
            <p>Email: {user.email}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (user?.id) {
                  console.log('Current form values:', form.getValues());
                  fetchProfileData();
                }
              }}
            >
              Refresh Profile Data
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                console.log('Debug - Current form state:', {
                  values: form.getValues(),
                  formState: form.formState
                });
              }}
            >
              Debug Form
            </Button>
          </div>
        </div>
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Brief description for your profile.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="social_media_tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Social Media</FormLabel>
              <FormControl>
                <Input placeholder="@yourusername" {...field} />
              </FormControl>
              <FormDescription>
                Your social media handle (e.g., Twitter, Instagram).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update profile"}
        </Button>
      </form>
    </Form>
  );
}
