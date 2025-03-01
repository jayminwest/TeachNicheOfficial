"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["community", "kendama", "players", "pros", "students"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full relative h-[600px]">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/303_group.png"
          alt="303 Group"
          fill
          className="w-full h-full object-cover filter grayscale opacity-20"
        />
      </div>
      {/* Construction Banner - Fixed position to stay visible */}
      <div className="bg-red-600 text-white py-4 px-6 text-center shadow-md fixed top-16 left-0 right-0 z-50" role="alert">
        <h2 className="font-bold text-xl">🚧 Site Under Construction 🚧</h2>
        <p className="text-base">We apologize for the inconvenience. Our site had difficulties launching and is currently under construction.</p>
        <p className="text-base mt-1">Core video lessons will be available soon. Expected to be fully operational by March 3.</p>
      </div>
      <div className="container mx-auto relative z-10 h-full">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-3xl sm:text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular px-4">
              <span className="text-spektr-cyan-50">Support</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center px-4">
              A community-driven platform helping kendama players share knowledge and make a living from their passion. 
              Join our waitlist to be part of this growing movement.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 px-4 w-full max-w-xs sm:max-w-none justify-center">
            <Link href="/about" className="w-full sm:w-auto">
              <Button size="default" className="gap-2 w-full sm:w-auto" variant="outline">
                Learn More <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button 
              size="default"
              className="gap-2 w-full sm:w-auto"
              onClick={() => {
                document.querySelector('#email-signup')?.scrollIntoView({ 
                  behavior: 'smooth'
                });
              }}
            >
              Join Teacher Waitlist <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
