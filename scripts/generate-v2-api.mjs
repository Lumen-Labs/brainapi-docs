import { generateFiles } from "fumadocs-openapi";
import { createOpenAPI } from "fumadocs-openapi/server";

const openapi = createOpenAPI({
  input: ["schemas/brainapi-v2.openapi.json"],
});

await generateFiles({
  input: openapi,
  output: "./content/v2/reference/api",
  per: "tag",
  includeDescription: true,
  addGeneratedComment: "Generated from schemas/brainapi-v2.openapi.json. Run npm run api:generate after syncing the schema.",
  frontmatter(title, description) {
    const group = title === "Meta" ? "Metadata" : title;
    return {
      title: `BrainAPI ${group} API`,
      description: description ?? `BrainAPI ${title} endpoints`,
    };
  },
});
