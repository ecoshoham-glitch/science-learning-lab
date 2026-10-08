import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/he/lessons/viruses-intro";

test.describe("lesson generated from a transcript", () => {
  test("lessons page lists it with its origin and review status", async ({ page }) => {
    await page.goto("/he");
    await page.getByRole("navigation").getByRole("link", { name: "שיעורים" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("שיעורים");
    const item = page.getByRole("listitem").filter({ hasText: "נגיפים: מה הם" });
    await expect(item.getByText("נוצר בעזרת AI מתמלול")).toBeVisible();
    await expect(item.getByText("טיוטה – לא נבדקה")).toBeVisible();
  });

  test("self-paced: questions must be answered before moving on; feedback appears", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { name: 'מה זה "ויראלי"?' })).toBeVisible();
    await page.getByRole("button", { name: "לחלק הבא" }).click();

    // Prediction question: next is blocked until an answer is checked.
    await expect(page.getByRole("button", { name: "לחלק הבא" })).toBeDisabled();
    await page.getByLabel("נגיף הוא חומר תורשתי עטוף במעטפת, שמתרבה רק בתוך תא").check();
    await page.getByRole("button", { name: "בדוק" }).click();
    await expect(page.getByText("בדיוק. נראה בהמשך")).toBeVisible();
    await expect(page.getByRole("button", { name: "לחלק הבא" })).toBeEnabled();
  });

  test("the simulation block runs the library simulation with the lesson's activity", async ({ page }) => {
    await page.goto(URL);
    for (let i = 0; i < 1; i++) await page.getByRole("button", { name: "לחלק הבא" }).click();
    await page.getByLabel("נגיף הוא תא קטן מאוד, כמו חיידק").check();
    await page.getByRole("button", { name: "בדוק" }).click();
    await page.getByRole("button", { name: "לחלק הבא" }).click(); // why cells first
    await page.getByRole("button", { name: "לחלק הבא" }).click(); // simulation

    const frame = page.frameLocator('iframe[sandbox="allow-scripts"]');
    const base = (i: number) => frame.getByRole("button", { name: new RegExp(`^בסיס ${i}:`) });
    const replace = (b: string) => frame.locator('[data-action="replace"] button', { hasText: b });
    await expect(base(6)).toBeVisible();
    await base(6).click(); await replace("A").click(); // silent
    // The checklist ticks each part separately as soon as it is done.
    await expect(page.getByRole("list", { name: "התקדמות במשימה" }).getByText("המשימה הושלמה")).toHaveCount(1);
    await frame.getByRole("button", { name: "חזרה לגן המקורי" }).click();
    await base(10).click(); await replace("G").click(); // missense
    await expect(page.getByText("מצאתם את שני סוגי השינויים.")).toBeVisible();

    // The frame fits its content (it can shrink, not only grow).
    const frameBox = await page.locator('iframe[sandbox="allow-scripts"]').boundingBox();
    const contentHeight = await frame.locator("body").evaluate((b) => b.getBoundingClientRect().height);
    expect(Math.abs(frameBox!.height - contentHeight)).toBeLessThan(40);
  });

  test("teacher-led: same lesson, classroom view, answers hidden until revealed, arrow keys move", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("radio", { name: "בהובלת מורה" }).click();
    await page.keyboard.press("ArrowLeft"); // forward in Hebrew
    await expect(page.getByText("חלק 2 מתוך 10")).toBeVisible();
    await expect(page.getByText("בדיוק. נראה בהמשך")).toHaveCount(0);
    // No answering required in teacher-led mode: the teacher can move on.
    await expect(page.getByRole("button", { name: "לחלק הבא" })).toBeEnabled();
    await page.getByRole("button", { name: "חשוף תשובה לכיתה" }).click();
    await expect(page.getByText("בדיוק. נראה בהמשך")).toBeVisible();
    await page.keyboard.press("ArrowRight"); // back in Hebrew
    await expect(page.getByText("חלק 1 מתוך 10")).toBeVisible();
  });

  test("shows how it was made, including privacy screening and pending reviews", async ({ page }) => {
    await page.goto(URL);
    await page.getByText("איך השיעור נוצר").click();
    await expect(page.getByText("סינון פרטיות לפני AI")).toBeVisible();
    await expect(page.getByText("התמלול עצמו לא נשמר באתר")).toBeVisible();
  });

  test("English version and accessibility", async ({ page }) => {
    await page.goto("/en/lessons/viruses-intro");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { name: 'What does "viral" mean?' })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
