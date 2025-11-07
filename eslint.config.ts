import js from "@eslint/js";
import css from "@eslint/css";
import globals from "globals";
import tsEslint from "typescript-eslint";
import eslintPrettier from "eslint-plugin-prettier";

import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	globalIgnores(["dist", ".sassrc.cjs"]),
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
		plugins: { js, eslintPrettier },
		extends: ["js/recommended"],
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
	},
	tsEslint.configs.strictTypeChecked,
	tsEslint.configs.stylisticTypeChecked,
	{
		files: ["**/*.css"],
		plugins: { css },
		language: "css/css",
		extends: ["css/recommended"],
	},
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
]);
