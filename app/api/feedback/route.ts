import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import type { FeedbackSubmission } from '@/types/feedback';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body: FeedbackSubmission = await request.json();
    const { message, email, userPrefs } = body;

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build email content with auto-captured context
    const emailText = `
📝 New Feedback from HockeyGoTime

Message:
${message}

---
User Details:
${email ? `Email: ${email}` : 'Email: Not provided'}
${userPrefs?.team ? `Team: ${userPrefs.team}` : ''}
${userPrefs?.division ? `Division: ${userPrefs.division}` : ''}
${userPrefs?.mcpServer ? `League: ${userPrefs.mcpServer.toUpperCase()}` : ''}

Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
    `.trim();

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'HockeyGoTime Feedback <onboarding@resend.dev>', // Use your verified domain in production
      to: process.env.FEEDBACK_EMAIL!,
      subject: '🐛 HockeyGoTime User Feedback',
      text: emailText,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('Feedback email sent:', data?.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
