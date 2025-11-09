import {
	type RenderProps,
	type SlotProps,
	syncTimeouts,
} from "@shipwright-sh/package-core";
import {
	type Accessor,
	createContext,
	createEffect,
	createMemo,
	createSignal,
	type JSX,
	onCleanup,
	onMount,
	splitProps,
	useContext,
} from "solid-js";

export interface OTPInputProps
	extends Omit<
		JSX.InputHTMLAttributes<HTMLInputElement>,
		"children" | "pattern" | "onChange"
	> {
	value?: string;
	onChange?: (newValue: string) => void;
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
	render?: (props: RenderProps) => JSX.Element;
	children?: JSX.Element;
}

const OTPInputContext = createContext<Accessor<RenderProps>>(
	() => ({}) as RenderProps,
);

export function OTPInput(props: OTPInputProps) {
	const [local, inputProps] = splitProps(props, [
		"value",
		"onChange",
		"maxLength",
		"textAlign",
		"pattern",
		"placeholder",
		"inputMode",
		"onComplete",
		"pushPasswordManagerStrategy",
		"pasteTransformer",
		"containerClassName",
		"noScriptCSSFallback",
		"render",
		"children",
		"ref",
	]);

	// Internal state for uncontrolled mode
	const [internalValue, setInternalValue] = createSignal("");

	// Value management
	const value = () => local.value ?? internalValue();
	const previousValue = createPrevious(value);

	const onChange = (newValue: string) => {
		local.onChange?.(newValue);
		setInternalValue(newValue);
	};

	// Pattern/regexp
	const regexp = createMemo(() => {
		const pattern = local.pattern;
		if (!pattern) return null;
		return typeof pattern === "string" ? new RegExp(pattern) : pattern;
	});

	// Refs
	let inputRef: HTMLInputElement | undefined;
	let containerRef: HTMLDivElement | undefined;

	// Initial load data
	const initialLoadRef = {
		value: value(),
		onChange,
		isIOS:
			typeof window !== "undefined" &&
			window?.CSS?.supports?.("-webkit-touch-callout", "none"),
	};

	const inputMetadataRef: {
		prev: [
			number | null,
			number | null,
			"none" | "forward" | "backward" | null,
		];
	} = {
		prev: [null, null, null],
	};

	// Mirror state for UI rendering
	const [isHoveringInput, setIsHoveringInput] = createSignal(false);
	const [isFocused, setIsFocused] = createSignal(false);
	const [mirrorSelectionStart, setMirrorSelectionStart] = createSignal<
		number | null
	>(null);
	const [mirrorSelectionEnd, setMirrorSelectionEnd] = createSignal<
		number | null
	>(null);

	// Password manager badge detection
	const [hasPWMBadge, setHasPWMBadge] = createSignal(false);
	const [hasPWMBadgeSpace, setHasPWMBadgeSpace] = createSignal(false);
	const [pwmDone, setPwmDone] = createSignal(false);

	const PWM_BADGE_SPACE_WIDTH_PX = 40;
	const PWM_BADGE_SPACE_WIDTH = `${PWM_BADGE_SPACE_WIDTH_PX}px` as const;
	const PWM_BADGE_MARGIN_RIGHT = 18;

	const PASSWORD_MANAGERS_SELECTORS = [
		"[data-lastpass-icon-root]", // LastPass
		"com-1password-button", // 1Password
		"[data-dashlanecreated]", // Dashlane
		'[style$="2147483647 !important;"]', // Bitwarden
	].join(",");

	const willPushPWMBadge = createMemo(() => {
		const strategy = local.pushPasswordManagerStrategy ?? "increase-width";
		if (strategy === "none") return false;
		return strategy === "increase-width" && hasPWMBadge() && hasPWMBadgeSpace();
	});

	// Mount effect for DOM initialization
	onMount(() => {
		const input = inputRef;
		const container = containerRef;

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
				setMirrorSelectionStart(null);
				setMirrorSelectionEnd(null);
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
			setMirrorSelectionStart(s);
			setMirrorSelectionEnd(e);
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
			setIsFocused(true);
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

		onCleanup(() => {
			document.removeEventListener(
				"selectionchange",
				onDocumentSelectionChange,
				{ capture: true },
			);
			resizeObserver.disconnect();
		});
	});

	// Effect for value changes and focus
	createEffect(() => {
		// Track these for reactivity
		value();
		isFocused();

		syncTimeouts(() => {
			if (!inputRef) return;
			// Forcefully remove :autofill state
			inputRef.dispatchEvent(new Event("input"));

			// Update the selection state
			const s = inputRef.selectionStart;
			const e = inputRef.selectionEnd;
			const dir = inputRef.selectionDirection;
			if (s !== null && e !== null) {
				setMirrorSelectionStart(s);
				setMirrorSelectionEnd(e);
				inputMetadataRef.prev = [
					s,
					e,
					dir as "none" | "forward" | "backward" | null,
				];
			}
		});
	});

	// Effect for onComplete
	createEffect(() => {
		const currentValue = value();
		const prevValue = previousValue();

		if (prevValue === undefined) return;

		if (
			currentValue !== prevValue &&
			prevValue.length < local.maxLength &&
			currentValue.length === local.maxLength
		) {
			local.onComplete?.(currentValue);
		}
	});

	// Password manager badge tracking
	createEffect(() => {
		const container = containerRef;
		const strategy = local.pushPasswordManagerStrategy ?? "increase-width";

		if (!container || strategy === "none") return;

		// Check if the PWM area is 100% visible
		function checkHasSpace() {
			if (!container) return;
			const viewportWidth = window.innerWidth;
			const distanceToRightEdge =
				viewportWidth - container.getBoundingClientRect().right;
			setHasPWMBadgeSpace(distanceToRightEdge >= PWM_BADGE_SPACE_WIDTH_PX);
		}

		checkHasSpace();
		const interval = setInterval(checkHasSpace, 1000);

		onCleanup(() => clearInterval(interval));
	});

	createEffect(() => {
		const focused = isFocused();
		const strategy = local.pushPasswordManagerStrategy ?? "increase-width";

		if (strategy === "none" || !focused) return;

		const trackPWMBadge = () => {
			const container = containerRef;
			const input = inputRef;

			if (!container || !input || pwmDone()) return;

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

			setHasPWMBadge(true);
			setPwmDone(true);
		};

		const t1 = setTimeout(trackPWMBadge, 0);
		const t2 = setTimeout(trackPWMBadge, 2000);
		const t3 = setTimeout(trackPWMBadge, 5000);
		const t4 = setTimeout(() => {
			setPwmDone(true);
		}, 6000);

		onCleanup(() => {
			clearTimeout(t1);
			clearTimeout(t2);
			clearTimeout(t3);
			clearTimeout(t4);
		});
	});

	// Event handlers
	const _changeListener = (
		e: InputEvent & { currentTarget: HTMLInputElement },
	) => {
		const newValue = e.currentTarget.value.slice(0, local.maxLength);
		const currentRegexp = regexp();
		if (newValue.length > 0 && currentRegexp && !currentRegexp.test(newValue)) {
			e.preventDefault();
			return;
		}

		const prevValue = previousValue();
		const maybeHasDeleted =
			typeof prevValue === "string" && newValue.length < prevValue.length;

		if (maybeHasDeleted) {
			document.dispatchEvent(new Event("selectionchange"));
		}

		onChange(newValue);
	};

	const _focusListener = () => {
		if (inputRef) {
			const start = Math.min(inputRef.value.length, local.maxLength - 1);
			const end = inputRef.value.length;
			inputRef.setSelectionRange(start, end);
			setMirrorSelectionStart(start);
			setMirrorSelectionEnd(end);
		}
		setIsFocused(true);
	};

	const _pasteListener = (e: ClipboardEvent) => {
		const input = inputRef;
		if (
			!local.pasteTransformer &&
			(!initialLoadRef.isIOS || !e.clipboardData || !input)
		) {
			return;
		}

		const _content = e.clipboardData?.getData("text/plain") ?? "";
		const content = local.pasteTransformer
			? local.pasteTransformer(_content)
			: _content;
		e.preventDefault();

		const start = input?.selectionStart ?? 0;
		const end = input?.selectionEnd ?? 0;

		const isReplacing = start !== end;

		const currentValue = value();
		const newValueUncapped = isReplacing
			? currentValue.slice(0, start) + content + currentValue.slice(end)
			: currentValue.slice(0, start) + content + currentValue.slice(start);
		const newValue = newValueUncapped.slice(0, local.maxLength);

		const currentRegexp = regexp();
		if (newValue.length > 0 && currentRegexp && !currentRegexp.test(newValue)) {
			return;
		}

		if (input) {
			input.value = newValue;
			onChange(newValue);

			const _start = Math.min(newValue.length, local.maxLength - 1);
			const _end = newValue.length;

			input.setSelectionRange(_start, _end);
			setMirrorSelectionStart(_start);
			setMirrorSelectionEnd(_end);
		}
	};

	// Styles
	const rootStyle = createMemo<JSX.CSSProperties>(() => ({
		position: "relative",
		cursor: inputProps.disabled ? "default" : "text",
		"user-select": "none",
		"-webkit-user-select": "none",
		"pointer-events": "none",
	}));

	const inputStyle = createMemo<JSX.CSSProperties>(() => ({
		position: "absolute",
		inset: "0",
		width: willPushPWMBadge()
			? `calc(100% + ${PWM_BADGE_SPACE_WIDTH})`
			: "100%",
		"clip-path": willPushPWMBadge()
			? `inset(0 ${PWM_BADGE_SPACE_WIDTH} 0 0)`
			: undefined,
		height: "100%",
		display: "flex",
		"text-align": local.textAlign ?? "left",
		opacity: "1",
		color: "transparent",
		"pointer-events": "all",
		background: "transparent",
		"caret-color": "transparent",
		border: "0 solid transparent",
		outline: "0 solid transparent",
		"box-shadow": "none",
		"line-height": "1",
		"letter-spacing": "-.5em",
		"font-size": "var(--root-height)",
		"font-family": "monospace",
		"font-variant-numeric": "tabular-nums",
	}));

	// Context value
	const contextValue = createMemo<RenderProps>(() => {
		const currentValue = value();
		const focused = isFocused();
		const hovering = isHoveringInput();
		const mss = mirrorSelectionStart();
		const mse = mirrorSelectionEnd();

		return {
			slots: Array.from({ length: local.maxLength }).map((_, slotIdx) => {
				const isActive =
					focused &&
					mss !== null &&
					mse !== null &&
					((mss === mse && slotIdx === mss) ||
						(slotIdx >= mss && slotIdx < mse));

				const char =
					currentValue[slotIdx] !== undefined ? currentValue[slotIdx] : null;
				const placeholderChar =
					currentValue[0] !== undefined
						? null
						: (local.placeholder?.[slotIdx] ?? null);

				return {
					char,
					placeholderChar,
					isActive,
					hasFakeCaret: isActive && char === null,
				} satisfies SlotProps;
			}),
			isFocused: focused,
			isHovering: !inputProps.disabled && hovering,
		};
	});

	// Rendered input element
	const renderedInput = () => (
		<input
			{...inputProps}
			ref={(el) => {
				inputRef = el;
				if (typeof local.ref === "function") {
					local.ref(el);
				}
			}}
			autocomplete={inputProps.autocomplete ?? "one-time-code"}
			data-input-otp
			data-input-otp-placeholder-shown={value().length === 0 || undefined}
			data-input-otp-mss={mirrorSelectionStart()}
			data-input-otp-mse={mirrorSelectionEnd()}
			inputMode={local.inputMode ?? "numeric"}
			pattern={regexp()?.source}
			aria-placeholder={local.placeholder}
			style={inputStyle()}
			maxLength={local.maxLength}
			value={value()}
			onPaste={(e) => {
				_pasteListener(e);
				if (typeof inputProps.onPaste === "function") {
					inputProps.onPaste(e);
				}
			}}
			onInput={(e) => {
				_changeListener(e);
				if (typeof inputProps.onInput === "function") {
					inputProps.onInput(e);
				}
			}}
			onMouseOver={(e) => {
				setIsHoveringInput(true);
				if (typeof inputProps.onMouseOver === "function") {
					inputProps.onMouseOver(e);
				}
			}}
			onMouseLeave={(e) => {
				setIsHoveringInput(false);
				if (typeof inputProps.onMouseLeave === "function") {
					inputProps.onMouseLeave(e);
				}
			}}
			onFocus={(e) => {
				_focusListener();
				if (typeof inputProps.onFocus === "function") {
					inputProps.onFocus(e);
				}
			}}
			onBlur={(e) => {
				setIsFocused(false);
				if (typeof inputProps.onBlur === "function") {
					inputProps.onBlur(e);
				}
			}}
		/>
	);

	// Rendered children
	const renderedChildren = () => {
		if (local.render) {
			return local.render(contextValue());
		}
		return (
			<OTPInputContext.Provider value={contextValue}>
				{local.children}
			</OTPInputContext.Provider>
		);
	};

	const noScriptFallback =
		local.noScriptCSSFallback !== undefined
			? local.noScriptCSSFallback
			: NOSCRIPT_CSS_FALLBACK;

	return (
		<>
			{noScriptFallback !== null && (
				<noscript>
					<style innerHTML={noScriptFallback} />
				</noscript>
			)}

			<div
				ref={(el) => {
					containerRef = el;
				}}
				data-input-otp-container
				style={rootStyle()}
				class={local.containerClassName}
			>
				{renderedChildren()}

				<div
					style={{
						position: "absolute",
						inset: "0",
						"pointer-events": "none",
					}}
				>
					{renderedInput()}
				</div>
			</div>
		</>
	);
}

export function useOTPInputContext() {
	return useContext(OTPInputContext);
}

function createPrevious<T>(value: Accessor<T>): Accessor<T | undefined> {
	const [previous, setPrevious] = createSignal<T | undefined>(undefined);

	createEffect(() => {
		setPrevious(() => value());
	});

	return previous;
}

function safeInsertRule(sheet: CSSStyleSheet, rule: string) {
	try {
		sheet.insertRule(rule);
	} catch {
		console.error("input-otp could not insert CSS rule:", rule);
	}
}

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
