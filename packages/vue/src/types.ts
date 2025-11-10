export interface OTPInputProps {
	// Core OTP props
	value?: string;
	maxLength: number;
	textAlign?: "left" | "center" | "right";
	pattern?: string | RegExp;
	placeholder?: string;
	inputMode?:
		| "numeric"
		| "text"
		| "decimal"
		| "tel"
		| "search"
		| "email"
		| "url";
	onComplete?: (value: string) => void;
	pushPasswordManagerStrategy?: "increase-width" | "none";
	pasteTransformer?: (pasted: string) => string;
	containerClassName?: string;
	noScriptCSSFallback?: string | null;

	// Common input attributes that we allow
	disabled?: boolean;
	autocomplete?: string;
	name?: string;
	id?: string;
	class?: string;
	style?: string;
	tabindex?: number;
	title?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
	"aria-invalid"?: boolean | "true" | "false";
	"aria-required"?: boolean | "true" | "false";
}
