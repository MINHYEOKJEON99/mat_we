import { createClient } from "@/lib/server"
import { HeaderClient } from "./header-client"
import type { Profile } from "@/lib/database"

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Profile>()
    profile = data
  }

  return <HeaderClient initialUser={user} initialProfile={profile} />
}
