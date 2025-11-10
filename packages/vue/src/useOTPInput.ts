import type { RenderProps } from "@shipwright-sh/package-core";
import { inject, type Ref } from "vue";
import { OTPInputContextKey } from "./context";

export function useOTPInput(): Ref<RenderProps> {
	const context = inject(OTPInputContextKey);

	if (!context) {
		throw new Error("useOTPInput must be used within an OTPInput component");
	}

	return context;
}
