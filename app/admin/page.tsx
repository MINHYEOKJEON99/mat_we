import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  // Check admin session
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  if (!adminSession || adminSession.value !== "authenticated") {
    redirect("/admin/login");
  }

  // Fetch instructor applications
  const supabase = await createClient();
  const { data: applications, error } = await supabase
    .from("instructor_applications")
    .select(`
      *,
      user:profiles!instructor_applications_user_id_fkey(
        id,
        display_name,
        email,
        avatar_url,
        role
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch applications:", error);
  }

  return <AdminDashboard applications={applications || []} />;
}
