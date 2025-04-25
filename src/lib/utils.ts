import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function getFoilStaticStyle() {
  const randomSeed = {
    x: Math.random(),
    y: Math.random(),
  };

  const cosmosPosition = {
    x: Math.floor(randomSeed.x * 734),
    y: Math.floor(randomSeed.y * 1280),
  };

  const staticStyles = {
    "--seedx": randomSeed.x,
    "--seedy": randomSeed.y,
    "--cosmosbg": `${cosmosPosition.x}px ${cosmosPosition.y}px`,
  };

  return staticStyles;
}
