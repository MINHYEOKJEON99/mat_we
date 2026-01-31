"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function FeaturedInstructors() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const itemsPerView = 3;
  const maxIndex = instructors.length - itemsPerView;

  useEffect(() => {
    console.log("[Carousel] Component mounted, maxIndex:", maxIndex);
  }, [maxIndex]);

  const handlePrev = () => {
    console.log("[Carousel] Prev clicked, currentIndex:", currentIndex);
    setCurrentIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      console.log("[Carousel] New index after prev:", newIndex);
      return newIndex;
    });
  };

  const handleNext = () => {
    console.log("[Carousel] Next clicked, currentIndex:", currentIndex, "maxIndex:", maxIndex);
    setCurrentIndex((prev) => {
      const newIndex = Math.min(maxIndex, prev + 1);
      console.log("[Carousel] New index after next:", newIndex);
      return newIndex;
    });
  };

  return (
    <div className="w-full">
      <div className="flex-col flex items-end justify-between mb-2">
        <div className="flex justify-between w-full">
          <div>
            <h2 className="text-2xl md:text-3xl font-heading tracking-wide mb-2">INSTRUCTORS</h2>
            <p className="text-[13px] text-muted-foreground">검증된 전문 강사진을 만나보세요</p>
          </div>
          <Link
            href="/instructors"
            className="inline-flex my-auto items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
          >
            전체 강사 보기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex mt-4 items-center gap-2">
          <button
            type="button"
            className="h-8 w-8 rounded-full border border-gray-500 flex items-center justify-center cursor-pointer disabled:opacity-50"
            onClick={() => {
              console.log("[Carousel] Prev button clicked!");
              handlePrev();
            }}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-8 w-8 rounded-full border border-gray-500 flex items-center justify-center cursor-pointer disabled:opacity-50"
            onClick={() => {
              console.log("[Carousel] Next button clicked!");
              handleNext();
            }}
            disabled={currentIndex >= maxIndex}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={containerRef}>
        <div
          className="flex gap-6 transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView + 0.5)}%)`,
          }}
        >
          {instructors.map((instructor) => (
            <article key={instructor.id} className="group  flex-shrink-0" style={{ width: `calc((100% - 52px) / 3)` }}>
              {/* Image with overlay */}
              <div className="relative aspect-[3/4] rounded-[5px] w-full overflow-hidden bg-muted mb-4">
                <Image
                  src={instructor.image}
                  alt={instructor.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold">{instructor.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{instructor.description}</p>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Link
                    href={`/instructors/${instructor.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium hover:gap-2.5 transition-all"
                  >
                    수강하기
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/instructors/${instructor.id}?tab=pt`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:gap-2.5 transition-all"
                  >
                    PT신청
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
