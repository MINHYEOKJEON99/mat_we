import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// 더미 강사 데이터
const instructors = [
  {
    id: "instructor-1",
    name: "김태현",
    title: "주짓수 블랙벨트",
    description: "10년 경력의 IBJJF 국제 심판. 체계적인 커리큘럼으로 초보자도 쉽게 배울 수 있습니다.",
    image: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=600&h=800&fit=crop",
    specialty: "가드 플레이",
  },
  {
    id: "instructor-2",
    name: "박준호",
    title: "레슬링 국가대표 출신",
    description: "아시안게임 메달리스트. 실전에서 바로 적용할 수 있는 테이크다운 기술을 전수합니다.",
    image: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=600&h=800&fit=crop",
    specialty: "테이크다운",
  },
  {
    id: "instructor-3",
    name: "이서연",
    title: "유도 4단",
    description: "전 국가대표 코치. 기본기부터 실전 응용까지 단계별 맞춤 지도를 제공합니다.",
    image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&h=800&fit=crop",
    specialty: "던지기 기술",
  },
  {
    id: "instructor-4",
    name: "최민수",
    title: "삼보 마스터",
    description: "러시아 유학파 삼보 전문가. 레그락과 서브미션의 정수를 경험하세요.",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=800&fit=crop",
    specialty: "레그락",
  },
  {
    id: "instructor-5",
    name: "정하나",
    title: "노기 주짓수 챔피언",
    description: "ADCC 아시아 챔피언. 노기 그래플링의 현대적 기술을 가르칩니다.",
    image: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=600&h=800&fit=crop",
    specialty: "노기 그래플링",
  },
  {
    id: "instructor-6",
    name: "강동훈",
    title: "MMA 파이터",
    description: "UFC 출전 경력. 종합격투기에 필요한 그라운드 기술을 종합적으로 지도합니다.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    specialty: "MMA 그래플링",
  },
];

export default function InstructorsPage() {
  return (
    <main className="flex flex-col items-center min-h-screen">
      <div className="w-full max-w-[1024px] px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-heading tracking-wide mb-3">INSTRUCTORS</h1>
          <p className="text-muted-foreground">
            검증된 전문 강사진을 만나보세요
          </p>
        </div>

        {/* Instructors Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {instructors.map((instructor) => (
            <article key={instructor.id} className="group">
              {/* Image */}
              <div className="relative aspect-[3/4] rounded-[5px] w-full overflow-hidden bg-muted mb-4">
                <Image
                  src={instructor.image}
                  alt={instructor.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-white/90 text-black mb-2">
                    {instructor.specialty}
                  </span>
                  <h3 className="text-lg font-bold text-white">{instructor.title}</h3>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h4 className="text-lg font-bold">{instructor.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {instructor.description}
                </p>

                {/* Links */}
                <div className="flex gap-4 pt-2">
                  <Link
                    href={`/instructors/${instructor.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium hover:gap-2.5 transition-all"
                  >
                    프로필 보기
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
