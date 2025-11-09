import solid from "rolldown-plugin-solid";
import { defineConfig } from "tsdown";

// export both js and jsx
export default defineConfig({
	platform: "neutral",
	// use the solid plugin to handle jsx
	plugins: [solid()],
	external: ["solid-js"],
});
