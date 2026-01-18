"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { Category } from "@/lib/database"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onCategoryChange: (categorySlug: string | null) => void
  className?: string
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  className,
}: CategoryFilterProps) {
  // Group categories by level
  const level1Categories = categories.filter(c => c.level === 1)
  const level2Categories = categories.filter(c => c.level === 2)
  const level3Categories = categories.filter(c => c.level === 3)

  // Find selected category info
  const selectedCat = categories.find(c => c.slug === selectedCategory)
  const selectedLevel1 = selectedCat?.level === 1
    ? selectedCat
    : selectedCat?.level === 2
      ? level1Categories.find(c => c.id === selectedCat?.parent_id)
      : level2Categories.find(c => c.id === selectedCat?.parent_id)
        ? level1Categories.find(l1 => l1.id === level2Categories.find(l2 => l2.id === selectedCat?.parent_id)?.parent_id)
        : null

  const selectedLevel2 = selectedCat?.level === 2
    ? selectedCat
    : selectedCat?.level === 3
      ? level2Categories.find(c => c.id === selectedCat?.parent_id)
      : null

  // Get level 2 categories for selected sport
  const filteredLevel2 = selectedLevel1
    ? level2Categories.filter(c => c.parent_id === selectedLevel1.id)
    : []

  // Get level 3 categories for selected position
  const filteredLevel3 = selectedLevel2
    ? level3Categories.filter(c => c.parent_id === selectedLevel2.id)
    : []

  return (
    <div className={cn("space-y-3", className)}>
      {/* Level 1: 종목 (Sport Types) */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(null)}
          >
            전체
          </Button>
          {level1Categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedLevel1?.id === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(cat.slug)}
            >
              {cat.name_ko}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Level 2: 포지션 (Positions) */}
      {filteredLevel2.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            <Button
              variant={selectedLevel1 && !selectedLevel2 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onCategoryChange(selectedLevel1?.slug || null)}
            >
              전체 {selectedLevel1?.name_ko}
            </Button>
            {filteredLevel2.map(cat => (
              <Button
                key={cat.id}
                variant={selectedLevel2?.id === cat.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onCategoryChange(cat.slug)}
              >
                {cat.name_ko}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Level 3: 테크닉 (Techniques) */}
      {filteredLevel3.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            <Button
              variant={selectedLevel2 && selectedCat?.level !== 3 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onCategoryChange(selectedLevel2?.slug || null)}
            >
              전체 {selectedLevel2?.name_ko}
            </Button>
            {filteredLevel3.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onCategoryChange(cat.slug)}
              >
                {cat.name_ko}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}
