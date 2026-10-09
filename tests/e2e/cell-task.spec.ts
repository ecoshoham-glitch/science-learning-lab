import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/he/lessons/cell-timeline-task";

async function axeSerious(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

const next = (page: Page) => page.getByRole("button", { name: "לחלק הבא" });

test.describe("assignment: the timeline of the discovery of the cell", () => {
  test("is listed in the cell topic with an assignment badge", async ({ page }) => {
    await page.goto("/he/subjects/biology");
    const topic = page.getByRole("region", { name: "התא – יחידת החיים" });
    const item = topic.getByRole("listitem").filter({ has: page.getByRole("link", { name: "משימה: ציר הזמן של גילוי התא" }) });
    await expect(item.getByText("משימה", { exact: true })).toBeVisible();
    await item.getByRole("link").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("משימה: ציר הזמן של גילוי התא");
  });

  test("students fill the table, names are checked, model answers appear, then the reflection", async ({ page, context, browserName }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(URL);
    await next(page).click();
    await expect(page.getByRole("heading", { name: "מלאו את ציר הזמן" })).toBeVisible();

    // The student must try the table before moving on.
    await expect(next(page)).toBeDisabled();
    await expect(page.getByRole("button", { name: "בדקו את התשובות" })).toBeDisabled();

    const hooke = page.getByTestId("row-hooke");
    await hooke.getByRole("button", { name: "רמז" }).click();
    await expect(hooke.getByText("מי הסתכל על פרוסת שעם")).toBeVisible();
    await hooke.getByLabel("שם הממציא או המדען").fill("רוברט הוק");
    await hooke.getByLabel("במה הוא עסק?").fill("מדען");
    await hooke.getByLabel("הדרך שבה גילה את התאים").fill("הסתכל על שעם במיקרוסקופ");
    await page.getByTestId("row-leeuwenhoek").getByLabel("שם הממציא או המדען").fill("לוונהוק");
    await page.getByTestId("row-schleiden").getByLabel("שם הממציא או המדען").fill("שוואן"); // wrong on purpose

    await page.getByRole("button", { name: "בדקו את התשובות" }).click();
    await expect(page.getByText("שמות נכונים: 2 מתוך 4")).toBeVisible();
    await expect(hooke.getByText("נכון", { exact: true })).toBeVisible();
    await expect(page.getByTestId("row-schleiden").getByText(/^עוד לא/)).toBeVisible();
    await expect(page.getByTestId("row-schleiden").getByText("מתיאס יאקוב שליידן")).toBeVisible();
    // Open answers are compared with the model answer – only for cells the student tried.
    await expect(hooke.getByText(/חלת דבש/)).toBeVisible();
    await expect(page.getByTestId("row-schwann").getByText("תיאודור שוואן")).toHaveCount(0);
    await expect(page.getByTestId("row-leeuwenhoek").getByText(/סוחר בדים מהעיר דלפט/)).toHaveCount(0);

    // Answers are kept when moving back and forth.
    await expect(next(page)).toBeEnabled();
    await next(page).click();
    await page.getByRole("button", { name: "לחלק הקודם" }).click();
    await expect(hooke.getByLabel("שם הממציא או המדען")).toHaveValue("רוברט הוק");
    await next(page).click();

    await expect(page.getByRole("heading", { name: "מה הסרטון חידש לכם?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "סיימתי" })).toBeDisabled();
    await page.getByRole("button", { name: "לא ידעתי ש…" }).click();
    const text = page.getByLabel(/מה חדש למדתם/);
    await expect(text).toHaveValue("לא ידעתי ש… ");
    await text.pressSequentially("הראשון שראה חיידקים היה סוחר בדים");
    await page.getByRole("button", { name: "סיימתי" }).click();
    await expect(page.getByText("תודה!", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "העתיקו את התשובות כדי לשלוח למורה" }).click();
    const copied = page.getByText("התשובות הועתקו");
    const fallback = page.getByRole("textbox", { name: "העתיקו את התשובות כדי לשלוח למורה" });
    await expect(copied.or(fallback)).toBeVisible();
    if (await copied.isVisible()) {
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      expect(clip).toContain("שם הממציא או המדען: רוברט הוק");
      expect(clip).toContain("סוחר בדים");
    }

    expect(await axeSerious(page)).toEqual([]);
  });

  test("teacher-led mode shows model answers to the class and has no blocking", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("radio", { name: "בהובלת מורה" }).click();
    await next(page).click();
    await expect(page.getByText("מתיאס יאקוב שליידן")).toHaveCount(0);
    await page.getByRole("button", { name: "הצג תשובות לדוגמה לכיתה" }).click();
    await expect(page.getByText("מתיאס יאקוב שליידן")).toBeVisible();
    await expect(next(page)).toBeEnabled();
    await next(page).click();
    await expect(page.getByText(/אין תשובה אחת נכונה/)).toBeVisible();
    expect(await axeSerious(page)).toEqual([]);
  });

  test("table page passes accessibility checks", async ({ page }) => {
    await page.goto(URL);
    await next(page).click();
    expect(await axeSerious(page)).toEqual([]);
  });
});
