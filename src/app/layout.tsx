import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { DOCS_BASE, DOCS_ORIGIN } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(DOCS_ORIGIN),
  title: {
    default: "BrainAPI documentation",
    template: "%s | BrainAPI",
  },
  description:
    "Build, retrieve, extend, and operate BrainAPI knowledge and memory systems.",
};

const inter = Inter({
  subsets: ["latin"],
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${outfit.className}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="describedby" href={`${DOCS_BASE}/llms.txt`} type="text/plain" />
      </head>
      <body className="flex flex-col min-h-screen">
        <GoogleAnalytics gaId="G-W1ZHLEVG8B" />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="03048a55-8079-4810-a04c-c17144835ac1";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
          }}
        />
        <RootProvider
          search={{
            options: {
              // next.config basePath is /docs — absolute /api/search 404s
              api: "/docs/api/search",
              defaultTag: "v2",
            },
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
