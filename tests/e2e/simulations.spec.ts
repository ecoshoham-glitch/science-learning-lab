import { expect, test, type FrameLocator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function simFrame(page: Page): FrameLocator {
  return page.frameLocator('iframe[sandbox="allow-scripts"]');
}

async function setRange(frame: FrameLocator, id: string, value: number) {
  await frame.locator(`#${id}`).evaluate((el, v) => {
    const input = el as HTMLInputElement;
    input.value = String(v);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

test.describe("enzyme lab", () => {
  test("grade 10 activity: locks, measurements and live task check", async ({ page }) => {
    await page.goto("/he/simulations/enzyme-lab");
    const frame = simFrame(page);

    // The activity configuration reached the simulation through the bridge.
    await expect(frame.locator("#temperature")).toHaveValue("10");
    await expect(frame.locator("#pH")).toBeDisabled();
    await expect(frame.locator("#substrate")).toBeDisabled();
    await expect(frame.locator("#temperature")).toBeEnabled();
    await expect(frame.locator("html")).toHaveAttribute("dir", "rtl");

    // Step 1: prediction.
    await page.getByLabel("הקצב יעלה עד נקודה מסוימת ואז ירד").check();
    await page.getByRole("button", { name: "בדוק" }).click();
    await expect(page.getByText("ניבוי מצוין")).toBeVisible();
    await page.getByRole("button", { name: "לשלב הבא" }).click();

    // Step 2: the task is not done until the student has measured.
    await expect(page.getByText("המשימה עוד לא הושלמה").last()).toBeVisible();
    for (const t of [10, 20, 30, 37, 45]) {
      await setRange(frame, "temperature", t);
      await frame.getByRole("button", { name: "מדוד קצב תגובה" }).click();
    }
    await expect(frame.locator("#rows tr")).toHaveCount(5);
    await expect(page.getByText("מצאתם את אזור הטמפרטורה האופטימלית")).toBeVisible();
  });

  test("measured rates follow the model: highest near 37 °C, near zero at 70 °C", async ({ page }) => {
    await page.goto("/en/simulations/enzyme-lab");
    const frame = simFrame(page);
    await expect(frame.locator("#temperature")).toHaveValue("10");
    const rates: Record<number, number> = {};
    for (const t of [20, 37, 70]) {
      await setRange(frame, "temperature", t);
      await frame.getByRole("button", { name: "Measure reaction rate" }).click();
      const cell = frame.locator("#rows tr").last().locator("td").nth(4);
      rates[t] = Number((await cell.textContent())!.replace(/,/g, ""));
    }
    // pH 7 and 10 mM substrate: true rates are 83.3 % at 37 °C, ~25 % at 20 °C, ~0 at 70 °C (±3 % noise).
    expect(rates[37]).toBeGreaterThan(80);
    expect(rates[37]).toBeLessThan(86);
    expect(rates[20]).toBeLessThan(rates[37]);
    expect(rates[70]).toBeLessThan(1);
  });

  test("switching to another activity re-configures the same simulation", async ({ page }) => {
    await page.goto("/he/simulations/enzyme-lab");
    await expect(simFrame(page).locator("#pH")).toBeDisabled();
    await page.getByRole("radio", { name: /חקר: תכננו ניסוי/ }).click();
    const frame = simFrame(page);
    await expect(frame.locator("#pH")).toHaveValue("4");
    await expect(frame.locator("#pH")).toBeEnabled();
    await expect(frame.locator("#temperature")).toHaveValue("30");
  });

  test("the sandbox has no access to platform cookies, storage or network", async ({ page }) => {
    await page.goto("/he/simulations/enzyme-lab");
    const frame = page.frames().find((f) => f.url().includes("/sims/enzyme-lab/"));
    await expect.poll(() => page.frames().some((f) => f.url().includes("/sims/enzyme-lab/"))).toBe(true);
    const sim = frame ?? page.frames().find((f) => f.url().includes("/sims/enzyme-lab/"))!;

    const result = await sim.evaluate(async () => {
      const out: Record<string, string> = { origin: window.origin };
      try { void document.cookie; out.cookie = "readable"; } catch { out.cookie = "blocked"; }
      try { void window.localStorage.length; out.storage = "readable"; } catch { out.storage = "blocked"; }
      try { void window.parent.document; out.parentDom = "readable"; } catch { out.parentDom = "blocked"; }
      try { await fetch("/he"); out.network = "allowed"; } catch { out.network = "blocked"; }
      return out;
    });
    expect(result).toEqual({ origin: "null", cookie: "blocked", storage: "blocked", parentDom: "blocked", network: "blocked" });
  });

  test("simulation page has no serious accessibility violations", async ({ page }) => {
    await page.goto("/he/simulations/enzyme-lab");
    await expect(simFrame(page).locator("#temperature")).toHaveValue("10");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

test.describe("genetic code simulator", () => {
  test("finds a silent, a missense, a nonsense and a frameshift mutation; the activity notices", async ({ page }) => {
    await page.goto("/he/simulations/genetic-code");
    const frame = simFrame(page);
    await page.getByRole("button", { name: "לשלב הבא" }).click();

    const base = (i: number) => frame.getByRole("button", { name: new RegExp(`^בסיס ${i}:`) });
    const replace = (b: string) => frame.locator('[data-action="replace"] button', { hasText: b });
    const reset = () => frame.getByRole("button", { name: "חזרה לגן המקורי" }).click();

    await base(6).click(); await replace("A").click(); // GCC -> GCA (Ala -> Ala)
    await expect(frame.locator("#mutation")).toHaveText("מוטציה שקטה");
    await reset();
    await base(10).click(); await replace("G").click(); // AAA -> GAA (Lys -> Glu)
    await expect(frame.locator("#mutation")).toHaveText("מוטציה מחליפת משמעות");
    await reset();
    await base(9).click(); await replace("A").click(); // TGG -> TGA (Trp -> Stop)
    await expect(frame.locator("#mutation")).toHaveText("מוטציית עצירה");
    await reset();
    await base(5).click(); await frame.getByRole("button", { name: "מחיקת הבסיס הנבחר" }).click();
    await expect(frame.locator("#mutation")).toHaveText("מוטציית הזזת מסגרת");

    await expect(page.getByText("מצאתם את כל ארבעת הסוגים.")).toBeVisible();
  });
});
