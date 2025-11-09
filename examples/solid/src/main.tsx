import { render } from "solid-js/web";
import { App } from "./app";

const rootEl = document.getElementById("root");

if (!rootEl) {
	throw new Error("Root element not found");
}

const root = document.getElementById("root");

render(() => <App />, root!);
