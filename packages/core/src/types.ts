export type SlotProps = {
	isActive: boolean;
	char: string | null;
	placeholderChar: string | null;
	hasFakeCaret: boolean;
};

export type RenderProps = {
	slots: SlotProps[];
	isFocused: boolean;
	isHovering: boolean;
};
