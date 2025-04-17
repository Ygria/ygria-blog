export const config = {
  site: {
    title: "Ygria‘s Dialy",
    name: "Ygria‘s Dialy",
    description: "Ygria‘s Dialy",
    keywords: ["Life", "AI", "Full Stack Developer"],
    url: "https://xxx.com",
    baseUrl: "https://xxx.com",
    image: "https://xxx.com/og-image.png",
    favicon: {
      ico: "/favicon.ico",
      png: "/favicon.png",
      svg: "/favicon.svg",
      appleTouchIcon: "/favicon.png",
    },
    manifest: "/site.webmanifest",
    rss: {
      title: "Ygria‘s Dialy",
      description: "Ygria‘s Dialy",
      feedLinks: {
        rss2: "/rss.xml",
        json: "/feed.json",
        atom: "/atom.xml",
      },
    },
  },
  author: {
    name: "Ygria",
    email: "",
    bio: "这是Ygria的生活日志存放处。",
  },
  social: {
    github: "https://github.com/Ygria",
    techBlog: "https://ygria.site",
    digitalGarden: "https://digital-garden.ygria.site/",
    // x: "https://x.com/xxx",
    // xiaohongshu: "https://www.xiaohongshu.com/user/profile/xxx",
    // wechat: "https://storage.xxx.com/images/wechat-official-account.png",
    // buyMeACoffee: "https://www.buymeacoffee.com/xxx",
  },
  giscus: {
    repo: "Ygria/ygria-blog",
    repoId: "R_kgDOOZRnsg",
    categoryId: "DIC_kwDOOZRnss4CpL4W",
  },
  navigation: {
    main: [
      { 
        title: "文章", 
        href: "/blog",
      },
    ],
  },
  seo: {
    metadataBase: new URL("https://xxx.com"),
    alternates: {
      canonical: './',
    },
    openGraph: {
      type: "website" as const,
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image" as const,
      creator: "@xxx",
    },
  },
};
