import { generateFiles } from "fumadocs-openapi";

await generateFiles({
  input: "./schemas/brainapi-v2.openapi.json",
  output: "./content/v2/reference/api",
  per: "tag",
  includeDescription: true,
  addGeneratedComment: "Generated from schemas/brainapi-v2.openapi.json. Run npm run api:generate after syncing the schema.",
  frontmatter(title, description) {
    return {
      title: title === "Meta" ? "Metadata API" : `${title} API`,
      description: description ?? `BrainAPI ${title} endpoints`,
    };
  },
});
