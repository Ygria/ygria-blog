import { ParallelTimelines } from "@/components/parallel-timelines"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">多维时间轴</h1>
      <p className="text-center text-muted-foreground mb-10">
        三条并列的时间轴展示世界大事、身边的事和自己的事，水平距离表示影响程度
      </p>
      <ParallelTimelines />
    </main>
  )
}
