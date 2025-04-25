"use client"

import { useState, useRef, useEffect, type CSSProperties, useCallback } from "react"
import { cn } from "@/lib/utils"

type BadgeCategory = "music" | "culture" | "tech" | "hobby" | "learning" | "future"

interface AchievementBadgeProps {
  category: BadgeCategory
  name: string
  description: string
  date?: string
  icon: string
  className?: string
  completed?: boolean
}

export function AchievementBadge({
  category,
  name,
  description,
  date,
  icon,
  className,
  completed = true,
}: AchievementBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Colors based on achievement category
  const categoryColors = {
    music: {
      primary: "from-purple-400 to-purple-600",
      secondary: "from-fuchsia-300 to-purple-500",
      accent: "bg-purple-300",
      text: "text-purple-900",
      border: "border-purple-400",
      glow: "rgba(147, 51, 234, 0.5)",
      emblemBg: "bg-purple-200",
      foil: "url('/images/cosmos-bottom.png')",
    },
    culture: {
      primary: "from-red-400 to-red-600",
      secondary: "from-rose-300 to-red-500",
      accent: "bg-red-300",
      text: "text-red-900",
      border: "border-red-400",
      glow: "rgba(239, 68, 68, 0.5)",
      emblemBg: "bg-red-200",
      foil: "url('/images/endless-clouds.svg')",
    },
    tech: {
      primary: "from-blue-400 to-blue-600",
      secondary: "from-cyan-300 to-blue-500",
      accent: "bg-blue-300",
      text: "text-blue-900",
      border: "border-blue-400",
      glow: "rgba(59, 130, 246, 0.5)",
      emblemBg: "bg-blue-200",
      foil: "url('/images/overlapping-diamonds.svg')",
    },
    hobby: {
      primary: "from-green-400 to-green-600",
      secondary: "from-lime-300 to-green-500",
      accent: "bg-green-300",
      text: "text-green-900",
      border: "border-green-400",
      glow: "rgba(34, 197, 94, 0.5)",
      emblemBg: "bg-green-200",
      foil: "url('/images/foil.jpg')",
    },
    learning: {
      primary: "from-amber-400 to-amber-600",
      secondary: "from-yellow-300 to-amber-500",
      accent: "bg-amber-300",
      text: "text-amber-900",
      border: "border-amber-400",
      glow: "rgba(245, 158, 11, 0.5)",
      emblemBg: "bg-amber-200",
      foil: "url('/images/topography.svg')",
    },
    future: {
      primary: "from-gray-400 to-gray-600",
      secondary: "from-gray-300 to-gray-500",
      accent: "bg-gray-300",
      text: "text-gray-900",
      border: "border-gray-400",
      glow: "rgba(107, 114, 128, 0.5)",
      emblemBg: "bg-gray-200",
      foil: "url('/images/jupiter.svg')",
    },
  }

  // 初始的、鼠标不在元素上时的默认变量值
  const defaultPointerVars = {
    "--pointer-x": "50%", // 默认指向中心 X
    "--pointer-y": "50%", // 默认指向中心 Y
    "--pointer-from-left": "0.5", // 默认在 X 轴中心 (50%)
    "--pointer-from-top": "0.5", // 默认在 Y 轴中心 (50%)
    "--space": "15px", // 默认的 --space 值
    "--cosmosbg": "center center", // 如果 cosmosbg 也需要动态变化，加在这里
    "--foil-url": categoryColors[category].foil, // 默认的 foil 图片 URL
  }

  const [pointerVars, setPointerVars] = useState(defaultPointerVars)

  const handleMouseMove = useCallback(
    (event: any) => {
      if (!foilRef.current) {
        return // 如果 ref 还未准备好，则退出
      }

      // 1. 获取元素的边界信息
      const rect = foilRef.current.getBoundingClientRect()

      // 2. 计算鼠标相对于元素的坐标 (左上角为 0,0)
      // event.clientX/Y 是相对于视口的坐标
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // 限制 x, y 在元素边界内 (可选，防止超出)
      const elementWidth = rect.width
      const elementHeight = rect.height
      const clampedX = Math.max(0, Math.min(x, elementWidth))
      const clampedY = Math.max(0, Math.min(y, elementHeight))

      // 3. 计算鼠标位置相对于元素尺寸的百分比 (0 到 1)
      const percentX = elementWidth > 0 ? clampedX / elementWidth : 0.5
      const percentY = elementHeight > 0 ? clampedY / elementHeight : 0.5

      // 4. 根据计算出的值更新 CSS 变量
      setPointerVars({
        "--pointer-x": `${percentX * 100}%`, // 对应径向渐变的中心 X (百分比)
        "--pointer-y": `${percentY * 100}%`, // 对应径向渐变的中心 Y (百分比)
        "--pointer-from-left": percentX.toFixed(3), // 用于背景定位计算 (0 到 1)
        "--pointer-from-top": percentY.toFixed(3), // 用于背景定位计算 (0 到 1)
        "--space": `15px`, // 保持固定值
        "--cosmosbg": `center center`, // 保持固定值
        "--foil-url": categoryColors[category].foil, // 保持 foil 图片 URL
      })
    },
    [category],
  ) // 添加 category 作为依赖项

  // Ref 来获取 DOM 元素
  const foilRef = useRef<HTMLDivElement>(null)

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
    setPointerVars(defaultPointerVars)
  }

  const randomSeed = {
    x: Math.random(),
    y: Math.random(),
  }

  const cosmosPosition = {
    x: Math.floor(randomSeed.x * 734),
    y: Math.floor(randomSeed.y * 1280),
  }

  return (
    <div
      ref={badgeRef}
      className={cn(
        "relative w-32 h-40 select-none transition-transform duration-300",
        isHovered && !isTouchDevice ? "scale-110 z-10" : "scale-100 z-0",
        !completed && "opacity-60",
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
            categoryColors[category].primary,
            "shadow-lg",
            "transition-all duration-300",
            "before:absolute before:inset-0.5 before:rounded-t-2xl before:bg-gradient-to-b",
            `before:${categoryColors[category].secondary}`,
            "before:opacity-80",
            "before:z-10",
            "overflow-hidden",
            "border-2",

            categoryColors[category].border,
          )}
          style={{
            clipPath: "polygon(5% 0%, 95% 0%, 100% 5%, 100% 75%, 50% 100%, 0% 75%, 0% 5%)",
            maskImage:
              "radial-gradient(circle at 0 0, transparent 0, transparent 5px, black 5px), radial-gradient(circle at 100% 0, transparent 0, transparent 5px, black 5px)",
            maskSize: "51% 100%",
            maskPosition: "0 0, 100% 0",
            maskRepeat: "no-repeat",
            boxShadow: isHovered ? `0 10px 25px ${categoryColors[category].glow}` : "0 5px 15px rgba(0,0,0,0.3)",
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
          <div className="relative z-30 flex flex-col items-center justify-center h-full p-2">
            {/* Icon circle */}
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                categoryColors[category].emblemBg,
                "border",
                categoryColors[category].border,
                "shadow-inner",
              )}
            >
              <span className="text-2xl">{icon}</span>
            </div>

            {/* Badge name */}
            <h3 className={cn("font-bold text-center text-sm mt-1 mb-0.5 px-1  z-10", categoryColors[category].text)}>
              {name}
            </h3>

            {/* Date indicator */}
            {date && (
              <div
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  categoryColors[category].accent,
                  "border",
                  categoryColors[category].border,
                )}
              >
                {date}
              </div>
            )}
          </div>
        </div>

        <div
          id="card-foil"
          ref={foilRef}
          onMouseMove={handleMouseMove} // 监听鼠标移动
          onMouseLeave={handleMouseLeave} // 监听鼠标离开 (可选)
          className={cn(
            "absolute inset-0 rounded-t-2xl",
            "transition-all duration-300",
            "before:absolute before:inset-0.5 before:rounded-t-2xl before:bg-gradient-to-b",
            `before:${categoryColors[category].secondary}`,
            "before:opacity-80",
            "before:z-10",
            "overflow-hidden",
          )}
          style={
            {
              clipPath: "polygon(5% 0%, 95% 0%, 100% 5%, 100% 75%, 50% 100%, 0% 75%, 0% 5%)",
              maskImage:
                "radial-gradient(circle at 0 0, transparent 0, transparent 5px, black 5px), radial-gradient(circle at 100% 0, transparent 0, transparent 5px, black 5px)",
              maskSize: "51% 100%",
              maskPosition: "0 0, 100% 0",
              maskRepeat: "no-repeat",
              boxShadow: isHovered ? `0 10px 25px ${categoryColors[category].glow}` : "0 5px 15px rgba(0,0,0,0.3)",
              transform: "translateZ(0px)",
              ...pointerVars,
            } as CSSProperties
          }
        />

        {/* Badge back reflection/shadow */}
        <div
          className="absolute inset-0 bg-black/20 rounded-t-2xl -z-10"
          style={{
            clipPath: "polygon(5% 0%, 95% 0%, 100% 5%, 100% 75%, 50% 100%, 0% 75%, 0% 5%)",
            maskImage:
              "radial-gradient(circle at 0 0, transparent 0, transparent 5px, black 5px), radial-gradient(circle at 100% 0, transparent 0, transparent 5px, black 5px)",
            maskSize: "51% 100%",
            maskPosition: "0 0, 100% 0",
            maskRepeat: "no-repeat",
            transform: "translateZ(-1px) scale(0.98) translateY(5px)",
            filter: "blur(4px)",
            opacity: isHovered ? 0.5 : 0.3,
          }}
        />

        {/* Badge tooltip on hover */}
        {isHovered && (
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full mt-2 w-48 p-2 bg-white/90 backdrop-blur-sm rounded-md shadow-lg z-50 text-xs"
            style={{
              transform: "translateX(0%) translateY(30%)",
            }}
          >
            <p className="font-bold text-gray-900">{name}</p>
            <p className="text-gray-700 mt-1">{description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
