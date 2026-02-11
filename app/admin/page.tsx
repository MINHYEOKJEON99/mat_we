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

  const supabase = await createClient();

  // Fetch instructor applications
  const { data: applications, error: applicationsError } = await supabase
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

  if (applicationsError) {
    console.error("Failed to fetch applications:", applicationsError);
  }

  // Fetch instructors list
  const { data: instructors, error: instructorsError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "instructor")
    .order("created_at", { ascending: false });

  if (instructorsError) {
    console.error("Failed to fetch instructors:", instructorsError);
  }

  return (
    <AdminDashboard
      applications={applications || []}
      instructors={instructors || []}
    />
  );
}
