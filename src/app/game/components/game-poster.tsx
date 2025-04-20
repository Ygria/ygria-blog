"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "./badge"
import { Star, Clock, Monitor, Smartphone, Gamepad2 } from "lucide-react"

interface GamePosterProps {
  imageUrl: string
  title: string
  playtime: string
  rating: number
  platforms: string[]
  description: string
}

export default function GamePoster({ imageUrl, title, playtime, rating, platforms, description }: GamePosterProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "steam":
      case "epic":
      case "pc":
        return <Monitor className="mr-1 h-4 w-4" />
      case "mobile":
      case "ios":
      case "android":
        return <Smartphone className="mr-1 h-4 w-4" />
      default:
        return <Gamepad2 className="mr-1 h-4 w-4" />
    }
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto overflow-hidden rounded-2xl my-8 shadow-2xl">
      <div
        className="relative aspect-[7/3] w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image with gradient overlay */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            fill
            
            className="object-cover transition-transform duration-700 ease-in-out"
            style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-80" />
        </div>

        {/* Title overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">{title}</h1>
          <p className="text-white/80 max-w-2xl text-lg md:text-xl mb-6">{description}</p>
        </div>
      </div>

      {/* Game details section */}
      <div className="bg-black text-white p-2 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Playtime */}
          <div className="flex flex-col">
            <div className="flex items-center mb-2 text-white/70">
              <Clock className="mr-2 h-5 w-5" />
              <span className="text-sm uppercase tracking-wider">游玩时长</span>
            </div>
            <p className="text-xl font-medium">{playtime}</p>
          </div>

          {/* Rating */}
          <div className="flex flex-col">
            <div className="flex items-center mb-2 text-white/70">
              <Star className="mr-2 h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm uppercase tracking-wider">评分</span>
            </div>
            <div className="flex items-center">
              <span className="text-xl font-medium mr-2">{rating}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Platforms */}
          <div className="flex flex-col">
            <div className="flex items-center mb-2 text-white/70 ml-2">
              <Gamepad2 className="mr-2 h-5 w-5" />
              <span className="text-sm uppercase tracking-wider">游玩平台</span>
            </div>
            <div className="flex flex-wrap ">
              {platforms.map((platform) => (
                <Badge
                  key={platform}
                  variant="outline"
                  className="flex items-center bg-white/10 hover:bg-white/20 border-none text-white"
                >
                  {getPlatformIcon(platform)}
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
