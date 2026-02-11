import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // 모든 쿠키 삭제
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    const hostname = request.nextUrl.hostname;
    const domainParts = hostname.split('.');

    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      if (name) {
        // 기본 삭제
        response.cookies.set(name, '', {
          expires: new Date(0),
          path: '/',
          maxAge: 0,
        });

        // 도메인 지정 삭제
        response.cookies.set(name, '', {
          expires: new Date(0),
          path: '/',
          domain: hostname,
          maxAge: 0,
        });

        // 점 도메인으로 삭제
        response.cookies.set(name, '', {
          expires: new Date(0),
          path: '/',
          domain: `.${hostname}`,
          maxAge: 0,
        });

        // 상위 도메인에서도 삭제
        for (let i = 1; i < domainParts.length; i++) {
          const domain = '.' + domainParts.slice(i).join('.');
          response.cookies.set(name, '', {
            expires: new Date(0),
            path: '/',
            domain,
            maxAge: 0,
          });
        }
      }
    }
  }

  // 캐시 무효화 헤더
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
