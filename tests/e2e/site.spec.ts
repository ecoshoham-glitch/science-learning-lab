import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoSeriousA11yIssues(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test.describe("navigation and languages", () => {
  test("root redirects to Hebrew, right-to-left", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/he$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("לראות את המדע קורה");
  });

  test("language switch keeps the page and flips direction", async ({ page }) => {
    await page.goto("/he/library");
    await page.getByRole("link", { name: "Switch to English" }).click();
    await expect(page).toHaveURL(/\/en\/library$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simulation library");
  });

  test("main navigation reaches the library and teachers pages", async ({ page }) => {
    await page.goto("/he");
    await page.getByRole("navigation").getByRole("link", { name: "ספריית סימולציות" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ספריית הסימולציות");
    await page.getByRole("navigation").getByRole("link", { name: "למורים" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("למורים");
  });

  test("pages have no serious accessibility violations", async ({ page }) => {
    for (const path of ["/he", "/en", "/he/library", "/he/teachers"]) {
      await page.goto(path);
      await expectNoSeriousA11yIssues(page);
    }
  });
});

test.describe("simulation library", () => {
  test("search in Hebrew and filter by interaction type", async ({ page }) => {
    await page.goto("/he/library");
    await expect(page.getByRole("status")).toHaveText("5 סימולציות");
    await page.getByLabel("חיפוש").fill("מוטציה");
    await expect(page.getByRole("status")).toHaveText("סימולציה אחת");
    await expect(page.getByRole("heading", { name: "מהגן אל החלבון" })).toBeVisible();

    await page.getByRole("button", { name: "נקה סינון" }).click();
    await page.getByLabel("סוג אינטראקציה").selectOption("virtual-lab");
    await expect(page.getByRole("heading", { name: "מעבדת אנזים וירטואלית" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "המיקרוסקופ של ליווינהוק" })).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("2 סימולציות");
  });

  test("Hebrew interface also finds English terms", async ({ page }) => {
    await page.goto("/he/library");
    await page.getByLabel("חיפוש").fill("ribosome");
    await expect(page.getByRole("heading", { name: "בתוך הריבוזום" })).toBeVisible();
  });

  test("empty results explain what to do", async ({ page }) => {
    await page.goto("/en/library");
    await page.getByLabel("Search").fill("zzzz");
    await expect(page.getByText("No simulations match.")).toBeVisible();
  });
});
