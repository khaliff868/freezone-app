import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://freezone-app-alpha.vercel.app';
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

    await resend.emails.send({
      from: 'Freezone <noreply@mail.freezonett.com>',
      to: user.email,
      subject: 'Reset your Freezone password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#c0392b,#e67e22);padding:30px;border-radius:12px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;margin:0;font-size:28px;">Freezone</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Trinidad and Tobago's Premier Marketplace</p>
          </div>
          <h2 style="color:#1a1a1a;">Reset Your Password</h2>
          <p style="color:#555;line-height:1.6;">Hi ${user.name ?? 'there'},</p>
          <p style="color:#555;line-height:1.6;">We received a request to reset your password. Click the button below to set a new one. This link expires in <strong>1 hour</strong>.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetLink}" style="background:linear-gradient(135deg,#c0392b,#e67e22);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color:#888;font-size:13px;line-height:1.6;">Or copy and paste this link into your browser:<br/><a href="${resetLink}" style="color:#c0392b;word-break:break-all;">${resetLink}</a></p>
          <p style="color:#888;font-size:13px;">If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
          <p style="color:#aaa;font-size:12px;text-align:center;">Freezone - Trinidad and Tobago</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
