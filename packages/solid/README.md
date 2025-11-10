<a href="https://www.shipwright.sh">
    <img src="https://www.shipwright.sh/banner.png" alt="Shipwright" />
</a>

# Input OTP for SolidJS

An accessible, unstyled, full-featured OTP input component for SolidJS.

This is a Solid port of the original [input-otp](https://github.com/guilhermerodz/input-otp) library by [@guilhermerodz](https://twitter.com/guilherme_rodz).

## Installation

```bash
npm install @shipwright-sh/input-otp-solid
```

## Usage

```tsx
import { OTPInput } from '@shipwright-sh/input-otp-solid'

function MyForm() {
  return (
    <form>
      <OTPInput maxLength={6} render={({ slots }) => (
        <div class="flex">
          {slots.map((slot, idx) => (
            <div>{slot.char}</div>
          ))}
        </div>
      )} />
    </form>
  )
}
```

## Basic Example

The example below uses Tailwind CSS:

```tsx
import { OTPInput, type SlotProps } from '@shipwright-sh/input-otp-solid'

function App() {
  return (
    <OTPInput
      maxLength={6}
      containerClassName="group flex items-center has-[:disabled]:opacity-30"
      render={({ slots }) => (
        <>
          <div class="flex">
            {slots.slice(0, 3).map((slot, idx) => (
              <Slot {...slot} />
            ))}
          </div>

          <FakeDash />

          <div class="flex">
            {slots.slice(3).map((slot, idx) => (
              <Slot {...slot} />
            ))}
          </div>
        </>
      )}
    />
  )
}

// Feel free to copy. Uses @shadcn/ui tailwind colors.
function Slot(props: SlotProps) {
  return (
    <div
      class={cn(
        'relative w-10 h-14 text-[2rem]',
        'flex items-center justify-center',
        'transition-all duration-300',
        'border-border border-y border-r first:border-l first:rounded-l-md last:rounded-r-md',
        'group-hover:border-accent-foreground/20 group-focus-within:border-accent-foreground/20',
        'outline outline-0 outline-accent-foreground/20',
        props.isActive && 'outline-4 outline-accent-foreground',
      )}
    >
      <div class="group-has-[input[data-input-otp-placeholder-shown]]:opacity-20">
        {props.char ?? props.placeholderChar}
      </div>
      {props.hasFakeCaret && <FakeCaret />}
    </div>
  )
}

// You can emulate a fake textbox caret!
function FakeCaret() {
  return (
    <div class="absolute pointer-events-none inset-0 flex items-center justify-center animate-caret-blink">
      <div class="w-px h-8 bg-white" />
    </div>
  )
}

// Inspired by Stripe's MFA input.
function FakeDash() {
  return (
    <div class="flex w-10 justify-center items-center">
      <div class="w-3 h-1 rounded-full bg-border" />
    </div>
  )
}

// Small utility to merge class names.
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
```

## API Reference

### OTPInput

The root container component. Define settings for the input via props. Then, use the `render` prop to create the slots.

#### Props

```ts
type OTPInputProps = {
  // The number of slots
  maxLength: number

  // Render function creating the slots
  render: (props: RenderProps) => JSX.Element
  // PS: Render prop is mandatory, except in cases
  // you'd like to consume the original Context API.
  // (search for Context in this docs)

  // The class name for the root container
  containerClassName?: string

  // Value state controlling the input
  value?: string
  // Setter for the controlled value (or callback for uncontrolled value)
  onChange?: (newValue: string) => void

  // Callback when the input is complete
  onComplete?: (value: string) => void

  // Where is the text located within the input
  // Affects click-holding or long-press behavior
  // Default: 'left'
  textAlign?: 'left' | 'center' | 'right'

  // Virtual keyboard appearance on mobile
  // Default: 'numeric'
  inputMode?: 'numeric' | 'text' | 'decimal' | 'tel' | 'search' | 'email' | 'url'

  // Pro tip: input-otp exports some patterns by default such as REGEXP_ONLY_DIGITS
  // Example: import { REGEXP_ONLY_DIGITS } from '@shipwright-sh/input-otp-solid';
  // Then use it as: <OTPInput pattern={REGEXP_ONLY_DIGITS} />
  pattern?: string | RegExp

  // While rendering the input slot, you can access both the char and the placeholder
  placeholder?: string

  // Transformer function that allows pasting, for example, "XXX-XXX" even though 
  // the input's regex/pattern doesn't allow hyphen and its max length is 6.
  // Example: (pasted) => pasted.replaceAll('-', '')
  pasteTransformer?: (pastedText: string) => string

  // Enabled by default, it's an optional
  // strategy for detecting Password Managers
  // in the page and then shifting their
  // badges to the right side, outside the input.
  pushPasswordManagerStrategy?: 'increase-width' | 'none'

  // Enabled by default, it's an optional
  // fallback for pages without JS.
  noScriptCSSFallback?: string | null
}
```

### RenderProps

The props passed to the `render` function:

```ts
type RenderProps = {
  slots: SlotProps[]
  isFocused: boolean
  isHovering: boolean
}

type SlotProps = {
  char: string | null
  placeholderChar: string | null
  isActive: boolean
  hasFakeCaret: boolean
}
```

## Examples

### Automatic form submission on OTP completion

```tsx
function Page() {
  let formRef: HTMLFormElement | undefined
  let buttonRef: HTMLButtonElement | undefined

  return (
    <form ref={formRef}>
      <OTPInput
        maxLength={6}
        // ... automatically submit the form
        onComplete={() => formRef?.submit()}
        // ... or focus the button as you wish
        onComplete={() => buttonRef?.focus()}
        render={({ slots }) => (
          <div class="flex">
            {slots.map((slot) => <div>{slot.char}</div>)}
          </div>
        )}
      />

      <button ref={buttonRef}>Submit</button>
    </form>
  )
}
```

### Automatically focus the input when the page loads

```tsx
function Page() {
  return (
    <OTPInput
      autofocus
      maxLength={6}
      render={({ slots }) => (
        <div class="flex">
          {slots.map((slot) => <div>{slot.char}</div>)}
        </div>
      )}
    />
  )
}
```

### Using with controlled state

```tsx
import { createSignal } from 'solid-js'
import { OTPInput } from '@shipwright-sh/input-otp-solid'

function Page() {
  const [otp, setOtp] = createSignal('')

  return (
    <OTPInput
      maxLength={6}
      value={otp()}
      onChange={setOtp}
      render={({ slots }) => (
        <div class="flex">
          {slots.map((slot) => <div>{slot.char}</div>)}
        </div>
      )}
    />
  )
}
```

### Paste transformers

If you want to allow pasting of "XXX-XXX" even though the input's regex/pattern doesn't allow hyphen and its max length is 6:

```tsx
<OTPInput
  maxLength={6}
  pasteTransformer={(pasted) => pasted.replaceAll('-', '')}
  render={({ slots }) => (
    <div class="flex">
      {slots.map((slot) => <div>{slot.char}</div>)}
    </div>
  )}
/>
```

## Features

This component inherits all features from the original input-otp library:

- ✅ Supports iOS + Android copy-paste-cut
- ✅ Automatic OTP code retrieval from transport (e.g., SMS)
- ✅ Supports screen readers (a11y)
- ✅ Supports all keybindings
- ✅ Automatically optimizes for password managers
- ✅ Works without JavaScript (progressive enhancement)

## How it works

There's currently no native OTP/2FA/MFA input in HTML. This library works by rendering an invisible input as a sibling of the slots, contained by a relatively positioned parent. This approach ensures:

- Full accessibility (screen readers work properly)
- Native input behavior (copy/paste, keyboard shortcuts, etc.)
- Complete styling freedom (you control the appearance)

## Original Library

This is a port of the original React library [input-otp](https://github.com/guilhermerodz/input-otp) by [@guilhermerodz](https://twitter.com/guilherme_rodz).

For more detailed documentation, examples, and advanced usage, please refer to the [original library's documentation](https://github.com/guilhermerodz/input-otp#readme).

## License

MIT

