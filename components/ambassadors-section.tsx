import Link from "next/link"
import { Button } from "@/components/ui/button"

const ambassadors = [
  {
    name: "김태현",
    belt: "블랙벨트 3단",
    specialty: "스포츠 주짓수",
    image: "/korean-jiu-jitsu-black-belt-instructor-male.jpg",
    stats: "200+ 수강생 · 15년 경력",
  },
  {
    name: "이서연",
    belt: "블랙벨트 2단",
    specialty: "셀프 디펜스",
    image: "/korean-jiu-jitsu-black-belt-instructor-female.jpg",
    stats: "150+ 수강생 · 12년 경력",
  },
  {
    name: "박준호",
    belt: "블랙벨트 4단",
    specialty: "컴피티션 트레이닝",
    image: "/korean-jiu-jitsu-champion-male-instructor.jpg",
    stats: "300+ 수강생 · 20년 경력",
  },
]

export function AmbassadorsSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Mat We 앰버서더</h2>
            <p className="text-xl text-muted-foreground">최고의 전문가들과 함께 성장하세요</p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex bg-transparent">
            <Link href="/instructors">전체 강사 보기</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {ambassadors.map((ambassador, index) => (
            <Link
              key={index}
              href={`/instructors/${index + 1}`}
              className="group relative overflow-hidden rounded-xl bg-card border"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={ambassador.image || "/placeholder.svg"}
                  alt={ambassador.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="space-y-1 mb-2">
                  <h3 className="text-2xl font-bold">{ambassador.name}</h3>
                  <p className="text-sm text-white/80">{ambassador.belt}</p>
                </div>
                <p className="text-white/90 mb-2">{ambassador.specialty}</p>
                <p className="text-sm text-white/70">{ambassador.stats}</p>
              </div>
            </Link>
          ))}
        </div>

        <Button asChild variant="outline" className="md:hidden w-full mt-8 bg-transparent">
          <Link href="/instructors">전체 강사 보기</Link>
        </Button>
      </div>
    </section>
  )
}
