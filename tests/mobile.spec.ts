import { test, expect } from "@playwright/test";

for (const width of [320, 390, 650, 820]) {
  test(`edit and export a CV at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const fits = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const button = (name: string) => page.getByRole("button", { name, exact: true });
    await page.goto("/");
    await fits();
    await expect(page.locator(".siteheader").getByRole("link", {name:"My resumes"})).toHaveCount(0);
    await expect(page.locator(".hero").getByRole("link", {name:"My resumes"})).toBeVisible();
    if (width <= 650) await page.getByRole("link", { name: "Templates", exact: true }).click();
    await page.locator(".template-gallery > button").first().click();
    await page.getByLabel("Full name").fill("Mobile Example");
    await fits();
    if (width <= 650) {
      await button("More tools").click();
      await button("Text font").click();
      await page.getByRole("option", { name: "Liberation Serif" }).click();
      await button("Fewer tools").click();
      await button("Sections").click();
      await button("Back to editor").click();
      await expect(page.getByLabel("Full name")).toHaveValue("Mobile Example");
      await button("Sections").click();
    }
    await button("Education").click();
    await page.getByLabel("Content", {exact:true}).fill("Computer science");
    await button("Preview").click();
    await expect(page.locator(".page-stage")).toContainText("Mobile Example");
    await expect(page.locator(".page-stage")).toContainText("Computer science");
    await button("Increase zoom").click();
    await fits();
    await button("Fit preview to width").click();
    const download = page.waitForEvent("download");
    await button("Download PDF").click();
    await (await download).saveAs(info.outputPath("mobile.pdf"));
    await page.getByRole("link", { name: "My resumes", exact: true }).click();
    await expect(page.locator(".docs article")).toHaveCount(1);
    await fits();
    expect(errors).toEqual([]);
  });
}
