import { defineConfig } from "tsdown";
import Vue from "unplugin-vue/rolldown";

export default defineConfig({
	entry: ["./src/index.ts"],
	platform: "browser",
	plugins: [Vue({ isProduction: true })],
	dts: { vue: true },
	external: ["vue"],
});
