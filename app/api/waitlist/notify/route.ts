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
    
    // Generate a unique invite link and include it in the email data
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/signup?invite=${Buffer.from(email).toString('base64')}`;
    
    // Send the email
    const emailService = createEmailService();
    // Format the data for the email template, including the invite link
    const emailData = { name, inviteLink };
    const success = await emailService.sendWelcomeEmail(email, emailData);
    
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
