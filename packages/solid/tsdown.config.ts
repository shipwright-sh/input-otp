import solid from "rolldown-plugin-solid";
import { defineConfig } from "tsdown";

export default defineConfig({
	platform: "browser",
	plugins: [solid()],
	external: ["solid-js"],
	dts: {
		resolve: ["@shipwright-sh/package-core"],
	},
});
