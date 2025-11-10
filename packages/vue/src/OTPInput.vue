<script setup lang="ts">
import {
	type RenderProps,
	type SlotProps,
	syncTimeouts,
} from "@shipwright-sh/package-core";
import {
	type CSSProperties,
	computed,
	onBeforeUnmount,
	onMounted,
	provide,
	ref,
	watch,
	watchEffect,
} from "vue";
import { OTPInputContextKey } from "./context";
import type { OTPInputProps } from "./types";

const props = withDefaults(defineProps<OTPInputProps>(), {
	textAlign: "left",
	inputMode: "numeric",
	pushPasswordManagerStrategy: "increase-width",
	noScriptCSSFallback: undefined,
});

const emit = defineEmits<{
	(e: "update:value", value: string): void;
	(e: "change", event: Event): void;
	(e: "focus", event: FocusEvent): void;
	(e: "blur", event: FocusEvent): void;
	(e: "paste", event: ClipboardEvent): void;
	(e: "mouseOver", event: MouseEvent): void;
	(e: "mouseLeave", event: MouseEvent): void;
}>();

// Internal state for uncontrolled mode
const internalValue = ref("");

// Value management
const value = computed(() => props.value ?? internalValue.value);
const previousValue = ref<string | undefined>(undefined);

const onChange = (newValue: string) => {
	emit("update:value", newValue);
	internalValue.value = newValue;
};

// Pattern/regexp
const regexp = computed(() => {
	const pattern = props.pattern;
	if (!pattern) return null;
	return typeof pattern === "string" ? new RegExp(pattern) : pattern;
});

// Refs
const inputRef = ref<HTMLInputElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// Initial load data
const initialLoadRef = {
	value: value.value,
	onChange,
	isIOS:
		typeof window !== "undefined" &&
		window?.CSS?.supports?.("-webkit-touch-callout", "none"),
};

const inputMetadataRef: {
	prev: [number | null, number | null, "none" | "forward" | "backward" | null];
} = {
	prev: [null, null, null],
};

// Mirror state for UI rendering
const isHoveringInput = ref(false);
const isFocused = ref(false);
const mirrorSelectionStart = ref<number | null>(null);
const mirrorSelectionEnd = ref<number | null>(null);

// Password manager badge detection
const hasPWMBadge = ref(false);
const hasPWMBadgeSpace = ref(false);
const pwmDone = ref(false);

const PWM_BADGE_SPACE_WIDTH_PX = 40;
const PWM_BADGE_SPACE_WIDTH = `${PWM_BADGE_SPACE_WIDTH_PX}px` as const;
const PWM_BADGE_MARGIN_RIGHT = 18;

const PASSWORD_MANAGERS_SELECTORS = [
	"[data-lastpass-icon-root]", // LastPass
	"com-1password-button", // 1Password
	"[data-dashlanecreated]", // Dashlane
	'[style$="2147483647 !important;"]', // Bitwarden
].join(",");

const willPushPWMBadge = computed(() => {
	const strategy = props.pushPasswordManagerStrategy ?? "increase-width";
	if (strategy === "none") return false;
	return (
		strategy === "increase-width" && hasPWMBadge.value && hasPWMBadgeSpace.value
	);
});

