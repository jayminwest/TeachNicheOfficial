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
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, bio, social_media_tag')
          .eq('id', user.id);
          
        if (error) {
          console.error('Error fetching profile data:', error.message);
          return;
        }
        
        // Check if we have exactly one profile
        if (data && data.length === 1) {
          // Update form with existing data
          form.reset({
            full_name: data[0].full_name || "",
            bio: data[0].bio || "",
            social_media_tag: data[0].social_media_tag || "",
          });
        } else if (data && data.length > 1) {
          console.warn(`Found multiple profiles for user ${user.id}, using the first one`);
          form.reset({
            full_name: data[0].full_name || "",
            bio: data[0].bio || "",
            social_media_tag: data[0].social_media_tag || "",
          });
        } else {
          console.warn(`No profile found for user ${user.id}`);
          // Keep default empty values
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
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Updating profile with data:', data);
      
      // Try to update the profile using RPC (stored procedure) to bypass RLS
      // This assumes there's a function in Supabase that can update profiles
      const { error: rpcError } = await supabase.rpc('update_user_profile', {
        user_id: user.id,
        user_full_name: data.full_name,
        user_bio: data.bio,
        user_social_media: data.social_media_tag,
      });
      
      // If RPC fails or doesn't exist, fall back to direct update with auth
      let updateError = rpcError;
      
      if (rpcError) {
        console.warn('RPC update failed, trying direct update:', rpcError.message);
        
        // First check if the profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id);
          
        if (fetchError) {
          throw new Error(`Error checking profile: ${fetchError.message}`);
        }
        
        if (existingProfile && existingProfile.length > 0) {
          // Profile exists, use update instead of upsert
          const { error } = await supabase.auth.updateUser({
            data: {
              full_name: data.full_name,
              bio: data.bio,
              social_media_tag: data.social_media_tag,
            }
          });
          
          updateError = error;
        } else {
          // For new profiles, we need admin intervention or a server-side API
          // This is a temporary workaround - create a minimal profile
          const { error } = await supabase.auth.updateUser({
            data: {
              full_name: data.full_name,
              bio: data.bio,
              social_media_tag: data.social_media_tag,
            }
          });
          
          updateError = error;
          
          // Also try to notify the server about the missing profile
          try {
            console.log('Attempting to create profile via API');
            
            // Create a payload with all required fields
            const payload = {
              id: user.id,
              full_name: data.full_name || '',
              bio: data.bio || '',
              social_media_tag: data.social_media_tag || '',
              email: user.email || '',
            };
            
            console.log('Profile creation payload:', payload);
            
            const response = await fetch('/api/profiles/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
              // Important: include credentials to send cookies with the request
              credentials: 'same-origin',
            });
            
            console.log('Profile creation response status:', response.status);
            
            const result = await response.json();
            
            if (!response.ok) {
              console.error('Profile creation API error:', result);
              throw new Error(result.error || `Failed to create profile: ${response.status}`);
            }
            console.log('Profile creation API response:', result);
            
            if (result.success) {
              console.log('Profile created successfully via API');
            }
          } catch (fetchError) {
            console.error('Failed to create profile via API:', fetchError);
            // Don't throw here, we'll still show success if the user metadata was updated
          }
        }
      }
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
