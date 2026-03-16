// Email utility with Resend support and console.log fallback

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@freezone.tt';

  // If Resend API key is not configured, log to console (development mode)
  if (!RESEND_API_KEY) {
    console.log('\n========================================');
    console.log('📧 EMAIL (Development Mode - No Resend API Key)');
    console.log('========================================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body:');
    console.log(html.replace(/<[^>]*>/g, ''));
    console.log('========================================\n');
    return { success: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Resend API error:', errorData);
      return { success: false, error: 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export function generatePasswordResetEmail(resetLink: string): { subject: string; html: string } {
  const subject = 'Reset Your Freezone Swap or Sell Password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #c41e3a; margin-bottom: 20px;">Reset Your Password</h2>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">You requested to reset your password.</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Click the link below to create a new password:</p>
      <p style="margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #c41e3a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
      </p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;">Or copy and paste this link into your browser:</p>
      <p style="color: #0066cc; font-size: 14px; word-break: break-all;">${resetLink}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #666; font-size: 14px; line-height: 1.5;">If you did not request this change, please ignore this email.</p>
      <p style="color: #666; font-size: 14px; line-height: 1.5;"><strong>This link expires in 1 hour.</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px;">Freezone Swap or Sell - Trinidad & Tobago's Premier Marketplace 🇹🇹</p>
    </div>
  `;
  return { subject, html };
}