// Mount effect for DOM initialization
onMounted(() => {
	const input = inputRef.value;
	const container = containerRef.value;

	if (!input || !container) return;

	// Sync input value
	if (initialLoadRef.value !== input.value) {
		initialLoadRef.onChange(input.value);
	}

	// Previous selection
	inputMetadataRef.prev = [
		input.selectionStart,
		input.selectionEnd,
		input.selectionDirection as "none" | "forward" | "backward" | null,
	];

	function onDocumentSelectionChange() {
		if (!input) return;
		if (document.activeElement !== input) {
			mirrorSelectionStart.value = null;
			mirrorSelectionEnd.value = null;
			return;
		}

		// Aliases
		const _s = input.selectionStart;
		const _e = input.selectionEnd;
		const _dir = input.selectionDirection;
		const _ml = input.maxLength;
		const _val = input.value;
		const _prev = inputMetadataRef.prev;

		// Algorithm
		let start = -1;
		let end = -1;
		let direction: "forward" | "backward" | "none" | undefined;

		if (_val.length !== 0 && _s !== null && _e !== null) {
			const isSingleCaret = _s === _e;
			const isInsertMode = _s === _val.length && _val.length < _ml;

			if (isSingleCaret && !isInsertMode) {
				const c = _s;
				if (c === 0) {
					start = 0;
					end = 1;
					direction = "forward";
				} else if (c === _ml) {
					start = c - 1;
					end = c;
					direction = "backward";
				} else if (_ml > 1 && _val.length > 1) {
					let offset = 0;
					if (_prev[0] !== null && _prev[1] !== null) {
						direction = c < _prev[1] ? "backward" : "forward";
						const wasPreviouslyInserting =
							_prev[0] === _prev[1] && _prev[0] < _ml;
						if (direction === "backward" && !wasPreviouslyInserting) {
							offset = -1;
						}
					}

					start = offset + c;
					end = offset + c + 1;
				}
			}

			if (start !== -1 && end !== -1 && start !== end) {
				input.setSelectionRange(start, end, direction);
			}
		}

		// Finally, update the state
		const s = start !== -1 ? start : _s;
		const e = end !== -1 ? end : _e;
		const dir = direction ?? _dir;
		mirrorSelectionStart.value = s;
		mirrorSelectionEnd.value = e;
		// Store the previous selection value
		inputMetadataRef.prev = [
			s,
			e,
			dir as "none" | "forward" | "backward" | null,
		];
	}

	document.addEventListener("selectionchange", onDocumentSelectionChange, {
		capture: true,
	});

	// Set initial mirror state
	onDocumentSelectionChange();
	if (document.activeElement === input) {
		isFocused.value = true;
	}

	// Apply needed styles
	if (!document.getElementById("input-otp-style")) {
		const styleEl = document.createElement("style");
		styleEl.id = "input-otp-style";
		document.head.appendChild(styleEl);

		if (styleEl.sheet) {
			const autofillStyles =
				"background: transparent !important; color: transparent !important; border-color: transparent !important; opacity: 0 !important; box-shadow: none !important; -webkit-box-shadow: none !important; -webkit-text-fill-color: transparent !important;";

			safeInsertRule(
				styleEl.sheet,
				"[data-input-otp]::selection { background: transparent !important; color: transparent !important; }",
			);
			safeInsertRule(
				styleEl.sheet,
				`[data-input-otp]:autofill { ${autofillStyles} }`,
			);
			safeInsertRule(
				styleEl.sheet,
				`[data-input-otp]:-webkit-autofill { ${autofillStyles} }`,
			);
			// iOS
			safeInsertRule(
				styleEl.sheet,
				"@supports (-webkit-touch-callout: none) { [data-input-otp] { letter-spacing: -.6em !important; font-weight: 100 !important; font-stretch: ultra-condensed; font-optical-sizing: none !important; left: -1px !important; right: 1px !important; } }",
			);
			// PWM badges
			safeInsertRule(
				styleEl.sheet,
				"[data-input-otp] + * { pointer-events: all !important; }",
			);
		}
	}

	// Track root height
	const updateRootHeight = () => {
		if (container && input) {
			container.style.setProperty("--root-height", `${input.clientHeight}px`);
		}
	};
	updateRootHeight();
	const resizeObserver = new ResizeObserver(updateRootHeight);
	resizeObserver.observe(input);

	onBeforeUnmount(() => {
		document.removeEventListener("selectionchange", onDocumentSelectionChange, {
			capture: true,
		});
		resizeObserver.disconnect();
	});
});

// Effect for value changes and focus
watchEffect(() => {
	// Track these for reactivity
	value.value;
	isFocused.value;

	syncTimeouts(() => {
		if (!inputRef.value) return;
		// Forcefully remove :autofill state
		inputRef.value.dispatchEvent(new Event("input"));

		// Update the selection state
		const s = inputRef.value.selectionStart;
		const e = inputRef.value.selectionEnd;
		const dir = inputRef.value.selectionDirection;
		if (s !== null && e !== null) {
			mirrorSelectionStart.value = s;
			mirrorSelectionEnd.value = e;
			inputMetadataRef.prev = [
				s,
				e,
				dir as "none" | "forward" | "backward" | null,
			];
		}
	});
});

// Track previous value
watch(value, (newVal) => {
	previousValue.value = newVal;
});

// Effect for onComplete
watch(value, (currentValue, prevValue) => {
	if (prevValue === undefined) return;

	if (
		currentValue !== prevValue &&
		prevValue.length < props.maxLength &&
		currentValue.length === props.maxLength
	) {
		props.onComplete?.(currentValue);
	}
});

