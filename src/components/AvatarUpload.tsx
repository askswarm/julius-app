"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AvatarUploadProps {
  chatId: number;
  name: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
}

export default function AvatarUpload({ chatId, name, currentUrl, onUpload }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Max 2MB");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Nur JPG oder PNG");
      return;
    }

    // Preview sofort
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const path = `${chatId}.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now(); // Cache bust
      onUpload(url);
    }
    setUploading(false);
  }

  return (
    <div className="relative inline-block">
      <button onClick={() => inputRef.current?.click()} className="relative">
        {preview ? (
          <img src={preview} alt={name} className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg" />
        ) : (
          <div className="w-28 h-28 rounded-full bg-blue-500 flex items-center justify-center text-4xl font-bold text-white border-4 border-white dark:border-slate-800 shadow-lg">
            {name[0]}
          </div>
        )}
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
          <Camera size={14} className="text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFile} />
    </div>
  );
}
