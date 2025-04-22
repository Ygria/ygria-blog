"use client"

import { useState } from "react"
import { AchievementBadge } from "./achievement-badge"
import { cn } from "@/lib/utils"

interface AchievementDisplayProps {
  className?: string
}

export function AchievementDisplay({ className }: AchievementDisplayProps) {
  const [activeYear, setActiveYear] = useState<"2024" | "2025" | null>(null)

  // 2024 achievements
  const achievements2024 = [
    {
      category: "music" as const,
      name: "银河快递 Livehouse",
      description: "参加了银河快递Livehouse音乐现场",
      date: "2024",
      icon: "🎸",
      completed: true
    },
    {
      category: "music" as const,
      name: "凤凰传奇演唱会",
      description: "观看了凤凰传奇的现场演唱会",
      date: "2024",
      icon: "🎤",
      completed: true
    },
    {
      category: "music" as const,
      name: "告五人演唱会",
      description: "参加了告五人的现场演唱会",
      date: "2024",
      icon: "🎵",
      completed: true
    },
    {
      category: "culture" as const,
      name: "牡丹亭昆曲",
      description: "观看了牡丹亭昆曲演出",
      date: "2024",
      icon: "🏮",
      completed: true
    },
    {
      category: "hobby" as const,
      name: "小丑牌",
      description: "金注通关",
      date: "2024",
      icon: "🤡",
      completed: true
    },
    {
      category: "hobby" as const,
      name: "钓鱼成功",
      description: "成功钓上来鱼",
      date: "2024",
      icon: "🎣",
      completed: true
    },
    {
      category: "learning" as const,
      name: "硬笔书法",
      description: "进行了大约100天的硬笔书法练习",
      date: "2024",
      icon: "✒️",
      completed: true
    },
    {
      category: "learning" as const,
      name: "烹饪技能",
      description: "学习了烹饪技能",
      date: "2024",
      icon: "🍳",
      completed: true
    },
    {
      category: "tech" as const,
      name: "React学习",
      description: "学习了React框架",
      date: "2024",
      icon: "⚛️",
      completed: true
    },
  ]

  // 2025 future achievements (placeholders)
  const achievements2025 = [
    {
      category: "future" as const,
      name: "未来成就",
      description: "2025年的成就将在这里展示",
      date: "2025",
      icon: "🔮",
      completed: false,
    },
    {
      category: "future" as const,
      name: "未来成就",
      description: "2025年的成就将在这里展示",
      date: "2025",
      icon: "🔮",
      completed: false,
    },
    {
      category: "future" as const,
      name: "未来成就",
      description: "2025年的成就将在这里展示",
      date: "2025",
      icon: "🔮",
      completed: false,
    },
    {
      category: "future" as const,
      name: "未来成就",
      description: "2025年的成就将在这里展示",
      date: "2025",
      icon: "🔮",
      completed: false,
    },
    {
      category: "future" as const,
      name: "未来成就",
      description: "2025年的成就将在这里展示",
      date: "2025",
      icon: "🔮",
      completed: false,
    },
  ]

  return (
    <div className={cn("relative w-full max-w-5xl mx-auto", className)}>
      {/* Year tabs */}
      <div className="flex justify-center gap-4">
        <button
          className={cn(
            "px-6 py-3 rounded-t-lg font-bold text-lg transition-all duration-300",
            activeYear === "2024" || activeYear === null
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg scale-105"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600",
          )}
          onClick={() => setActiveYear(activeYear === "2024" ? null : "2024")}
        >
          2024 成就
        </button>
        <button
          className={cn(
            "px-6 py-3 rounded-t-lg font-bold text-lg transition-all duration-300",
            activeYear === "2025"
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600",
          )}
          onClick={() => setActiveYear(activeYear === "2025" ? null : "2025")}
        >
          2025 成就
        </button>
      </div>

      {/* 2024 Display rack */}
      <div
        className={cn(
          "relative transition-all duration-500 ease-in-out",
          activeYear === "2025" ? "opacity-0 h-0 overflow-hidden" : "opacity-100",
        )}
      >
        {/* Display rack background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 to-amber-800/30 rounded-lg -z-10 shadow-xl" />

        {/* Glass panel effect */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg -z-5" />

        {/* Rack top edge */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-t-lg" />

        {/* Rack bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-b-lg" />

        {/* Year label */}
        <div className="absolute -top-5 left-8 bg-amber-600 text-white px-4 py-1 rounded-t-lg font-bold shadow-lg">
          2024
        </div>

        {/* Rack content */}
        <div className="pt-8 pb-8 px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-white drop-shadow-glow">2024年度成就</h2>

          {/* Badge grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
            {achievements2024.map((achievement, index) => (
              <AchievementBadge
                key={`achievement-2024-${index}`}
                category={achievement.category}
                name={achievement.name}
                description={achievement.description}
                date={achievement.date}
                icon={achievement.icon}
                completed={achievement.completed}
              />
            ))}
          </div>
        </div>

        {/* Rack lighting effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent pointer-events-none" />

        {/* Rack shadow */}
        <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/30 blur-md rounded-full -z-20" />
      </div>

      {/* 2025 Display rack */}
      <div
        className={cn(
          "relative transition-all duration-500 ease-in-out",
          activeYear === "2024" ? "opacity-0 h-0 overflow-hidden" : "opacity-100",
        )}
      >
        {/* Display rack background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-blue-800/30 rounded-lg -z-10 shadow-xl" />

        {/* Glass panel effect */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg -z-5" />

        {/* Rack top edge */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 rounded-t-lg" />

        {/* Rack bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 rounded-b-lg" />

        {/* Year label */}
        <div className="absolute -top-5 left-8 bg-blue-600 text-white px-4 py-1 rounded-t-lg font-bold shadow-lg">
          2025
        </div>

        {/* Rack content */}
        <div className="pt-8 pb-8 px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-white drop-shadow-glow">2025年度成就</h2>

          {/* Badge grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
            {achievements2025.map((achievement, index) => (
              <AchievementBadge
                key={`achievement-2025-${index}`}
                category={achievement.category}
                name={achievement.name}
                description={achievement.description}
                date={achievement.date}
                icon={achievement.icon}
                completed={achievement.completed}
              />
            ))}
          </div>
        </div>

        {/* Rack lighting effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent pointer-events-none" />

        {/* Rack shadow */}
        <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/30 blur-md rounded-full -z-20" />
      </div>
    </div>
  )
}
