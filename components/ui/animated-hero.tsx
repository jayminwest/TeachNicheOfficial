"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number}>({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const launchDate = new Date('2025-03-01T00:00:00');
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ days, hours, minutes });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);
  const titles = useMemo(
    () => ["educators", "creators", "mentors", "experts", "teachers"],
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
    <div className="w-full relative">
      <div className="absolute inset-0 z-0 h-[600px] overflow-hidden">
        <div className="relative w-[1200px] h-full mx-auto">
          <img
            src="/303_group.png"
            alt="303 Group"
            className="w-full h-full object-cover filter grayscale opacity-20"
          />
        </div>
      </div>
      <div className="container mx-auto relative z-10">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-400 px-6 py-3 rounded-full font-medium text-sm shadow-lg flex items-center gap-2 border border-orange-200 dark:border-orange-900">
            <span className="text-orange-700 dark:text-orange-200">Launching in:</span>
            <span className="font-bold">{timeLeft.days}d</span>
            <span className="font-bold">{timeLeft.hours}h</span>
            <span className="font-bold">{timeLeft.minutes}m</span>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-spektr-cyan-50">Empower</span>
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

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              A revolutionary platform connecting passionate educators with eager learners. 
              Join our waitlist to be the first to know when we launch.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Link href="/about">
              <Button size="lg" className="gap-4" variant="outline">
                Learn More <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              className="gap-4"
              onClick={() => {
                document.querySelector('#email-signup')?.scrollIntoView({ 
                  behavior: 'smooth'
                });
              }}
            >
              Join Waitlist <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
