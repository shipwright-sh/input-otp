import { OTPInput } from "@shipwright-sh/input-otp-solid";

function cn(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}

export function App() {
	return (
		<OTPInput
			maxLength={6}
			containerClassName="group flex items-center has-[:disabled]:opacity-30"
			render={({ slots }) => (
				<>
					<div class="flex">
						{slots.map((slot, idx) => (
							<div
								class={cn(
									"relative w-10 h-14 text-[2rem]",
									"flex items-center justify-center",
									"transition-all duration-300",
									"border-border border-y border-r first:border-l first:rounded-l-md last:rounded-r-md",
									"group-hover:border-accent-foreground/20 group-focus-within:border-accent-foreground/20",
								)}
								data-testid={`input-otp-${idx}`}
								data-test-char={slot.char ?? slot.placeholderChar}
							>
								<div class="group-has-[input[data-input-otp-placeholder-shown]]:opacity-20">
									{slot.char ?? slot.placeholderChar}
								</div>
							</div>
						))}
					</div>
				</>
			)}
		/>
	);
}
