// import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { glob } from "glob";

import { BuildEnvironmentOptions, defineConfig } from "vite";
import { resolve } from "path";
import { UserConfigExport } from "vite";

// Vite configuration
export default defineConfig(async (config) => {
  const rollupOptions: BuildEnvironmentOptions["rollupOptions"] = {
    input: {},
    output: {
      // chunkFileNames: "[name].[ext]",
      entryFileNames: "[name].js",
      // assetFileNames: "[name].[ext]",
      assetFileNames: ({ names, ...chunkInfo }) => {
        const name = chunkInfo.originalFileNames?.[0];

        if (!name || !name.startsWith("src/")) return "[name].[ext]";

        const assetPath = name.split("src/")[1]; // Strip the "src/" prefix

        return assetPath;
      },
    },
    cache: false,
    preserveEntrySignatures: "strict",
    preserveSymlinks: true,
  };

  if (config.command === "build") {
    // Use `glob` to find all files in the `src/games` directory
    const filesPaths = await Promise.all([
      glob("./src/games/**/*.*"),
      glob("./src/libs/**/*.*"),
    ]).then((values) => values.flat());

    console.log("___ filesPaths", filesPaths);

    const input = (rollupOptions.input = {
      main: resolve(__dirname, "index.html"),
    });

    // Iterate over the found files and add them to the input object
    for (const filesPath of filesPaths) {
      input[
        filesPath.slice(
          "src/".length,
          filesPath.endsWith(".js") ? -3 : undefined,
        )
      ] = resolve(__dirname, filesPath);
    }
  }

  return {
    base: "/js-games",
    build: {
      assetsDir: "assets", // Folder to output assets during build
      rollupOptions,
      outDir: "./dist",
      emptyOutDir: true, // also necessary
      target: "esnext",
    },
    // Configure the public directory for static assets
    publicDir: "public",
    css: { transformer: "lightningcss" },
    plugins: [tailwindcss()],
  } satisfies UserConfigExport;
});
