import { getCurrentUser, getProfileById } from "@/lib/api/server"
import { HeaderClient } from "./header-client"
import type { Profile } from "@/lib/database"

export async function Header() {
  // Use centralized API functions
  const user = await getCurrentUser()

  let profile: Profile | null = null
  if (user) {
    profile = await getProfileById(user.id)
  }

  return <HeaderClient initialUser={user} initialProfile={profile} />
}
