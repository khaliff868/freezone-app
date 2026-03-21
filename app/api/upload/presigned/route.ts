import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lenF0ZXdydml5cXlmYWZpa2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM2Mjg2MSwiZXhwIjoyMDg4OTM4ODYxfQ.-wN_WFfvVXuxLsg1ThlIoKf81yiAhVlgD7mCioiALbY'
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[Upload] No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Allow images AND PDF (for payment proof)
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      console.error('[Upload] Invalid file type:', file.type);
      return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      console.error('[Upload] File too large:', file.size);
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop();
    const fileName = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log('[Upload] Uploading to Supabase:', fileName, 'size:', buffer.length);

    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (error) {
      console.error('[Upload] Supabase error:', error.message, JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
    console.log('[Upload] Success, publicUrl:', urlData.publicUrl);

    return NextResponse.json({ publicUrl: urlData.publicUrl });
  } catch (error: any) {
    console.error('[Upload] Unexpected error:', error?.message || error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
