"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "holo" | "rainbow" | "galaxy" | "standard"
type BadgeSize = "sm" | "md" | "lg"

interface HolographicBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

export function HolographicBadge({ children, variant = "holo", size = "md", className }: HolographicBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!badgeRef.current) return

      const rect = badgeRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      setPosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 h-5",
    md: "text-sm px-2.5 py-0.5 h-6",
    lg: "text-base px-3 py-1 h-8",
  }

  return (
    <div
      ref={badgeRef}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 select-none",
        sizeClasses[size],
        "before:absolute before:inset-0 before:rounded-full before:z-0 before:transition-opacity before:duration-300",
        "after:absolute after:inset-0 after:rounded-full after:z-0 after:transition-opacity after:duration-300",
        isHovering ? "shadow-lg scale-105" : "shadow-md",
        variant === "holo" && "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
        variant === "rainbow" && "bg-white text-gray-800",
        variant === "galaxy" && "bg-black text-white",
        variant === "standard" && "bg-gray-100 text-gray-800",
        className,
      )}
      style={
        {
          "--x": `${position.x}%`,
          "--y": `${position.y}%`,
        } as React.CSSProperties
      }
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span
        className={cn(
          "relative z-10",
          variant === "holo" && "holo-shine",
          variant === "rainbow" && "rainbow-shine",
          variant === "galaxy" && "galaxy-shine",
        )}
      >
        {children}
      </span>
      {variant === "holo" && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(255,255,255,0.8)_0%,transparent_60%)] opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full z-[1]"></div>
      )}
      {variant === "rainbow" && (
        <div className="absolute inset-0 bg-[conic-gradient(from_var(--x)deg_at_var(--x)%_var(--y)%,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3,#ff0000)] opacity-0 hover:opacity-40 mix-blend-color-dodge transition-opacity duration-300 rounded-full z-[1]"></div>
      )}
      {variant === "galaxy" && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(120,120,255,0.8)_0%,rgba(100,0,150,0.4)_40%,transparent_60%)] opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full z-[1]"></div>
      )}
    </div>
  )
}
