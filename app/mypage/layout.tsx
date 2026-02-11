import { MypageSidebar, MypageMobileNav } from "@/components/profile/mypage-sidebar";
import { requireAuth } from "@/lib/api/server";

export default async function MypageLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

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
