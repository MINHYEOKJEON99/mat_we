import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { MypageSidebar, MypageMobileNav } from "@/components/profile/mypage-sidebar";

export default async function MypageLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <MypageSidebar />
      <div className="flex-1 flex flex-col">
        <MypageMobileNav />
        <main className="flex-1 p-4 md:p-8 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
