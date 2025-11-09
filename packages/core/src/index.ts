export function fooBar(value: number) {
	if (value % 3 === 0 && value % 5 === 0) {
		return "foobar";
	}
	if (value % 3 === 0) {
		return "foo";
	}
	if (value % 5 === 0) {
		return "bar";
	}
	return value.toString();
}
