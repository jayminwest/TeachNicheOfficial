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
  
  // Fetch existing profile data when component mounts
  useEffect(() => {
    async function fetchProfileData() {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // First try to get data from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, bio, social_media_tag')
          .eq('id', user.id)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            // No profile found, try to use data from user metadata
            console.log('No profile found, using user metadata');
            if (user.user_metadata) {
              form.reset({
                full_name: user.user_metadata.full_name || user.user_metadata.name || "",
                bio: user.user_metadata.bio || "",
                social_media_tag: user.user_metadata.social_media_tag || "",
              });
            }
          } else {
            console.error('Error fetching profile data:', error.message);
          }
          return;
        }
        
        // Profile found, update form
        if (data) {
          console.log('Profile data loaded:', data);
          form.reset({
            full_name: data.full_name || "",
            bio: data.bio || "",
            social_media_tag: data.social_media_tag || "",
          });
        }
      } catch (err) {
        console.error('Unexpected error fetching profile data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProfileData();
  }, [user, form]);

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
  )
}
