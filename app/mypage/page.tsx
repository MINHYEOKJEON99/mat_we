import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, MessageSquare, ThumbsUp } from "lucide-react"
import type { CommunityPost } from "@/lib/database"
import { requireAuth, getPostsByAuthor, getProfileById } from "@/lib/api/server"
import { RichViewer } from "@/components/editor/rich-viewer"

export default async function MypagePage() {
  const user = await requireAuth()

  // 프로필 정보 가져오기
  const profile = await getProfileById(user.id)

  // 작성한 게시글 가져오기 (최근 5개)
  const allPosts = await getPostsByAuthor(user.id)
  const posts = allPosts.slice(0, 5)

  // 수강평 개수 (추후 구현 시 실제 데이터로 대체)
  const reviewCount = 0
  const averageRating = "-"

  const userInitial = profile?.display_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"
  const username = user.email?.split("@")[0] || "user"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 프로필 헤더 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || "프로필"} />
              <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl font-bold">{profile?.display_name || "사용자"}</h1>
                <span className="text-muted-foreground">@{username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {profile?.role === "instructor" ? "강사" : "수강생"}
                </Badge>
              </div>
            </div>

            <Button asChild variant="outline" className="shrink-0">
              <Link href="/mypage/edit">
                <Pencil className="h-4 w-4 mr-2" />
                프로필 수정
              </Link>
            </Button>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-muted-foreground">수강평 작성수</p>
              <p className="text-xl font-semibold">{reviewCount || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">평균평점</p>
              <p className="text-xl font-semibold">{averageRating}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 소개 섹션 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">소개</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/mypage/edit">작성하기</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {profile?.bio ? (
            <p className="text-sm text-foreground whitespace-pre-wrap">{profile.bio}</p>
          ) : (
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground">소개글이 비어있어요</p>
              <p className="text-sm text-muted-foreground">
                나만의 스킬, 깃허브 링크 등으로 소개글을 채워보세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 게시글 섹션 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">게시글</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/mypage/posts">전체보기</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: CommunityPost) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="block p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-medium truncate">{post.title}</h3>
                      <div className="text-sm text-muted-foreground line-clamp-2 [&_.ProseMirror]:p-0 [&_.ProseMirror]:min-h-0">
                        <RichViewer content={post.content} className="!prose-sm" />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(post.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.comments_count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">작성한 게시글이 없습니다</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/community/new">첫 게시글 작성하기</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
