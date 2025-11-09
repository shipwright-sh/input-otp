export interface SlotProps {
	isActive: boolean;
	char: string | null;
	placeholderChar: string | null;
	hasFakeCaret: boolean;
}

export interface RenderProps {
	slots: SlotProps[];
	isFocused: boolean;
	isHovering: boolean;
}
