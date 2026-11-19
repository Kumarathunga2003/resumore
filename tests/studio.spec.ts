import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
test("sample editing, backup, dashboard and responsive presentation", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Your career story, beautifully crafted.",
    }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/landing.png" });
  await page.getByRole("button", { name: "Try a sample" }).click();
  const paper = page.locator(".page-stage .resume-paper");
  await page.getByLabel("Full name").fill("Morgan Example");
  await expect(paper).toContainText("Morgan Example");
  await page
    .getByRole("button", { name: "Projects", exact: true })
    .click();
  await page.getByRole("button", { name: "Add project card" }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Research intern");
  await page.getByLabel("Role", { exact: true }).fill("Example Lab");
  await page
    .getByRole("textbox", { name: "Your contribution" })
    .fill("Designed a study\nPresented findings");
  await expect(paper.getByRole("listitem")).toHaveCount(2);
  for (const name of ["Education", "Skills", "Projects"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page
      .getByLabel("Content", { exact: true })
      .fill(name + " test content");
    await expect(paper).toContainText(name + " test content");
  }
  await page.getByRole("button", { name: "Add custom section" }).click();
  await page.getByLabel("Section heading").fill("Volunteer work");
  await page
    .getByLabel("Content", { exact: true })
    .fill("Tutored first-year students.");
  await page.getByRole("button", { name: "Move earlier", exact: true }).click();
  await expect(paper.locator(".resume-block h2").last()).toHaveText("Projects");
  await page.getByLabel("Show in resume").uncheck();
  await expect(paper).not.toContainText("Volunteer work");
  await page.getByRole("toolbar").getByRole("button", { name: "Undo", exact: true }).click();
  await expect(paper).toContainText("Volunteer work");
  await page.getByRole("toolbar").getByRole("button", { name: "Redo", exact: true }).click();
  await expect(paper).not.toContainText("Volunteer work");
  await page.getByRole("button", { name: "Design & appearance" }).click();
  await page.getByRole("button", { name: /Creative Mode/ }).click();
  await expect(paper).toHaveClass(/creative/);
  await page.getByLabel("Typeface").selectOption("Georgia");
  await page.getByLabel("Section spacing").selectOption("compact");
  await page.getByLabel("Select #2563eb").click();
  await page.getByLabel("Paper size").selectOption("Letter");
  await page.getByRole("button", { name: /ATS Mode/ }).click();
  await expect(paper).toHaveClass(/ats/);
  await expect(paper).toContainText("Research intern");
  await page.getByLabel("Paper size").selectOption("A4");
  await page.getByRole("button", { name: "Personal details" }).click();
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue("Morgan Example");
  await page.screenshot({ path: "docs/editor.png" });
  {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF" }).click();
    await (await pending).saveAs(info.outputPath("resume.pdf"));
  }
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON backup" }).click();
  const dl = await downloaded;
  const file = info.outputPath("backup.json");
  await dl.saveAs(file);
  await page.getByRole("link", { name: "My resumes" }).click();
  await page.getByRole("button", { name: "Duplicate" }).click();
  await expect(page.locator(".docs > article")).toHaveCount(2);
  page.once("dialog", (d) => d.accept("Graduate application"));
  await page.getByRole("button", { name: "Rename" }).first().click();
  await page.getByLabel("Search resumes").fill("Graduate");
  await expect(page.locator(".docs > article")).toHaveCount(1);
  await page.getByLabel("Search resumes").fill("");
  await page.locator("input[type=file]").setInputFiles(file);
  await expect(page.locator(".docs > article")).toHaveCount(3);
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(page.getByRole("status")).toContainText("valid Resumora");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByLabel("Interface theme").selectOption("dark");
  await page.reload();
  await expect(page.locator(".app")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "New resume" }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("");
  for (const width of [820, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(paper).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(page.getByLabel("Full name")).toBeVisible();
  }
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
    "BODY",
  );
  expect(errors).toEqual([]);
});
test("standalone file opens offline, prints a long Letter document and recovers edits", async ({
  page,
  context,
}, info) => {
  await context.setOffline(true);
  await page.goto("file://" + resolve("Resumora.html"));
  await page.getByRole("button", { name: "Create my resume" }).click();
  await page.getByLabel("Full name").fill("PDF Example");
  await page
    .getByRole("button", { name: "Work Experience", exact: true })
    .click();
  const lines = Array.from(
    { length: 220 },
    (_, i) =>
      "Achievement " +
      String(i + 1).padStart(3, "0") +
      " improved documentation and user onboarding.",
  );
  await page.getByLabel("Content", { exact: true }).fill(lines.join("\n"));
  await page.getByRole("button", { name: "Design & appearance" }).click();
  await page.getByLabel("Paper size").selectOption("Letter");
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue("PDF Example");
  {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF" }).click();
    await (await pending).saveAs(info.outputPath("long.pdf"));
  }
  expect((await readFile(info.outputPath("long.pdf"))).length).toBeGreaterThan(
    1000,
  );
});
