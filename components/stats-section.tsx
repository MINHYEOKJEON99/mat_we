export function StatsSection() {
  const stats = [
    { value: "5,000+", label: "활성 회원" },
    { value: "200+", label: "전문 강사" },
    { value: "1,000+", label: "강의 영상" },
    { value: "50,000+", label: "완료된 PT" },
  ]

  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</p>
              <p className="text-lg md:text-xl opacity-90">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
