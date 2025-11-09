import { expect, test } from "@playwright/test";

[3000, 3001, 3002].forEach(async (port) => {
	test(`Example - counter and fooBar on port ${port}`, async ({ page }) => {
		await page.goto(`http://localhost:${port}`);
		// await expect(page).toHaveTitle(/React Example/);
		await expect(page.getByText("Count: 0")).toBeVisible();
		await page.getByRole("button", { name: "Increment" }).click();
		await expect(page.getByText("Count: 1")).toBeVisible();
	});
});
