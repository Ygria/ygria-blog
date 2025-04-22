import { AchievementDisplay } from "@/components/achievement-display";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 ">
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-white mb-8 mt-8">
        我的年度成就徽章收藏
      </h1>

      <div className="w-full max-w-6xl mx-auto">
        <AchievementDisplay className="mb-12" />
      </div>
    </main>
  );
}
