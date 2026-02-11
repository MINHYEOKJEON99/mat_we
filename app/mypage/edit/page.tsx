import { EditProfileForm } from "@/components/profile/edit-profile-form"
import { requireCurrentProfile } from "@/lib/api/server"

export default async function EditProfilePage() {
  const profile = await requireCurrentProfile()

  return <EditProfileForm initialProfile={profile} />
}
