// File: /generate-docs.js
// Created Date: Saturday August 2nd 2025
// Author: Christian Nonis <redacted@example.invalid>
// -----
// Last Modified: Saturday August 2nd 2025 7:02:46 pm
// Modified By: the developer formerly known as Christian Nonis at <redacted@example.invalid>
// -----

import { generateFiles } from "fumadocs-openapi";
void generateFiles({
  // the OpenAPI schema, you can also give it an external URL.
  input: ["./content/v1/rest.json"],
  output: "./content/v1/rest",
  // we recommend to enable it
  // make sure your endpoint description doesn't break MDX syntax.
  includeDescription: true,
});
