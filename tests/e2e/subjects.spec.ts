import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("biology subject: topic folders hold their lessons and simulations", async ({ page }) => {
  await page.goto("/he");
  await page.getByRole("navigation").getByRole("link", { name: "נושאים" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("נושאים");
  await expect(page.getByText("בקרוב").first()).toBeVisible(); // subjects without content yet
  await page.getByRole("link", { name: "ביולוגיה" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ביולוגיה");

  const viruses = page.getByRole("region", { name: "נגיפים ומערכת החיסון" });
  await expect(viruses.getByRole("link", { name: /נגיפים: מה הם/ })).toBeVisible();
  const enzymes = page.getByRole("region", { name: "אנזימים וחקר" });
  await expect(enzymes.getByRole("heading", { name: "מעבדת אנזים וירטואלית" })).toBeVisible();
  const cell = page.getByRole("region", { name: "התא, הקוד הגנטי וסינתזת חלבונים" });
  await expect(cell.getByRole("heading", { name: "מהגן אל החלבון" })).toBeVisible();
  await expect(cell.getByRole("heading", { name: "בתוך הריבוזום" })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => v.id)).toEqual([]);
});
