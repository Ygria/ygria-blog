"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

type BadgeType = "water" | "fire" | "grass" | "electric" | "psychic" | "dark"

interface ShieldBadgeProps {
  type: BadgeType
  name: string
  level: number
  className?: string
  emblem?: string
}

export function ShieldBadge({ type, name, level, className, emblem }: ShieldBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Colors based on Pokémon type
  const typeColors = {
    water: {
      primary: "from-blue-400 to-blue-600",
      secondary: "from-cyan-300 to-blue-500",
      accent: "bg-blue-300",
      text: "text-blue-900",
      border: "border-blue-400",
      glow: "rgba(59, 130, 246, 0.5)",
      emblemBg: "bg-blue-200",
    },
    fire: {
      primary: "from-orange-400 to-red-600",
      secondary: "from-yellow-300 to-red-500",
      accent: "bg-orange-300",
      text: "text-red-900",
      border: "border-orange-400",
      glow: "rgba(239, 68, 68, 0.5)",
      emblemBg: "bg-orange-200",
    },
    grass: {
      primary: "from-green-400 to-green-600",
      secondary: "from-lime-300 to-green-500",
      accent: "bg-green-300",
      text: "text-green-900",
      border: "border-green-400",
      glow: "rgba(34, 197, 94, 0.5)",
      emblemBg: "bg-green-200",
    },
    electric: {
      primary: "from-yellow-400 to-amber-500",
      secondary: "from-yellow-200 to-yellow-400",
      accent: "bg-yellow-300",
      text: "text-amber-900",
      border: "border-yellow-400",
      glow: "rgba(245, 158, 11, 0.5)",
      emblemBg: "bg-yellow-200",
    },
    psychic: {
      primary: "from-purple-400 to-purple-600",
      secondary: "from-fuchsia-300 to-purple-500",
      accent: "bg-purple-300",
      text: "text-purple-900",
      border: "border-purple-400",
      glow: "rgba(147, 51, 234, 0.5)",
      emblemBg: "bg-purple-200",
    },
    dark: {
      primary: "from-gray-600 to-gray-800",
      secondary: "from-gray-400 to-gray-700",
      accent: "bg-gray-500",
      text: "text-gray-200",
      border: "border-gray-500",
      glow: "rgba(75, 85, 99, 0.5)",
      emblemBg: "bg-gray-400",
    },
  }

  // Type-specific emblems
  const typeEmblems = {
    water: "💧",
    fire: "🔥",
    grass: "🌿",
    electric: "⚡",
    psychic: "🔮",
    dark: "🌑",
  }

  useEffect(() => {
    // Check if it's a touch device
    const isTouchCapable =
      "ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0

    setIsTouchDevice(isTouchCapable)
  }, [])

  useEffect(() => {
    if (isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!badgeRef.current || !isHovered) return

      const rect = badgeRef.current.getBoundingClientRect()

      // Calculate mouse position relative to the center of the badge
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      // Calculate rotation based on mouse position
      const rotateX = (y / (rect.height / 2)) * -15
      const rotateY = (x / (rect.width / 2)) * 15

      // Calculate highlight position
      const posX = ((e.clientX - rect.left) / rect.width) * 100
      const posY = ((e.clientY - rect.top) / rect.height) * 100

      setRotation({ x: rotateX, y: rotateY })
      setPosition({ x: posX, y: posY })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isHovered, isTouchDevice])

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    // Reset rotation with a smooth transition
    setRotation({ x: 0, y: 0 })
  }

  return (
    <div
      ref={badgeRef}
      className={cn(
        "relative w-32 h-40 select-none transition-transform duration-300",
        isHovered && !isTouchDevice ? "scale-110 z-10" : "scale-100 z-0",
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* 3D container */}
      <div
        className="w-full h-full relative"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Shield shape with clip path */}
        <div
          className={cn(
            "absolute inset-0 rounded-t-2xl",
            "bg-gradient-to-b",
            typeColors[type].primary,
            "shadow-lg",
            "transition-all duration-300",
            "before:absolute before:inset-0.5 before:rounded-t-2xl before:bg-gradient-to-b",
            `before:${typeColors[type].secondary}`,
            "before:opacity-80",
            "before:z-10",
            "overflow-hidden",
            "border-2",
            typeColors[type].border,
          )}
          style={{
            clipPath: "polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)",
            boxShadow: isHovered ? `0 10px 25px ${typeColors[type].glow}` : "0 5px 15px rgba(0,0,0,0.3)",
            transform: "translateZ(0px)",
          }}
        >
          {/* Dynamic highlight effect */}
          <div
            className="absolute inset-0 z-20 opacity-0 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${position.x}% ${position.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)`,
              opacity: isHovered ? 0.7 : 0,
              mixBlendMode: "overlay",
            }}
          />

          {/* Glass effect overlay */}
          <div
            className="absolute inset-0 z-10 opacity-30"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)",
            }}
          />

          {/* Badge content */}
          <div className="relative z-20 flex flex-col items-center justify-center h-full p-2">
            {/* Emblem circle */}
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                typeColors[type].emblemBg,
                "border",
                typeColors[type].border,
                "shadow-inner",
              )}
            >
              <span className="text-2xl">{emblem || typeEmblems[type]}</span>
            </div>

            {/* Badge name */}
            <h3 className={cn("font-bold text-center text-sm mt-1 mb-0.5", typeColors[type].text)}>{name}</h3>

            {/* Level indicator */}
            <div
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                typeColors[type].accent,
                "border",
                typeColors[type].border,
              )}
            >
              Lv. {level}
            </div>
          </div>
        </div>

        {/* Badge back reflection/shadow */}
        <div
          className="absolute inset-0 bg-black/20 rounded-t-2xl -z-10"
          style={{
            clipPath: "polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)",
            transform: "translateZ(-1px) scale(0.98) translateY(5px)",
            filter: "blur(4px)",
            opacity: isHovered ? 0.5 : 0.3,
          }}
        />
      </div>
    </div>
  )
}
