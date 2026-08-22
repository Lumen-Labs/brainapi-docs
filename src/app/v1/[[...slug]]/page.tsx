import { getOpenAPIPreload, source } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents, OpenAPIPage } from "@/mdx-components";
import { LlmsPointer } from "@/components/agent-note";
import { absoluteDocsUrl } from "@/lib/site";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;
  const openapiPreload = await getOpenAPIPreload();

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      {...(page.data.lastModified
        ? { lastUpdate: page.data.lastModified }
        : {})}
      editOnGithub={{
        owner: "Lumen-Labs",
        repo: "brainapi-docs",
        sha: "main",
        path: `content/v1/${page.path}`,
      }}
    >
      <LlmsPointer />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            a: createRelativeLink(source, page),
            APIPage: async (apiPageProps: Record<string, unknown>) => (
              <OpenAPIPage
                {...(apiPageProps as any)}
                {...openapiPreload}
              />
            ),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: absoluteDocsUrl(page.url),
    },
  };
}
