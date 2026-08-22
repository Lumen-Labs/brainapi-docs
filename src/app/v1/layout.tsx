import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import {
  baseOptions,
  docsSidebarBanner,
  docsSidebarTabs,
} from "@/app/layout.config";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      containerProps={{ className: "md:[--fd-layout-width:100vw]" }}
      sidebar={{
        banner: docsSidebarBanner,
        tabs: docsSidebarTabs,
      }}
      tree={source.getPageTree()}
      {...baseOptions}
    >
      {children}
    </DocsLayout>
  );
}
