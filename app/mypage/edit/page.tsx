import { createClient } from "@/lib/server"
import { EditProfileForm } from "@/components/profile/edit-profile-form"
import type { Profile } from "@/lib/database"

export default async function EditProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">프로필을 찾을 수 없습니다</p>
      </div>
    )
  }

  return <EditProfileForm initialProfile={profile} />
}
