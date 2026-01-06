"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  ImageIcon,
  Video,
  Loader2,
} from "lucide-react";
import { uploadImage, uploadVideo, isImageFile, isVideoFile } from "@/lib/upload";
import { ResizableImage } from "@/lib/tiptap-image-extension";

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  userId: string;
  placeholder?: string;
}

export function RichEditor({ content, onChange, userId, placeholder = "내용을 입력하세요..." }: RichEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      ResizableImage.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
  });

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      if (!isImageFile(file)) {
        setUploadError("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      const result = await uploadImage(file, userId);

      if ("message" in result) {
        setUploadError(result.message);
      } else {
        editor.chain().focus().setImage({ src: result.url }).run();
      }

      setIsUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    },
    [editor, userId]
  );

  const handleVideoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      if (!isVideoFile(file)) {
        setUploadError("영상 파일만 업로드할 수 있습니다.");
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      const result = await uploadVideo(file, userId);

      if ("message" in result) {
        setUploadError(result.message);
      } else {
        // Insert video as HTML
        editor
          .chain()
          .focus()
          .insertContent(
            `<video controls class="max-w-full h-auto rounded my-4" src="${result.url}"></video>`
          )
          .run();
      }

      setIsUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    },
    [editor, userId]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("bold") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("italic") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("underline") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("strike") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("bulletList") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${editor.isActive("orderedList") ? "bg-accent" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          이미지
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => videoInputRef.current?.click()}
          disabled={isUploading}
        >
          <Video className="h-4 w-4 mr-1" />
          동영상
        </Button>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={handleVideoUpload}
        />

        {isUploading && (
          <div className="flex items-center gap-2 ml-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            업로드 중...
          </div>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Upload Error */}
      {uploadError && (
        <div className="px-4 py-2 text-sm text-red-500 border-t bg-red-50">
          {uploadError}
        </div>
      )}

      {/* Help Text */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/20">
        이미지: 최대 5MB (자동 최적화) | 동영상: 최대 30MB, 60초 이내
      </div>
    </div>
  );
}
