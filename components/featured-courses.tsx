import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Star } from "lucide-react"

const courses = [
  {
    id: 1,
    title: "주짓수 기초 완성 과정",
    instructor: "김태현",
    thumbnail: "/jiu-jitsu-basic-techniques-demonstration.jpg",
    price: "₩89,000",
    duration: "8주",
    students: 234,
    rating: 4.9,
    level: "초급",
  },
  {
    id: 2,
    title: "가드 패스 마스터클래스",
    instructor: "박준호",
    thumbnail: "/jiu-jitsu-guard-pass-techniques.jpg",
    price: "₩129,000",
    duration: "10주",
    students: 189,
    rating: 5.0,
    level: "중급",
  },
  {
    id: 3,
    title: "셀프 디펜스 실전 과정",
    instructor: "이서연",
    thumbnail: "/self-defense-jiu-jitsu-techniques.jpg",
    price: "₩99,000",
    duration: "6주",
    students: 312,
    rating: 4.8,
    level: "초급",
  },
]

export function FeaturedCourses() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">인기 강의</h2>
            <p className="text-xl text-muted-foreground">가장 많은 수강생이 선택한 강의를 만나보세요</p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex bg-transparent">
            <Link href="/courses">전체 강의 보기</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={course.thumbnail || "/placeholder.svg"}
                  alt={course.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors text-balance">
                    {course.title}
                  </h3>
                  <Badge variant="secondary">{course.level}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{course.instructor}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.students}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {course.rating}
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-2xl font-bold">{course.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Button asChild variant="outline" className="md:hidden w-full mt-8 bg-transparent">
          <Link href="/courses">전체 강의 보기</Link>
        </Button>
      </div>
    </section>
  )
}
