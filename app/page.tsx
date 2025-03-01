import { Hero } from "@/components/ui/animated-hero";
import { Features } from "@/components/ui/features";
import { EmailSignup } from "@/components/ui/email-signup";

export default function Home() {
  return (
    <div className="flex flex-col">
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