// Password manager badge tracking - check if there's space
watchEffect((onCleanup) => {
	const container = containerRef.value;
	const strategy = props.pushPasswordManagerStrategy ?? "increase-width";

	if (!container || strategy === "none") return;

	// Check if the PWM area is 100% visible
	function checkHasSpace() {
		if (!container) return;
		const viewportWidth = window.innerWidth;
		const distanceToRightEdge =
			viewportWidth - container.getBoundingClientRect().right;
		hasPWMBadgeSpace.value = distanceToRightEdge >= PWM_BADGE_SPACE_WIDTH_PX;
	}

	checkHasSpace();
	const interval = setInterval(checkHasSpace, 1000);

	onCleanup(() => clearInterval(interval));
});

// Password manager badge tracking - detect badge
watchEffect((onCleanup) => {
	const focused = isFocused.value;
	const strategy = props.pushPasswordManagerStrategy ?? "increase-width";

	if (strategy === "none" || !focused) return;

	const trackPWMBadge = () => {
		const container = containerRef.value;
		const input = inputRef.value;

		if (!container || !input || pwmDone.value) return;

		const elementToCompare = container;

		const rightCornerX =
			elementToCompare.getBoundingClientRect().left +
			elementToCompare.offsetWidth;
		const centeredY =
			elementToCompare.getBoundingClientRect().top +
			elementToCompare.offsetHeight / 2;
		const x = rightCornerX - PWM_BADGE_MARGIN_RIGHT;
		const y = centeredY;

		const pmws = document.querySelectorAll(PASSWORD_MANAGERS_SELECTORS);

		if (pmws.length === 0) {
			const maybeBadgeEl = document.elementFromPoint(x, y);
			if (maybeBadgeEl === container) {
				return;
			}
		}

		hasPWMBadge.value = true;
		pwmDone.value = true;
	};

	const t1 = setTimeout(trackPWMBadge, 0);
	const t2 = setTimeout(trackPWMBadge, 2000);
	const t3 = setTimeout(trackPWMBadge, 5000);
	const t4 = setTimeout(() => {
		pwmDone.value = true;
	}, 6000);

	onCleanup(() => {
		clearTimeout(t1);
		clearTimeout(t2);
		clearTimeout(t3);
		clearTimeout(t4);
	});
});

// Event handlers
const _changeListener = (e: Event) => {
	const target = e.currentTarget as HTMLInputElement;
	const newValue = target.value.slice(0, props.maxLength);
	const currentRegexp = regexp.value;
	if (newValue.length > 0 && currentRegexp && !currentRegexp.test(newValue)) {
		e.preventDefault();
		return;
	}

	const prevValue = previousValue.value;
	const maybeHasDeleted =
		typeof prevValue === "string" && newValue.length < prevValue.length;

	if (maybeHasDeleted) {
		document.dispatchEvent(new Event("selectionchange"));
	}

	onChange(newValue);
	emit("change", e);
};

const _focusListener = (e: FocusEvent) => {
	if (inputRef.value) {
		const start = Math.min(inputRef.value.value.length, props.maxLength - 1);
		const end = inputRef.value.value.length;
		inputRef.value.setSelectionRange(start, end);
		mirrorSelectionStart.value = start;
		mirrorSelectionEnd.value = end;
	}
	isFocused.value = true;
	emit("focus", e);
};

const _pasteListener = (e: ClipboardEvent) => {
	const input = inputRef.value;
	if (
		!props.pasteTransformer &&
		(!initialLoadRef.isIOS || !e.clipboardData || !input)
	) {
		return;
	}

	const _content = e.clipboardData?.getData("text/plain") ?? "";
	const content = props.pasteTransformer
		? props.pasteTransformer(_content)
		: _content;
	e.preventDefault();

	const start = input?.selectionStart ?? 0;
	const end = input?.selectionEnd ?? 0;

	const isReplacing = start !== end;

	const currentValue = value.value;
	const newValueUncapped = isReplacing
		? currentValue.slice(0, start) + content + currentValue.slice(end)
		: currentValue.slice(0, start) + content + currentValue.slice(start);
	const newValue = newValueUncapped.slice(0, props.maxLength);

	const currentRegexp = regexp.value;
	if (newValue.length > 0 && currentRegexp && !currentRegexp.test(newValue)) {
		return;
	}

	if (input) {
		input.value = newValue;
		onChange(newValue);

		const _start = Math.min(newValue.length, props.maxLength - 1);
		const _end = newValue.length;

		input.setSelectionRange(_start, _end);
		mirrorSelectionStart.value = _start;
		mirrorSelectionEnd.value = _end;
	}

	emit("paste", e);
};

// Styles
const rootStyle = computed<CSSProperties>(() => ({
	position: "relative",
	cursor: props.disabled ? "default" : "text",
	userSelect: "none",
	WebkitUserSelect: "none",
	pointerEvents: "none",
}));

