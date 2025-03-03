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
      
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: data.full_name,
          bio: data.bio,
          social_media_tag: data.social_media_tag,
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        throw new Error(error.message);
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
