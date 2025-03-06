"use client";

import Image from "next/image";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { Button } from "./button";

function Hero() {

  return (
    <div className="w-full relative h-[600px]" data-testid="hero-section">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/303_group.png"
          alt="303 Group"
          fill
          className="w-full h-full object-cover filter grayscale opacity-20"
        />
      </div>
      <div className="container mx-auto relative z-10 h-full">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-3xl sm:text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular px-4">
              <span className="text-spektr-cyan-50">Support</span>
              <span className="font-semibold"> kendama community</span>
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
