import { NextResponse } from 'next/server';

export async function GET() {
  // This would normally fetch from a database or CMS
  const legalContent = `
    <h1 class="text-3xl font-bold mb-6">Teach Niche Legal Information</h1>
    
    <section id="terms" class="mb-12">
      <h2 class="text-2xl font-semibold mb-4">Terms of Service</h2>
      <div class="prose max-w-none">
        <h3 class="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h3>
        <p>By accessing or using the Teach Niche website (the "Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
        
        <h3 class="text-xl font-semibold mt-6 mb-3">2. Description of Service</h3>
        <p>Teach Niche provides a platform for kendama enthusiasts to connect with instructors and access educational content related to kendama skills and techniques.</p>
        
        <h3 class="text-xl font-semibold mt-6 mb-3">3. User Accounts</h3>
        <p>To access certain features of the Service, you may be required to register for an account. You are responsible for maintaining the confidentiality of your account information.</p>
      </div>
    </section>
    
    <section id="privacy" class="mb-12">
      <h2 class="text-2xl font-semibold mb-4">Privacy Policy</h2>
      <div class="prose max-w-none">
        <p>This Privacy Policy describes how we collect, use, and share information when you use our Service.</p>
        
        <h3 class="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h3>
        <p>We collect information you provide directly to us when you create an account, subscribe to our service, or communicate with us.</p>
        
        <h3 class="text-xl font-semibold mt-6 mb-3">2. How We Use Information</h3>
        <p>We use the information we collect to provide, maintain, and improve our Service, and to communicate with you.</p>
      </div>
    </section>
  `;
  
  return new NextResponse(legalContent, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
import { NextResponse } from 'next/server';

export async function GET() {
  // This would normally fetch from a database or CMS
  const legalContent = `
    <h1 class="text-3xl font-bold mb-6">Teach Niche Legal Information</h1>
    
    <section id="terms" class="mb-12">
      <h2 class="text-2xl font-semibold mb-4">Terms of Service</h2>
      <div class="prose max-w-none">
        <h3 class="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h3>
        <p>By accessing or using the Teach Niche website (the "Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
        
        <h3 class="text-xl font-semibold mt-6 mb-3">2. Description of Service</h3>
        <p>Teach Niche provides a platform for kendama enthusiasts to connect with instructors and access educational content related to kendama skills and techniques.</p>
        
        <h3 class="text-xl font-semibold mt-6 mb-3">3. User Accounts</h3>
        <p>To access certain features of the Service, you may be required to register for an account. You are responsible for maintaining the confidentiality of your account information.</p>
      </div>
    </section>
    
    <section id="privacy" class="mb-12">
      <h2 class="text-2xl font-semibold mb-4">Privacy Policy</h2>
      <div class="prose max-w-none">
        <p>This Privacy Policy describes how we collect, use, and share information when you use our Service.</p>
        
        <h3 class="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h3>
        <p>We collect information you provide directly to us when you create an account, subscribe to our service, or communicate with us.</p>
        
        <h3 class="text-xl font-semibold mt-6 mb-3">2. How We Use Information</h3>
        <p>We use the information we collect to provide, maintain, and improve our Service, and to communicate with you.</p>
      </div>
    </section>
  `;
  
  return new NextResponse(legalContent, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
