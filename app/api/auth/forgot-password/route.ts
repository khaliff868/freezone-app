import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to user
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    await resend.emails.send({
      from: 'Freezone <noreply@yourdomain.com>',
      to: user.email,
      subject: 'Reset your Freezone password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #c0392b, #e67e22); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Freezone</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Trinidad & Tobago's Premier Marketplace</p>
          </div>
          <h2 style="color: #1a1a1a;">Reset Your Password</h2>
          <p style="color: #555; line-height: 1.6;">Hi ${user.name},</p>
          <p style="color: #555; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password. This link expires in <strong>1 hour</strong>.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #c0392b, #e67e22); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.6;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
          <p style="color: #888; font-size: 13px;">Or copy this link: <a href="${resetUrl}" style="color: #c0392b;">${resetUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">Freezone &mdash; Trinidad & Tobago 🇹🇹</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
