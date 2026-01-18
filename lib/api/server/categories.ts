import { createClient } from "@/lib/server"
import type { Category, CategoryLevel } from "@/lib/database"

export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[]
}

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("level", { ascending: true })
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[Categories] Error fetching categories:", error)
    return []
  }

  return data as Category[]
}

/**
 * Get categories by level (1=종목, 2=포지션, 3=테크닉)
 */
export async function getCategoriesByLevel(level: CategoryLevel): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("level", level)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[Categories] Error fetching categories by level:", error)
    return []
  }

  return data as Category[]
}

/**
 * Get child categories by parent ID
 */
export async function getCategoriesByParent(parentId: string): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("parent_id", parentId)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[Categories] Error fetching child categories:", error)
    return []
  }

  return data as Category[]
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("[Categories] Error fetching category by slug:", error)
    return null
  }

  return data as Category
}

/**
 * Get category hierarchy (nested structure)
 */
export async function getCategoryHierarchy(sportSlug?: string): Promise<CategoryWithChildren[]> {
  const allCategories = await getAllCategories()

  // Build hierarchy
  const buildHierarchy = (parentId: string | null, level: number): CategoryWithChildren[] => {
    return allCategories
      .filter(cat => cat.parent_id === parentId && cat.level === level)
      .map(cat => ({
        ...cat,
        children: buildHierarchy(cat.id, level + 1)
      }))
  }

  // If sport slug provided, filter to that sport's hierarchy
  if (sportSlug) {
    const sportCategory = allCategories.find(c => c.slug === sportSlug && c.level === 1)
    if (sportCategory) {
      return [{
        ...sportCategory,
        children: buildHierarchy(sportCategory.id, 2)
      }]
    }
    return []
  }

  return buildHierarchy(null, 1)
}

/**
 * Get categories for a course
 */
export async function getCategoriesByCourse(courseId: string): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("course_categories")
    .select(`
      category:categories (*)
    `)
    .eq("course_id", courseId)

  if (error) {
    console.error("[Categories] Error fetching course categories:", error)
    return []
  }

  if (!data) return []

  // Extract categories from the nested structure
  const categories: Category[] = []
  for (const item of data) {
    const category = (item as unknown as { category: Category | Category[] | null }).category
    if (category) {
      if (Array.isArray(category)) {
        categories.push(...category)
      } else {
        categories.push(category)
      }
    }
  }

  return categories
}
