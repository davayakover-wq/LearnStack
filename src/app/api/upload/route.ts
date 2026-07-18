import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, isCurrentUserAdmin } from '@/lib/data/profile';
import { uploadImageSchema } from '@/lib/validations/admin';

// Admin-only image upload, proxied through the server so file-type/size are
// validated before Supabase Storage ever sees the bytes (docs/06-api-
// architecture.md's Route Handlers inventory). The actual write is still
// RLS-gated at the DB layer (lesson_media_write_admin_only checks
// is_admin()) — this validation is defense in depth, not the only guard.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      { status: 401 },
    );
  }
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json(
      { error: { code: 'forbidden', message: 'Admin access required.' } },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'No file provided.' } },
      { status: 400 },
    );
  }

  const parsed = uploadImageSchema.safeParse({
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'invalid_input',
          message: parsed.error.issues[0]?.message ?? 'Invalid file.',
        },
      },
      { status: 400 },
    );
  }

  const extension = parsed.data.fileName.split('.').pop() ?? 'bin';
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from('lesson-media')
    .upload(path, file, { contentType: parsed.data.contentType, upsert: false });
  if (uploadError) {
    return NextResponse.json(
      { error: { code: 'upload_failed', message: uploadError.message } },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('lesson-media').getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
