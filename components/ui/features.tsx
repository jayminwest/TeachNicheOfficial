import { BookOpen, DollarSign, Users, Shield, Leaf, GraduationCap } from "lucide-react";

const features = [
  {
    title: "Expert Tutorials",
    description: "Access comprehensive tutorials from top kendama players and learn at your own pace",
    icon: BookOpen,
  },
  {
    title: "Monetize Your Skills",
    description: "Create and sell your own kendama lessons while setting your own prices",
    icon: DollarSign,
  },
  {
    title: "Community Support",
    description: "Join a thriving community of kendama enthusiasts - collaborate and grow together",
    icon: Users,
  },
  {
    title: "Integrity and Fairness",
    description: "Community-first platform ensuring creators are rewarded fairly",
    icon: Shield,
  },
  {
    title: "Sustainable Growth",
    description: "Building a long-term ecosystem for kendama education and innovation",
    icon: Leaf,
  },
  {
    title: "Growth and Learning",
    description: "Resources for skill development and tools to support your favorite players",
    icon: GraduationCap,
  },
];

export function Features() {
  return (
    <div className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Teach Niche?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
