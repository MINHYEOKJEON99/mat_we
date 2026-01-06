import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EditorImage } from "@/components/editor-image";

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.getAttribute("width") || element.style.width || "100%",
        renderHTML: (attributes) => {
          return {
            width: attributes.width,
            style: `width: ${attributes.width}`,
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditorImage);
  },

  addKeyboardShortcuts() {
    return {
      // Prevent backspace from deleting the image when selected
      Backspace: () => {
        const { selection } = this.editor.state;
        const node = selection.$anchor.parent;

        // If we're in an image node, don't delete on backspace
        if (node.type.name === "image" || selection.$anchor.nodeAfter?.type.name === "image") {
          return true; // Prevent default behavior
        }

        return false; // Allow default behavior
      },
    };
  },
});
