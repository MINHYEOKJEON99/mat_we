import { createClient } from "@/lib/server"
import { HeaderClient } from "./header-client"

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <HeaderClient initialUser={user} />
}
