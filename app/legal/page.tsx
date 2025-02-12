export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Legal Information</h1>
      
      <section id="terms" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Terms of Service</h2>
        <div className="prose max-w-none">
          <p>Terms of service content goes here...</p>
        </div>
      </section>

      <section id="privacy" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
        <div className="prose max-w-none">
          <p>Privacy policy content goes here...</p>
        </div>
      </section>

      <section id="legal" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Additional Legal Information</h2>
        <div className="prose max-w-none">
          <p>Additional legal information goes here...</p>
        </div>
      </section>
    </div>
  );
}