const inputStyle = computed<CSSProperties>(() => ({
	position: "absolute",
	inset: "0",
	width: willPushPWMBadge.value
		? `calc(100% + ${PWM_BADGE_SPACE_WIDTH})`
		: "100%",
	clipPath: willPushPWMBadge.value
		? `inset(0 ${PWM_BADGE_SPACE_WIDTH} 0 0)`
		: undefined,
	height: "100%",
	display: "flex",
	textAlign: props.textAlign ?? "left",
	opacity: "1",
	color: "transparent",
	pointerEvents: "all",
	background: "transparent",
	caretColor: "transparent",
	border: "0 solid transparent",
	outline: "0 solid transparent",
	boxShadow: "none",
	lineHeight: "1",
	letterSpacing: "-.5em",
	fontSize: "var(--root-height)",
	fontFamily: "monospace",
	fontVariantNumeric: "tabular-nums",
}));

// Context value
const contextValue = computed<RenderProps>(() => {
	const currentValue = value.value;
	const focused = isFocused.value;
	const hovering = isHoveringInput.value;
	const mss = mirrorSelectionStart.value;
	const mse = mirrorSelectionEnd.value;

	return {
		slots: Array.from({ length: props.maxLength }).map((_, slotIdx) => {
			const isActive =
				focused &&
				mss !== null &&
				mse !== null &&
				((mss === mse && slotIdx === mss) || (slotIdx >= mss && slotIdx < mse));

			const char =
				currentValue[slotIdx] !== undefined ? currentValue[slotIdx] : null;
			const placeholderChar =
				currentValue[0] !== undefined
					? null
					: (props.placeholder?.[slotIdx] ?? null);

			return {
				char,
				placeholderChar,
				isActive,
				hasFakeCaret: isActive && char === null,
			} satisfies SlotProps;
		}),
		isFocused: focused,
		isHovering: !props.disabled && hovering,
	};
});

// Constants
const NOSCRIPT_CSS_FALLBACK = `
[data-input-otp] {
  --nojs-bg: white !important;
  --nojs-fg: black !important;

  background-color: var(--nojs-bg) !important;
  color: var(--nojs-fg) !important;
  caret-color: var(--nojs-fg) !important;
  letter-spacing: .25em !important;
  text-align: center !important;
  border: 1px solid var(--nojs-fg) !important;
  border-radius: 4px !important;
  width: 100% !important;
}
@media (prefers-color-scheme: dark) {
  [data-input-otp] {
    --nojs-bg: black !important;
    --nojs-fg: white !important;
  }
}`;

function safeInsertRule(sheet: CSSStyleSheet, rule: string) {
	try {
		sheet.insertRule(rule);
	} catch {
		console.error("input-otp could not insert CSS rule:", rule);
	}
}

// Provide context for child components
provide(OTPInputContextKey, contextValue);

const noScriptFallback =
	props.noScriptCSSFallback !== undefined
		? props.noScriptCSSFallback
		: NOSCRIPT_CSS_FALLBACK;
</script>

<template>
	<component :is="'div'">
		<noscript 
			v-if="noScriptFallback !== null" 
			v-html="`<style>${noScriptFallback}</style>`"
		/>

		<div
			ref="containerRef"
			data-input-otp-container
			:style="rootStyle"
			:class="containerClassName"
		>
			<slot :slots="contextValue.slots" :is-focused="contextValue.isFocused" :is-hovering="contextValue.isHovering" />

			<div
				:style="{
					position: 'absolute',
					inset: '0',
					pointerEvents: 'none',
				}"
			>
				<input
					ref="inputRef"
					v-bind="$attrs"
					data-input-otp
					:data-input-otp-placeholder-shown="value.length === 0 || undefined"
					:data-input-otp-mss="mirrorSelectionStart"
					:data-input-otp-mse="mirrorSelectionEnd"
					:inputmode="inputMode"
					:pattern="regexp?.source"
					:aria-placeholder="placeholder"
					:style="inputStyle"
					:maxlength="maxLength"
					:value="value"
					:autocomplete="($attrs.autocomplete as string | undefined) ?? 'one-time-code'"
					@input="_changeListener"
					@paste="_pasteListener"
					@mouseover="(e: MouseEvent) => { isHoveringInput = true; emit('mouseOver', e); }"
					@mouseleave="(e: MouseEvent) => { isHoveringInput = false; emit('mouseLeave', e); }"
					@focus="_focusListener"
					@blur="(e: FocusEvent) => { isFocused = false; emit('blur', e); }"
				/>
			</div>
		</div>
	</component>
</template>

