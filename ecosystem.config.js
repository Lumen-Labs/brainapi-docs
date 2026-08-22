module.exports = {
  apps: [
    {
      name: "brainapi-docs",
      script: "npm start",
      cwd: __dirname,
      env: {
        PORT: 3877,
      },
      out_file: "./logs/brainapi-docs-out.log",
      error_file: "./logs/brainapi-docs-error.log",
    },
  ],
};
