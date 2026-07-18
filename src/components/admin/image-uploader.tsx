'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Uploads through app/api/upload/route.ts (admin-only, server-validated)
// rather than talking to Supabase Storage directly from the client — keeps
// the file-type/size check server-side even though RLS also gates the
// write (docs/06-api-architecture.md).
export function ImageUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message ?? 'Upload failed.');
        return;
      }
      onChange(body.url);
    } catch {
      setError('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="border-border/60 relative h-32 w-32 rounded-lg border p-2">
          <Image
            src={value}
            alt=""
            fill
            sizes="128px"
            className="rounded object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute -top-2 -right-2"
            onClick={() => onChange(null)}
            aria-label="Remove image"
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        <label className="border-border/60 hover:bg-muted/40 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed p-4 text-sm">
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImageIcon className="text-muted-foreground size-4" />
          )}
          <span className="text-muted-foreground">
            {uploading ? 'Uploading…' : 'Upload image'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
