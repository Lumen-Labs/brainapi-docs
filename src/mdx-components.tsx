import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { CodeBlock } from "fumadocs-ui/components/codeblock";
import { TypeTable } from "fumadocs-ui/components/type-table";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { AgentNote } from "@/components/agent-note";
import type { ComponentProps } from "react";
export { OpenAPIPage } from "@/components/api-page";

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    DynamicCodeBlock,
    CodeBlock,
    TypeTable,
    AgentNote,
    img: (props) => (
      <ImageZoom
        {...(props as ComponentProps<typeof ImageZoom>)}
        className="p-4 bg-gray-200/20 border border-gray-200 rounded-lg"
      />
    ),
    ...components,
  };
}
