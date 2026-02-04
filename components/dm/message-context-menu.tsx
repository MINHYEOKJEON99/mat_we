"use client"

import { useEffect, useRef } from "react"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageContextMenuProps {
  isOpen: boolean
  x: number
  y: number
  isOwn: boolean
  onDelete: () => void
  onClose: () => void
}

export function MessageContextMenu({
  isOpen,
  x,
  y,
  isOwn,
  onDelete,
  onClose,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 메뉴 위치 조정 (화면 밖으로 나가지 않도록)
  useEffect(() => {
    if (!isOpen || !menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = x
    let adjustedY = y

    // 오른쪽 화면 밖으로 나가면 왼쪽으로
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 8
    }

    // 아래쪽 화면 밖으로 나가면 위쪽으로
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 8
    }

    menu.style.left = `${adjustedX}px`
    menu.style.top = `${adjustedY}px`
  }, [isOpen, x, y])

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // 본인 메시지만 삭제 가능
  if (!isOwn) {
    return null
  }

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[100] min-w-[120px] bg-background border rounded-lg shadow-lg overflow-hidden",
        "animate-in fade-in-0 zoom-in-95 duration-100"
      )}
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onDelete}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        <span>삭제</span>
      </button>
    </div>
  )
}
