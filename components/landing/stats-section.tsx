export function StatsSection() {
  const stats = [
    { id: "active-members", value: "5,000+", label: "활성 회원" },
    { id: "instructors", value: "200+", label: "전문 강사" },
    { id: "videos", value: "1,000+", label: "강의 영상" },
    { id: "completed-pt", value: "50,000+", label: "완료된 PT" },
  ]

  return (
    <section className="py-24 bg-primary text-primary-foreground" aria-label="Mat We 통계">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12" role="list">
          {stats.map((stat) => (
            <div key={stat.id} className="text-center" role="listitem">
              <p className="text-4xl md:text-5xl font-bold mb-2" aria-label={`${stat.label}: ${stat.value}`}>
                {stat.value}
              </p>
              <p className="text-lg md:text-xl opacity-90">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
