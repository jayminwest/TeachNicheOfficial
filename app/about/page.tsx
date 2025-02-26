import Image from "next/image"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion"

export default function AboutPage() {
  return (
    <div>
      <div className="relative h-[400px] w-full mb-16">
        <div className="absolute inset-0">
          <Image
            src="/303_group.png"
            alt="303 Kendama Group"
            fill
            className="object-cover filter grayscale pointer-events-none"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">About Teach Niche</h1>
        
        <div className="space-y-8">
          <section className="bg-muted rounded-lg p-8 my-8 border-l-4 border-orange-500">
            <h2 className="text-2xl font-semibold mb-4 text-orange-500">Our Mission</h2>
            <p className="text-lg leading-relaxed">
              The mission of Teach Niche is to create a space within the kendama community for players of all 
              skill levels to share knowledge, support one another, and hone their abilities. Teach Niche 
              places the community first and is dedicated to fostering growth, creating connections, and 
              promoting more financial sustainability for the kendama community.
            </p>
          </section>

          <section className="prose prose-lg max-w-none bg-card rounded-lg p-8 border-r-4 border-orange-500">
            <h2 className="text-2xl font-semibold mb-4 text-orange-500">Our Story</h2>
            <p className="text-lg leading-relaxed mb-4">
              Hello! I&apos;m Jaymin West, the founder of Teach Niche. I&apos;ve played kendama for over seven years, 
              and in that time, I&apos;ve been fortunate enough to sesh with players from all over the world and 
              have tried to form Teach Niche to fit the values of the kendama community as a whole.
            </p>
            <p className="text-lg leading-relaxed">
              Teach Niche was born from a simple idea: to help kendama players make a living from what they love.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8 my-8">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-3">For Kendama Players</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  Create and sell custom courses
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Build your teaching brand
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Connect with motivated students
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-3">For Students</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Access quality educational content
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Learn at your own pace
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Connect with expert educators
                </li>
              </ul>
            </div>
          </div>

          <section className="my-12">
            <h2 className="text-2xl font-semibold mb-6">Learn More About Teach Niche</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="values">
                <AccordionTrigger>Values</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div>
                      <h4 className="font-semibold mb-1">Community Collaboration</h4>
                      <p>Teach Niche fosters a space where kendama players of all levels can connect, share, and grow together.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Growth and Learning</h4>
                      <p>The platform is committed to continuous improvement, both in skills and as a community resource.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Integrity and Fairness</h4>
                      <p>Teach Niche operates with transparency and ensures equitable opportunities for all community members.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Sustainability</h4>
                      <p>The platform supports long-term growth for kendama enthusiasts and professionals alike.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="why">
                <AccordionTrigger>Why Teach Niche?</AccordionTrigger>
                <AccordionContent>
                  <div className="grid sm:grid-cols-2 gap-6 pt-2">
                    <div>
                      <h4 className="font-semibold mb-1">💪 Empowerment</h4>
                      <p>Teach Niche believes that top players should have the opportunity to benefit financially from their skills and knowledge.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">🎓 Education</h4>
                      <p>The platform offers a diverse range of tutorials, from mastering specific tricks to improving competition performance and developing consistency.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">🌱 Community Growth</h4>
                      <p>By supporting each other, Teach Niche aims to elevate the entire kendama community, breaking the notion that kendama is &apos;just a hobby.&apos;</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">🤝 Community-Driven Development</h4>
                      <p>Teach Niche is built to grow and evolve according to the needs and feedback of the community.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="commission">
                <AccordionTrigger>Commission Structure</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <p>Teach Niche is committed to transparency and fairness in its operations. To sustain the platform and continue providing value to the community, Teach Niche charges a 15% commission on each transaction.</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><span className="font-semibold">Fairness to Creators:</span> Creators retain 85% of their earnings from each sale.</li>
                      <li><span className="font-semibold">Platform Sustainability:</span> The commission helps cover operational costs like hosting, development, and customer support, ensuring the platform remains available and continuously improving.</li>
                      <li><span className="font-semibold">Community Investment:</span> By supporting the platform, users contribute to a sustainable ecosystem that benefits all members of the kendama community.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>


              <AccordionItem value="growth">
                <AccordionTrigger>Built to Grow with the Community</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <p>The best way to serve the kendama community is by listening and adapting to its needs.</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><span className="font-semibold">Community Feedback:</span> Teach Niche actively seeks input from users to guide platform enhancements. User suggestions shape the future of Teach Niche.</li>
                      <li><span className="font-semibold">Feature Requests:</span> Ideas for new features or improvements are welcome. Teach Niche is eager to implement changes that benefit everyone.</li>
                      <li><span className="font-semibold">Continuous Improvement:</span> The development roadmap is flexible, allowing prioritization of updates that matter most to the community.</li>
                    </ul>
                    <p>By keeping the platform intentionally adaptable, Teach Niche ensures that it evolves in step with the community it serves.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section className="text-center bg-gradient-to-r from-orange-500/10 to-muted/50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-orange-500">Join Our Community</h2>
            <p className="text-lg max-w-2xl mx-auto">
              Whether you&rsquo;re here to teach or learn, Teach Niche provides the tools and support
              you need to succeed. Join our growing community of educators and learners today.
            </p>
          </section>
        </div>
      </div>
    </div>
    </div>
  );
}
