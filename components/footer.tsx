import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12" role="contentinfo" aria-label="사이트 푸터">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Mat We</h2>
            <p className="text-sm text-muted-foreground">주짓수 강사와 수강생을 연결하는 프리미엄 플랫폼</p>
          </div>
          <nav className="space-y-4" aria-label="서비스 링크">
            <h3 className="text-sm font-semibold">서비스</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/courses" className="hover:text-primary transition-colors">
                  강의
                </Link>
              </li>
              <li>
                <Link href="/instructors" className="hover:text-primary transition-colors">
                  강사
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-primary transition-colors">
                  커뮤니티
                </Link>
              </li>
            </ul>
          </nav>
          <nav className="space-y-4" aria-label="회사 정보">
            <h3 className="text-sm font-semibold">회사</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  소개
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  문의
                </Link>
              </li>
            </ul>
          </nav>
          <nav className="space-y-4" aria-label="법적 고지">
            <h3 className="text-sm font-semibold">법적 고지</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  이용약관
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Mat We. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
