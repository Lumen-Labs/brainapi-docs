import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import {
  baseOptions,
  docsSidebarBanner,
  docsSidebarTabs,
} from "@/app/layout.config";
import { sourceV2 } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      containerProps={{ className: "md:[--fd-layout-width:100vw]" }}
      sidebar={{
        banner: docsSidebarBanner,
        tabs: docsSidebarTabs,
      }}
      tree={sourceV2.getPageTree()}
      {...baseOptions}
    >
      {children}
    </DocsLayout>
  );
}
