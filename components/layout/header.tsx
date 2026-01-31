import { headers } from "next/headers"
import { getCurrentUser, getProfileById } from "@/lib/api/server"
import { HeaderClient } from "./header-client"
import type { Profile } from "@/lib/database"

export async function Header() {
  // Check if current path is admin page
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || ""

  // Don't render header on admin pages
  if (pathname.startsWith("/admin")) {
    return null
  }

  // Use centralized API functions
  const user = await getCurrentUser()

  let profile: Profile | null = null
  if (user) {
    profile = await getProfileById(user.id)
  }

  return <HeaderClient initialUser={user} initialProfile={profile} />
}
