import { Lightbulb, Users, Trophy, Sparkles } from "lucide-react";

const features = [
  {
    title: "Expert-Led Education",
    description: "Learn from verified industry experts and experienced educators",
    icon: Trophy,
  },
  {
    title: "Community-Driven",
    description: "Join a vibrant community of learners and educators",
    icon: Users,
  },
  {
    title: "Quality Content",
    description: "Access carefully curated and vetted educational content",
    icon: Lightbulb,
  },
  {
    title: "Innovative Platform",
    description: "Experience learning through our cutting-edge platform",
    icon: Sparkles,
  },
];

export function Features() {
  return (
    <div className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Teach Niche?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center p-6">
              <feature.icon className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
