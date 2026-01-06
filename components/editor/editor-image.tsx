"use client";

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useRef, useCallback } from "react";
import { X, MoveDownRight, Move3d } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditorImage({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const width = node.attrs.width || "100%";

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startX.current = e.clientX;
      startWidth.current = imageRef.current?.offsetWidth || 0;

      const handleMouseMove = (e: MouseEvent) => {
        const diff = e.clientX - startX.current;
        const newWidth = Math.max(100, startWidth.current + diff);
        updateAttributes({ width: `${newWidth}px` });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [updateAttributes]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm("이미지를 삭제하시겠습니까?")) {
        deleteNode();
      }
    },
    [deleteNode]
  );

  const setPresetSize = useCallback(
    (size: "small" | "medium" | "large" | "full") => {
      const sizes = {
        small: "200px",
        medium: "400px",
        large: "600px",
        full: "100%",
      };
      updateAttributes({ width: sizes[size] });
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper className="relative inline-block my-2">
      <div
        className={`relative inline-block ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isResizing && setShowControls(false)}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          style={{ width, maxWidth: "100%" }}
          className="rounded block"
          draggable={false}
        />

        {/* Controls Overlay */}
        {(showControls || selected) && (
          <>
            {/* Delete Button */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 shadow-lg"
              onClick={handleDelete}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Size Controls */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/90 rounded p-1 shadow-lg">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-medium"
                onClick={() => setPresetSize("small")}
              >
                S
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-medium"
                onClick={() => setPresetSize("medium")}
              >
                M
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-medium"
                onClick={() => setPresetSize("large")}
              >
                L
              </Button>
            </div>

            {/* Resize Handle - Bottom Right Corner */}
            <div
              className="absolute bottom-0 right-0 h-8 w-8 flex items-center justify-center cursor-se-resize bg-background/80 rounded-tl shadow-lg hover:bg-background"
              onMouseDown={handleMouseDown}
              title="드래그하여 크기 조절"
            >
              <MoveDownRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
