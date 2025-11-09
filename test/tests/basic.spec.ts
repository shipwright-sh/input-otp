import { expect, test } from "@playwright/test";

[3000, 3002].forEach(async (port) => {
	test(`(${port}) expect basic typing to work`, async ({ page }) => {
		await page.goto(`http://localhost:${port}`);

		const input = page.getByRole("textbox");

		await input.pressSequentially("123456");
		await expect(input).toHaveValue("123456");

		await expect(page.getByTestId("input-otp-0")).toHaveAttribute(
			"data-test-char",
			"1",
		);
		await expect(page.getByTestId("input-otp-1")).toHaveAttribute(
			"data-test-char",
			"2",
		);
		await expect(page.getByTestId("input-otp-2")).toHaveAttribute(
			"data-test-char",
			"3",
		);
		await expect(page.getByTestId("input-otp-3")).toHaveAttribute(
			"data-test-char",
			"4",
		);
		await expect(page.getByTestId("input-otp-4")).toHaveAttribute(
			"data-test-char",
			"5",
		);
		await expect(page.getByTestId("input-otp-5")).toHaveAttribute(
			"data-test-char",
			"6",
		);
	});
});
