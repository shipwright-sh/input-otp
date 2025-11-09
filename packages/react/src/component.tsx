import { fooBar } from "@shipwright-sh/package-core";
import { useState } from "react";

export function Component() {
	const [count, setCount] = useState(0);

	return (
		<div>
			<p>Count: {count}</p>
			<p>FooBar: {fooBar(count)}</p>
			<button type="button" onClick={() => setCount(count + 1)}>
				Increment
			</button>
		</div>
	);
}
