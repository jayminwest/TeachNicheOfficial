import Image from "next/image";
import { Hero } from "@/components/ui/animated-hero";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Hero />
    </div>
  );
}
