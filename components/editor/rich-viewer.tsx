"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { ResizableImage } from "@/lib/tiptap-image-extension"

interface RichViewerProps {
  content: string
  className?: string
}

export function RichViewer({ content, className }: RichViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      ResizableImage.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded",
        },
      }),
    ],
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none ${className || ""}`,
      },
    },
  })

  if (!editor) {
    return null
  }

  return <EditorContent editor={editor} />
}
