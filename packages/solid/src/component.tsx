import { fooBar } from "@shipwright-sh/package-core";
import { createSignal } from "solid-js";

export function Component() {
	const [count, setCount] = createSignal(0);

	return (
		<div>
			<p>Count: {count()}</p>
			<p>FooBar: {fooBar(count())}</p>
			<button type="button" onClick={() => setCount(count() + 1)}>
				Increment
			</button>
		</div>
	);
}
