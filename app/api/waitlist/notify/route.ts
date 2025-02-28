import { NextResponse } from 'next/server';
import { createEmailService } from '@/app/services/email';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    // Generate a unique invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/signup?invite=${Buffer.from(email).toString('base64')}`;
    
    // Send the email
    const emailService = createEmailService();
    // Format the data for the email template
    // The email service expects only 2 arguments: email and name
    // Pass the name with the invite link for the welcome email template to use
    const success = await emailService.sendWelcomeEmail(email, `${name}|${inviteLink}`);
    
    if (!success) {
      throw new Error('Failed to send email');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending waitlist notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
