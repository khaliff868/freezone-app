import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Password reset feature not yet fully implemented
  return NextResponse.json(
    { message: 'Password reset feature coming soon. Please contact support.' },
    { status: 200 }
  );
}
