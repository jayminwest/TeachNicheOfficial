import { Hero } from "@/components/ui/animated-hero";
import { Features } from "@/components/ui/features";
import { EmailSignup } from "@/components/ui/email-signup";

export default function Home() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center justify-center p-8">
        <Hero />
        <EmailSignup />
      </div>
      <Features />
    </div>
  );
}
