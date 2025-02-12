export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">About Teach Niche</h1>
        
        <div className="space-y-8">
          <section className="prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed mb-6">
              Teach Niche is a revolutionary platform designed to empower educators and subject matter experts
              to share their knowledge and monetize their expertise. We believe that everyone has unique insights
              worth sharing, and we're here to make that process seamless and rewarding.
            </p>
          </section>

          <section className="bg-muted rounded-lg p-8 my-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-lg leading-relaxed">
              To create a thriving ecosystem where passionate educators can connect with eager learners,
              fostering a community of continuous learning and growth while providing sustainable income
              opportunities for teachers.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8 my-8">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-3">For Educators</h3>
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
              <h3 className="text-xl font-semibold mb-3">For Learners</h3>
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
