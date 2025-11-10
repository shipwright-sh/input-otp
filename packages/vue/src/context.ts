import type { RenderProps } from "@shipwright-sh/package-core";
import type { InjectionKey, Ref } from "vue";

export const OTPInputContextKey: InjectionKey<Ref<RenderProps>> =
	Symbol("OTPInputContext");
