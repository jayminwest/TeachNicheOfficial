'use client';

import { useSearchParams } from 'next/navigation';

export default function LegalContent() {
  // We can use the search params here if needed
  const searchParams = useSearchParams();
  
  // You could use searchParams to highlight specific sections
  // const highlightSection = searchParams.get('section');
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold mb-6">Teach Niche Legal Information</h1>
      
      <section id="terms" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Terms of Service</h2>
        <div className="prose max-w-none">
          <h3 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h3>
          <p>By accessing or using the Teach Niche website (the &ldquo;Service&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use, the Privacy Policy, and the Cookie Policy (collectively, the &ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use the Service.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2. Amendments to the Terms</h3>
          <p>Teach Niche reserves the right to modify or update these Terms at any time without prior notice. Your continued use of the Service following any changes constitutes acceptance of the revised Terms. We recommend that you review these Terms periodically.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">3. Platform Purpose and User Representations</h3>
          <p>Teach Niche is an online marketplace where users can buy and sell video tutorials. You agree that you are solely responsible for verifying the quality, accuracy, and legality of the video tutorials offered on the platform. Neither Teach Niche nor any third party guarantees the suitability or reliability of any content provided by users.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4. User Categories and Responsibilities</h3>
          <h4 className="text-lg font-medium mt-4 mb-2">4.1 Sellers</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>Representations and Warranties: As a seller, you warrant that you own or have all necessary rights, licenses, and permissions to sell the video tutorials and any associated materials.</li>
            <li>Content Standards: Sellers are responsible for ensuring that all submitted content complies with applicable laws and these Terms.</li>
            <li>Fees and Transactions: All sales transactions are subject to Teach Niche&rsquo;s fee schedule and payment processing terms.</li>
          </ul>

          <h4 className="text-lg font-medium mt-4 mb-2">4.2 Buyers</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>Risk Acknowledgment: Buyers acknowledge that transactions are conducted at their own risk.</li>
            <li>Refunds and Dispute Resolution: All sales are subject to Teach Niche&rsquo;s Refund and Dispute Resolution Policy.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">5. Intellectual Property Rights</h3>
          <p>All content on this website is either owned by or licensed to Teach Niche. By uploading content, you grant Teach Niche a non-exclusive, worldwide, royalty-free license to use, reproduce, display, and distribute such content.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">6. Disclaimer of Warranties</h3>
          <p>The Service and all content are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without any warranties of any kind, either express or implied.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7. Payment Processing</h3>
          <p>All financial transactions are processed by third-party payment service providers. Your use of the Service is subject to their terms and conditions.</p>
        </div>
      </section>

      <section id="privacy" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
        <div className="prose max-w-none">
          <h3 className="text-xl font-semibold mt-6 mb-3">8. Data Privacy and Security</h3>
          <h4 className="text-lg font-medium mt-4 mb-2">8.1 Privacy Policy</h4>
          <p>We are committed to protecting your privacy. Our Privacy Policy explains how we collect, use, disclose, and safeguard your information.</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Information Collection: We collect personal data provided by you, such as name, email, password, and content.</li>
            <li>Data Use: Your information is used to operate and improve the Service and provide support.</li>
            <li>Sharing and Disclosure: We do not sell your personal information but may share it with service providers.</li>
          </ul>

          <h4 className="text-lg font-medium mt-4 mb-2">8.2 Security Measures</h4>
          <p>We implement reasonable security measures to protect your data, though no online method is completely secure.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">9. Cookie Policy</h3>
          <p>Teach Niche uses cookies to enhance your experience. By using our Service, you consent to our use of cookies as detailed in our Cookies Policy.</p>
        </div>
      </section>

      <section id="legal" className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Additional Legal Information</h2>
        <div className="prose max-w-none">
          <h3 className="text-xl font-semibold mt-6 mb-3">10. Governing Law and Dispute Resolution</h3>
          <p>These Terms are governed by the laws of the jurisdiction in which Teach Niche is headquartered. Disputes shall be resolved through binding arbitration.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">11. Indemnification</h3>
          <p>You agree to indemnify and hold harmless Teach Niche from claims arising from your use of the Service or violation of these Terms.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">12. Termination</h3>
          <p>Teach Niche reserves the right to suspend or terminate your access to the Service for violations of these Terms.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">13. Severability</h3>
          <p>If any provision of these Terms is invalid, the remaining provisions shall remain in effect.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">14. Contact Information</h3>
          <p>For questions about these Terms, contact us at: <a href="mailto:info@teach-niche.com" className="text-primary hover:underline">info@teach-niche.com</a></p>
        </div>
      </section>
    </div>
  );
}
