import { Hero } from "@/components/ui/animated-hero";
import { Features } from "@/components/ui/features";
import { EmailSignup } from "@/components/ui/email-signup";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Construction Banner */}
      <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4" role="alert">
        <p className="font-bold">Site Under Construction</p>
        <p>We apologize for the inconvenience. Our site had difficulties launching and is currently under construction. Thank you for your patience.</p>
      </div>
      
      <div className="flex flex-col items-center justify-center p-8">
        <Hero />
      </div>
      <Features />
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-16">
        <EmailSignup />
      </div>
      
    </div>
  );
}
