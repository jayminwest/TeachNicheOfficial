"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { motion } from "framer-motion";
import { collection, addDoc, getFirestore as getFirestoreSDK } from "firebase/firestore";
import { getApp } from "firebase/app";

// Get Firestore instance directly from the SDK to ensure it's not null
const firestore = getFirestoreSDK(getApp());

export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // Add email to Firebase waitlist collection
      if (firestore) {
        await addDoc(collection(firestore, "waitlist"), {
          email,
          signed_up_at: new Date().toISOString()
        });
      } else {
        throw new Error("Firestore is not available");
      }

      setStatus("success");
      setMessage("Thanks for joining our waitlist! We'll keep you updated.");
      setEmail("");
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div id="email-signup" className="w-full max-w-2xl mx-auto py-8 sm:py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 px-2">Join Our Teacher Waitlist</h2>
        <p className="text-muted-foreground text-base sm:text-lg px-2">
          Be one of our first teachers and start sharing your kendama expertise:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-left max-w-xl mx-auto px-4">
          {[
            "Keep 85% of your lesson revenue",
            "Flexible teaching schedule",
            "Get paid to share your passion",
            "Access to growing student base",
          ].map((benefit) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{benefit}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs sm:max-w-none mx-auto justify-center">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
          <Button 
            type="submit" 
            disabled={status === "loading"}
            className="w-full sm:w-auto"
            size="default"
          >
            {status === "loading" ? "Joining..." : "Join Teacher Waitlist"}
          </Button>
        </div>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm text-center ${
              status === "error" ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </motion.p>
        )}
      </motion.form>
    </div>
  );
}
