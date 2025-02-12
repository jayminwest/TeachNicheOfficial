export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">About Teach Niche</h1>
        
        <div className="space-y-8">
          <section className="bg-muted rounded-lg p-8 my-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-lg leading-relaxed">
              The mission of Teach Niche is to create a space within the kendama community for players of all 
              skill levels to share knowledge, support one another, and hone their abilities. Teach Niche 
              places the community first and is dedicated to fostering growth, creating connections, and 
              promoting more financial sustainability for the kendama community.
            </p>
          </section>

          <section className="prose prose-lg max-w-none bg-card rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-lg leading-relaxed mb-4">
              Hello! I'm Jaymin West, the founder of Teach Niche. I've played kendama for over seven years, 
              and in that time, I've been fortunate enough to sesh with players from all over the world and 
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
                  <span className="text-primary mr-2">•</span>
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

          <section className="text-center bg-muted/50 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Join Our Community</h2>
            <p className="text-lg max-w-2xl mx-auto">
              Whether you're here to teach or learn, Teach Niche provides the tools and support
              you need to succeed. Join our growing community of educators and learners today.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
