/* eslint-disable @typescript-eslint/no-explicit-any */

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={{
        name: "docs",
        children: [
          {
            name: "Introduction",
            url: "/docs",
            type: "page",
          },
          {
            name: "Installation",
            type: "folder",
            children: [
              {
                name: "Node.js",
                url: "/docs/installation/node",
                type: "page",
              },
              {
                name: "Python",
                url: "/docs/installation/python",
                type: "page",
              },
            ],
          },
          ...source
            .getPageTree()
            .children?.filter((child) => child.$id === "rest"),
          {
            name: "Saving",
            url: "/docs/saving",
            type: "page",
          },
          {
            name: "Retrieve",
            url: "/docs/retrieve",
            type: "page",
          },
          {
            name: "Injection",
            url: "/docs/injection",
            type: "page",
          },
        ],
      }}
      {...baseOptions}
    >
      {children}
    </DocsLayout>
  );
}
