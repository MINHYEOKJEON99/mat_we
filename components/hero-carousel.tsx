"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const slides = [
  {
    title: "주짓수의 기본을 마스터하세요",
    description: "전문 강사진의 체계적인 커리큘럼으로 주짓수의 기초부터 고급 기술까지",
    image: "/brazilian-jiu-jitsu-training-on-mat.jpg",
    cta: "강의 시작하기",
    href: "/courses",
  },
  {
    title: "1:1 맞춤 PT로 빠르게 성장하세요",
    description: "개인의 수준과 목표에 맞춘 전문 강사의 개인 트레이닝",
    image: "/personal-jiu-jitsu-training-session.jpg",
    cta: "PT 신청하기",
    href: "/instructors",
  },
  {
    title: "커뮤니티와 함께 성장하세요",
    description: "전국의 주짓수 애호가들과 경험을 공유하고 함께 발전하세요",
    image: "/jiu-jitsu-community-training-together.jpg",
    cta: "커뮤니티 참여",
    href: "/community",
  },
]

export function HeroCarousel() {
  const [current, setCurrent] = React.useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true)

  const next = React.useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [])

  const prev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }

  React.useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [isAutoPlaying, next])

  return (
    <div
      className="relative h-[600px] w-full overflow-hidden bg-black"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
          <img src={slide.image || "/placeholder.svg"} alt={slide.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="max-w-2xl space-y-6">
                <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight text-balance">{slide.title}</h1>
                <p className="text-xl md:text-2xl text-white/90 text-pretty">{slide.description}</p>
                <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
                  <Link href={slide.href}>{slide.cta}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
        onClick={prev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
        onClick={next}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${index === current ? "w-8 bg-white" : "w-2 bg-white/50"}`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  )
}
