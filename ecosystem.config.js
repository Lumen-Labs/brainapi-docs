// File: /ecosystem.config.js
// Created Date: Sunday July 20th 2025
// Author: Christian Nonis <redacted@example.invalid>
// -----
// Last Modified: Sunday July 20th 2025 12:34:58 pm
// Modified By: the developer formerly known as Christian Nonis at <redacted@example.invalid>
// -----

module.exports = {
  apps: [
    {
      name: "brainapi-docs",
      script: "npm start",
      cwd: "./",
      env: {
        PORT: 3877,
      },
      out_file: "./logs/brainapi-docs-out.log",
      error_file: "./logs/brainapi-docs-error.log",
    },
  ],
};
