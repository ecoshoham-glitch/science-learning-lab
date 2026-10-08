import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function axeSerious(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test.describe("topic maps", () => {
  test("every Biology topic starts with its flowchart, with arrows drawn", async ({ page }) => {
    await page.goto("/he/subjects/biology");
    for (const [region, topic] of [
      ["התא – יחידת החיים", "the-cell"],
      ["התא, הקוד הגנטי וסינתזת חלבונים", "cell-and-proteins"],
      ["אנזימים וחקר", "enzymes"],
      ["נגיפים ומערכת החיסון", "viruses-immunity"],
    ]) {
      const section = page.getByRole("region", { name: region });
      await expect(section.getByRole("heading", { name: "מפת הנושא" })).toBeVisible();
      await expect(section.getByTestId(`map-${topic}`).locator("svg path[marker-end]").first()).toBeAttached();
    }
    // The map comes before the topic's lessons and simulations.
    const cell = page.getByRole("region", { name: "התא – יחידת החיים" });
    const mapBox = await cell.getByTestId("map-the-cell").boundingBox();
    const lessonBox = await cell.getByRole("link", { name: /גילוי התא/ }).first().boundingBox();
    expect(mapBox!.y).toBeLessThan(lessonBox!.y);
    await expect(cell.getByTestId("map-the-cell").locator("svg path[marker-end]")).toHaveCount(9);
  });

  test("hovering an idea expands it; leaving closes it; clicking keeps it open; Escape closes", async ({ page, isMobile }) => {
    test.skip(isMobile, "hover is a desktop interaction; touch is covered below");
    await page.goto("/he/subjects/biology");
    const map = page.getByTestId("map-the-cell");
    const node = map.getByTestId("map-node-hooke");
    await node.hover();
    const expansion = page.getByTestId("map-expansion");
    await expect(expansion).toBeVisible();
    await expect(expansion).toContainText("השעם הוא רקמה מתה");
    await expect(node).toHaveAttribute("aria-expanded", "true");

    // The expansion floats right under the box.
    const n = (await node.boundingBox())!;
    const ex = (await expansion.boundingBox())!;
    expect(ex.y).toBeGreaterThan(n.y + n.height - 1);
    expect(ex.y).toBeLessThan(n.y + n.height + 30);

    await page.mouse.move(5, 5);
    await expect(expansion).toHaveCount(0);

    await node.click();
    await page.mouse.move(5, 5);
    await expect(expansion).toBeVisible(); // pinned
    await page.keyboard.press("Escape");
    await expect(expansion).toHaveCount(0);
    await expect(node).toBeFocused();
  });

  test("moving from the box into the expansion keeps it open and its link works", async ({ page, isMobile }) => {
    test.skip(isMobile, "hover is a desktop interaction");
    await page.goto("/he/subjects/biology");
    await page.getByTestId("map-node-leeuwenhoek").hover();
    const link = page.getByTestId("map-expansion").getByRole("link", { name: "לסימולציה: המיקרוסקופ של ליווינהוק" });
    await link.hover();
    await link.click();
    await expect(page).toHaveURL(/\/he\/simulations\/microscope-lens$/);
  });

  test("keyboard: focusing a box expands it and tells where it leads", async ({ page }) => {
    await page.goto("/he/subjects/biology");
    const node = page.getByTestId("map-node-cell-theory");
    await expect(node).toContainText("מוביל אל: וירכוב, 1855");
    await node.focus();
    await expect(page.getByTestId("map-expansion")).toContainText("כל היצורים החיים בנויים מתא אחד או יותר");
    await page.keyboard.press("Tab"); // focus moves on: the preview closes
    await expect(page.getByTestId("map-expansion")).not.toContainText("כל היצורים החיים בנויים מתא אחד או יותר");
  });

  test("touch: tapping opens the expansion under the chart; tapping again closes it", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone layout");
    await page.goto("/he/subjects/biology");
    const map = page.getByTestId("map-enzymes");
    const node = map.getByTestId("map-node-denaturation");
    await node.tap();
    const expansion = page.getByTestId("map-expansion");
    await expect(expansion).toContainText("האנזים מאבד את המבנה המרחבי שלו");
    const m = (await map.boundingBox())!;
    const ex = (await expansion.boundingBox())!;
    expect(ex.y).toBeGreaterThanOrEqual(m.y + m.height - 1); // below the chart, not covering it
    expect(ex.width).toBeLessThanOrEqual(m.width + 1);
    await node.tap();
    await expect(expansion).toHaveCount(0);
  });

  test("accessibility with an expansion open, and English", async ({ page }) => {
    await page.goto("/he/subjects/biology");
    await page.getByTestId("map-node-takeover").click();
    await expect(page.getByTestId("map-expansion")).toBeVisible();
    await expect(await axeSerious(page)).toEqual([]);

    await page.goto("/en/subjects/biology");
    await expect(page.getByRole("heading", { name: "Topic map" }).first()).toBeVisible();
    await page.getByTestId("map-node-dna").click();
    await expect(page.getByTestId("map-expansion")).toContainText("A stretch of DNA that holds the instructions");
    await expect(await axeSerious(page)).toEqual([]);
  });
});
