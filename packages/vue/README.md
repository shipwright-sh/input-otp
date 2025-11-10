<a href="https://www.shipwright.sh">
    <img src="https://www.shipwright.sh/banner.png" alt="Shipwright" />
</a>

# Input OTP for Vue

An accessible, unstyled, full-featured OTP input component for Vue 3.

This is a Vue port of the original [input-otp](https://github.com/guilhermerodz/input-otp) library by [@guilhermerodz](https://twitter.com/guilherme_rodz).

## Installation

```bash
npm install @shipwright-sh/input-otp-vue
```

## Usage

```vue
<script setup lang="ts">
import { OTPInput } from '@shipwright-sh/input-otp-vue'
</script>

<template>
  <form>
    <OTPInput :max-length="6">
      <template #default="{ slots }">
        <div class="flex">
          <div v-for="(slot, idx) in slots" :key="idx">
            {{ slot.char }}
          </div>
        </div>
      </template>
    </OTPInput>
  </form>
</template>
```

## Basic Example

The example below uses Tailwind CSS:

```vue
<script setup lang="ts">
import { OTPInput, type SlotProps } from '@shipwright-sh/input-otp-vue'

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
</script>

<template>
  <OTPInput
    :max-length="6"
    container-class-name="group flex items-center has-[:disabled]:opacity-30"
  >
    <template #default="{ slots }">
      <div class="flex">
        <Slot 
          v-for="(slot, idx) in slots.slice(0, 3)" 
          :key="idx"
          v-bind="slot"
        />
      </div>

      <FakeDash />

      <div class="flex">
        <Slot 
          v-for="(slot, idx) in slots.slice(3)" 
          :key="idx + 3"
          v-bind="slot"
        />
      </div>
    </template>
  </OTPInput>
</template>

<!-- Feel free to copy. Uses @shadcn/ui tailwind colors. -->
<script setup lang="ts">
import type { SlotProps } from '@shipwright-sh/input-otp-vue'

const Slot = defineComponent({
  props: {
    char: String as PropType<string | null>,
    placeholderChar: String as PropType<string | null>,
    isActive: Boolean,
    hasFakeCaret: Boolean,
  },
  template: `
    <div
      :class="cn(
        'relative w-10 h-14 text-[2rem]',
        'flex items-center justify-center',
        'transition-all duration-300',
        'border-border border-y border-r first:border-l first:rounded-l-md last:rounded-r-md',
        'group-hover:border-accent-foreground/20 group-focus-within:border-accent-foreground/20',
        'outline outline-0 outline-accent-foreground/20',
        isActive && 'outline-4 outline-accent-foreground',
      )"
    >
      <div class="group-has-[input[data-input-otp-placeholder-shown]]:opacity-20">
        {{ char ?? placeholderChar }}
      </div>
      <FakeCaret v-if="hasFakeCaret" />
    </div>
  `
})

// You can emulate a fake textbox caret!
const FakeCaret = defineComponent({
  template: `
    <div class="absolute pointer-events-none inset-0 flex items-center justify-center animate-caret-blink">
      <div class="w-px h-8 bg-white" />
    </div>
  `
})

// Inspired by Stripe's MFA input.
const FakeDash = defineComponent({
  template: `
    <div class="flex w-10 justify-center items-center">
      <div class="w-3 h-1 rounded-full bg-border" />
    </div>
  `
})
</script>
```

## API Reference

### OTPInput

The root container component. Define settings for the input via props. Then, use the default scoped slot to create the slots.

#### Props

```ts
type OTPInputProps = {
  // The number of slots
  maxLength: number

  // The class name for the root container
  containerClassName?: string

  // Value state controlling the input
  value?: string
  // Setter for the controlled value (or callback for uncontrolled value)
  // Use v-model:value or @update:value
  'onUpdate:value'?: (newValue: string) => void

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
  // Example: import { REGEXP_ONLY_DIGITS } from '@shipwright-sh/input-otp-vue';
  // Then use it as: <OTPInput :pattern="REGEXP_ONLY_DIGITS" />
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

  // Standard input attributes
  disabled?: boolean
  autocomplete?: string
  name?: string
  id?: string
  // ... other HTML input attributes
}
```

### Slot Props

The default scoped slot receives the following props:

```ts
type SlotProps = {
  slots: Array<{
    char: string | null
    placeholderChar: string | null
    isActive: boolean
    hasFakeCaret: boolean
  }>
  isFocused: boolean
  isHovering: boolean
}
```

## Examples

### Automatic form submission on OTP completion

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { OTPInput } from '@shipwright-sh/input-otp-vue'

const formRef = ref<HTMLFormElement>()
const buttonRef = ref<HTMLButtonElement>()

function handleComplete() {
  // ... automatically submit the form
  formRef.value?.submit()
  // ... or focus the button as you wish
  // buttonRef.value?.focus()
}
</script>

<template>
  <form ref="formRef">
    <OTPInput
      :max-length="6"
      @complete="handleComplete"
    >
      <template #default="{ slots }">
        <div class="flex">
          <div v-for="(slot, idx) in slots" :key="idx">
            {{ slot.char }}
          </div>
        </div>
      </template>
    </OTPInput>

    <button ref="buttonRef">Submit</button>
  </form>
</template>
```

### Automatically focus the input when the page loads

```vue
<script setup lang="ts">
import { OTPInput } from '@shipwright-sh/input-otp-vue'
</script>

<template>
  <OTPInput
    autofocus
    :max-length="6"
  >
    <template #default="{ slots }">
      <div class="flex">
        <div v-for="(slot, idx) in slots" :key="idx">
          {{ slot.char }}
        </div>
      </div>
    </template>
  </OTPInput>
</template>
```

### Using with v-model

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { OTPInput } from '@shipwright-sh/input-otp-vue'

const otp = ref('')
</script>

<template>
  <OTPInput
    :max-length="6"
    v-model:value="otp"
  >
    <template #default="{ slots }">
      <div class="flex">
        <div v-for="(slot, idx) in slots" :key="idx">
          {{ slot.char }}
        </div>
      </div>
    </template>
  </OTPInput>
  
  <p>Current value: {{ otp }}</p>
</template>
```

### Paste transformers

If you want to allow pasting of "XXX-XXX" even though the input's regex/pattern doesn't allow hyphen and its max length is 6:

```vue
<script setup lang="ts">
import { OTPInput } from '@shipwright-sh/input-otp-vue'

function pasteTransformer(pasted: string) {
  return pasted.replaceAll('-', '')
}
</script>

<template>
  <OTPInput
    :max-length="6"
    :paste-transformer="pasteTransformer"
  >
    <template #default="{ slots }">
      <div class="flex">
        <div v-for="(slot, idx) in slots" :key="idx">
          {{ slot.char }}
        </div>
      </div>
    </template>
  </OTPInput>
</template>
```

### Using the Context API

If you prefer not to use the scoped slot pattern, you can access the OTP input context using the `useOTPInput` composable:

```vue
<script setup lang="ts">
import { OTPInput, useOTPInput } from '@shipwright-sh/input-otp-vue'
</script>

<template>
  <OTPInput :max-length="6">
    <CustomSlots />
  </OTPInput>
</template>

<!-- CustomSlots.vue -->
<script setup lang="ts">
import { useOTPInput } from '@shipwright-sh/input-otp-vue'

const context = useOTPInput()
</script>

<template>
  <div class="flex">
    <div v-for="(slot, idx) in context.slots" :key="idx">
      {{ slot.char }}
    </div>
  </div>
</template>
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

