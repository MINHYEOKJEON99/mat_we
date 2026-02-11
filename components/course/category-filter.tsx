"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Category } from "@/lib/database"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onCategoryChange: (slug: string | null) => void
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

  const handleLevel1Change = useCallback((value: string) => {
    onCategoryChange(value === "all" ? null : value)
  }, [onCategoryChange])

  const handleLevel2Change = useCallback((value: string) => {
    if (value === "all" && selectedLevel1) {
      onCategoryChange(selectedLevel1.slug)
    } else {
      onCategoryChange(value)
    }
  }, [onCategoryChange, selectedLevel1])

  const handleLevel3Change = useCallback((value: string) => {
    if (value === "all" && selectedLevel2) {
      onCategoryChange(selectedLevel2.slug)
    } else {
      onCategoryChange(value)
    }
  }, [onCategoryChange, selectedLevel2])

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Level 1: 종목 (Sport Types) */}
      <Select
        value={selectedLevel1?.slug || "all"}
        onValueChange={handleLevel1Change}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="종목 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 종목</SelectItem>
          {level1Categories.map(cat => (
            <SelectItem key={cat.id} value={cat.slug}>
              {cat.name_ko}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Level 2: 포지션 (Positions) */}
      {filteredLevel2.length > 0 && (
        <Select
          value={selectedLevel2?.slug || "all"}
          onValueChange={handleLevel2Change}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="포지션 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 포지션</SelectItem>
            {filteredLevel2.map(cat => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name_ko}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Level 3: 테크닉 (Techniques) */}
      {filteredLevel3.length > 0 && (
        <Select
          value={selectedCat?.level === 3 ? selectedCat.slug : "all"}
          onValueChange={handleLevel3Change}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="기술 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 기술</SelectItem>
            {filteredLevel3.map(cat => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name_ko}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
