import { docs, v2 } from "@/.source";
import { loader } from "fumadocs-core/source";
import { createOpenAPI } from "fumadocs-openapi/server";
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

export const openapi = createOpenAPI({
  input: ["content/v1/rest.json", "schemas/brainapi-v2.openapi.json"],
});

const openapiPreload = openapi.getSchemas().then((schemas) => ({
  preloaded: {
    docs: Object.fromEntries(
      Object.entries(schemas).map(([id, schema]) => [id, schema.bundled]),
    ),
  },
}));

export function getOpenAPIPreload() {
  return openapiPreload;
}

export const source = loader({
  baseUrl: "/v1",
  source: docs.toFumadocsSource(),
  icon: resolveIcon,
  plugins: [openapi.loaderPlugin()],
});

export const sourceV2 = loader({
  baseUrl: "/v2",
  source: v2.toFumadocsSource(),
  icon: resolveIcon,
  plugins: [openapi.loaderPlugin()],
});

export function isPublishedV2Url(url: string): boolean {
  const hiddenRoutes = [
    "/v2/benchmarks",
    "/v2/ingestion/backups",
    "/v2/retrieval/export-backups",
    "/v2/agentic/streaming-client",
  ];

  return !hiddenRoutes.some(
    (route) => url === route || url.startsWith(`${route}/`),
  );
}

export function getPublishedV2Pages() {
  return sourceV2.getPages().filter((page) => isPublishedV2Url(page.url));
}

export function getPublishedV2Page(slug?: string[]) {
  const page = sourceV2.getPage(slug);
  return page && isPublishedV2Url(page.url) ? page : undefined;
}

export function generatePublishedV2Params() {
  return sourceV2.generateParams().filter((params) => {
    const page = sourceV2.getPage(params.slug);
    return Boolean(page && isPublishedV2Url(page.url));
  });
}
