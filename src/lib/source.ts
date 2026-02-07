import { docs, v2 } from "@/.source";
import { loader } from "fumadocs-core/source";
import { createOpenAPI, attachFile } from "fumadocs-openapi/server";
import React, { createElement } from "react";
import * as LucideIcons from "lucide-react";

function resolveIcon(iconName: string | undefined) {
  if (!iconName) return undefined;
  const iconsMap = LucideIcons as unknown as Record<
    string,
    React.ComponentType
  >;
  const Icon = iconsMap[iconName];
  if (Icon)
    return createElement(Icon, {
      className: "size-4 ml-1",
    } as React.Attributes);
  return undefined;
}

export const source = loader({
  baseUrl: "/v1",
  source: docs.toFumadocsSource(),
  icon: resolveIcon,
  pageTree: {
    attachFile,
  },
});

export const sourceV2 = loader({
  baseUrl: "/v2",
  source: v2.toFumadocsSource(),
  icon: resolveIcon,
});

export const openapi = createOpenAPI();
