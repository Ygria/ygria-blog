"use client"

import { useState } from "react"
import { ShieldBadge } from "./shield-badge"
import { cn } from "@/lib/utils"

interface BadgeDisplayRackProps {
  className?: string
}

export function BadgeDisplayRack({ className }: BadgeDisplayRackProps) {
  const [activeRow, setActiveRow] = useState<number | null>(null)

  const badges = [
    // Row 1
    [
      { type: "water" as const, name: "Cascade", level: 15, emblem: "💧" },
      { type: "fire" as const, name: "Volcano", level: 22, emblem: "🔥" },
      { type: "grass" as const, name: "Rainbow", level: 18, emblem: "🌿" },
    ],
    // Row 2
    [
      { type: "electric" as const, name: "Thunder", level: 24, emblem: "⚡" },
      { type: "psychic" as const, name: "Marsh", level: 30, emblem: "🔮" },
      { type: "dark" as const, name: "Soul", level: 28, emblem: "🌑" },
    ],
  ]

  return (
    <div className={cn("relative w-full max-w-3xl mx-auto", className)}>
      {/* Display rack background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg -z-10 shadow-xl" />

      {/* Glass panel effect */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-lg -z-5" />

      {/* Rack top edge */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-t-lg" />

      {/* Rack bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-b-lg" />

      {/* Rack content */}
      <div className="pt-8 pb-8 px-4">
        <h2 className="text-2xl font-bold text-center mb-8 text-white drop-shadow-glow">Pokémon Gym Badges</h2>

        {/* Badge rows */}
        <div className="space-y-12">
          {badges.map((row, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className={cn(
                "flex justify-center gap-8 transition-all duration-500",
                activeRow === rowIndex ? "scale-105" : "scale-100",
                activeRow !== null && activeRow !== rowIndex ? "opacity-50" : "opacity-100",
              )}
              onMouseEnter={() => setActiveRow(rowIndex)}
              onMouseLeave={() => setActiveRow(null)}
            >
              {row.map((badge, badgeIndex) => (
                <ShieldBadge
                  key={`badge-${rowIndex}-${badgeIndex}`}
                  type={badge.type}
                  name={badge.name}
                  level={badge.level}
                  emblem={badge.emblem}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Rack lighting effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent pointer-events-none" />

      {/* Rack shadow */}
      <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/30 blur-md rounded-full -z-20" />
    </div>
  )
}
