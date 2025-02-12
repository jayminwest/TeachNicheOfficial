"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([{ email, signed_up_at: new Date().toISOString() }]);

      if (error) throw error;

      setStatus("success");
      setMessage("Thanks for joining our waitlist! We'll keep you updated.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-12">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Joining..." : "Join Waitlist"}
          </Button>
        </div>
        {message && (
          <p className={`text-sm ${status === "error" ? "text-red-500" : "text-green-500"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
