import { type Metadata } from "next";
import { allGames } from "content-collections";
import Link from "next/link";

import { config } from "@/lib/config";

import GamePoster from "./components/game-poster"

export const metadata: Metadata = {
  title: `Games | ${config.site.title}`,
  description: `Game of ${config.site.title}`,
  keywords: `${config.site.title}, games, ${config.site.title} games, ygria's daily`,
};

export default function GamePage() {
  const games = allGames.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  console.log(games);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      <div className="space-y-8">

        {games.map((blog: any) => (
          <article
            key={blog.slug}
            className=""
          >
            <Link href={`/game/${blog.slug}`}>
              <GamePoster
                imageUrl={blog.image}
                title={blog.title}
                playtime={blog.playTime}
                rating={blog.score}
                platforms={blog.platforms ?? []}
                description={blog.description}
              />

            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}


