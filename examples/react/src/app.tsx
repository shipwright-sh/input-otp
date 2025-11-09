import { OTPInput, type SlotProps } from "input-otp";

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
					<div className="flex">
						{slots.map((slot, idx) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: testing
								key={idx}
								className={cn(
									"relative w-10 h-14 text-[2rem]",
									"flex items-center justify-center",
									"transition-all duration-300",
									"border-border border-y border-r first:border-l first:rounded-l-md last:rounded-r-md",
									"group-hover:border-accent-foreground/20 group-focus-within:border-accent-foreground/20",
								)}
								data-testid={`input-otp-${idx}`}
								data-test-char={slot.char ?? slot.placeholderChar}
							>
								<div className="group-has-[input[data-input-otp-placeholder-shown]]:opacity-20">
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
