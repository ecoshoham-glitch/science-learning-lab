import { expect, test, type FrameLocator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/he/lessons/cell-discovery";

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

async function axeSerious(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

/** Jumps to a part using teacher-led navigation, then returns to self-paced mode on that part. */
async function goToPart(page: Page, part: number) {
  await page.goto(URL);
  await page.getByRole("radio", { name: "בהובלת מורה" }).click();
  for (let i = 1; i < part; i++) await page.getByRole("button", { name: "לחלק הבא" }).click();
  await page.getByRole("radio", { name: "בקצב אישי" }).click();
  await expect(page.getByText(`חלק ${part} מתוך 13`)).toBeVisible();
}

test.describe("topic: the cell – the unit of life", () => {
  test("is the first topic in Biology and holds the lesson and the microscope", async ({ page }) => {
    await page.goto("/he/subjects/biology");
    await expect(page.getByRole("heading", { level: 3 }).first()).toHaveText("התא – יחידת החיים");
    const topic = page.getByRole("region", { name: "התא – יחידת החיים" });
    await expect(topic.getByRole("link", { name: /גילוי התא/ })).toBeVisible();
    await expect(topic.getByRole("heading", { name: "המיקרוסקופ של ליווינהוק" })).toBeVisible();
  });
});

test.describe("microscope simulation", () => {
  test("a smaller ball magnifies more; bacteria appear only above ~×100; Hooke's ×50 cannot show them", async ({ page }) => {
    await page.goto("/he/simulations/microscope-lens");
    const frame = simFrame(page);
    await expect(frame.locator("#lensDiameter")).toHaveValue("6");
    await expect(frame.locator("#mag")).toHaveText("×57");
    await expect(frame.locator("#field-desc")).toContainText("רואים בבירור: תאי שעם");

    await frame.getByLabel("טיפת מים מאגם").check();
    await expect(frame.locator("#field-desc")).toContainText("חיידקים: נראים רק כנקודות");

    await setRange(frame, "lensDiameter", 3.3);
    await expect(frame.locator("#field-desc")).toContainText("חיידקים – מקלונים זעירים");
    await setRange(frame, "lensDiameter", 3.6);
    await expect(frame.locator("#field-desc")).toContainText("חיידקים: נראים רק כנקודות");
    await setRange(frame, "lensDiameter", 1.3);
    await expect(frame.locator("#mag")).toHaveText("×263");

    await frame.getByLabel("מיקרוסקופ מורכב של שנות ה-1660 (הוק)").check();
    await expect(frame.locator("#mag")).toHaveText("×50");
    await expect(frame.locator("#lensDiameter")).toBeDisabled();
    await expect(frame.locator("#field-desc")).toContainText("חיידקים: נראים רק כנקודות");
    await expect(frame.locator("#found-list")).toContainText("המיקרוסקופ המורכב לא מראה חיידקים");
  });

  test("activity tasks tick from the simulation's observations", async ({ page }) => {
    await page.goto("/he/simulations/microscope-lens");
    const frame = simFrame(page);
    await expect(frame.locator("#lensDiameter")).toHaveValue("6");
    await frame.getByLabel("טיפת מים מאגם").check();
    await frame.getByLabel("טיפת דם").check();
    await expect(page.getByText("יפה. שימו לב: בטיפת המים")).toBeVisible();
    await page.getByRole("button", { name: "לשלב הבא" }).click();

    await frame.getByLabel("טיפת מים מאגם").check();
    await setRange(frame, "lensDiameter", 2);
    await expect(page.getByText("ראיתם חיידקים – כמו ליווינהוק")).toBeVisible();
    await expect(await axeSerious(page)).toEqual([]);
  });
});

test.describe("cell-discovery lesson", () => {
  test("self-paced: prediction, then the simulation with its activity", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { name: "סוחר בדים שגילה עולם שלם" })).toBeVisible();
    await page.getByRole("button", { name: "לחלק הבא" }).click();
    await expect(page.getByRole("button", { name: "לחלק הבא" })).toBeDisabled();
    await page.getByLabel("כדור קטן יותר מגדיל יותר").check();
    await page.getByRole("button", { name: "בדוק" }).click();
    await page.getByRole("button", { name: "לחלק הבא" }).click();
    await expect(simFrame(page).locator("#mag")).toHaveText("×57");
    await expect(page.getByText("בעקבות ליווינהוק: מה צריך כדי לראות חיידק?")).toBeVisible();
  });

  test("timeline game: blocks progress until checked; arrow buttons reorder; scores", async ({ page }) => {
    await goToPart(page, 7);
    await expect(page.getByRole("heading", { name: "ציר הזמן של גילוי התא" })).toBeVisible();
    await expect(page.getByRole("button", { name: "לחלק הבא" })).toBeDisabled();
    await expect(page.getByText("בדקו את המשחק כדי להמשיך")).toBeVisible();

    const solution = ["hooke", "leeuwenhoek", "schleiden", "schwann", "virchow"];
    const items = page.locator('[data-testid^="seq-item-"]');
    const order = async () => (await items.evaluateAll((els) => els.map((e) => e.getAttribute("data-testid")!.slice(9))));
    expect(await order()).not.toEqual(solution);

    // A wrong first check gives a partial score.
    await page.getByRole("button", { name: "בדוק" }).click();
    await expect(page.getByText(/מתוך 5 נכונים/)).toBeVisible();
    await expect(page.getByRole("button", { name: "לחלק הבא" })).toBeEnabled();

    // Solve with the move-up buttons (selection sort), as a keyboard user would.
    for (let target = 0; target < solution.length; target++) {
      let current = (await order()).indexOf(solution[target]);
      while (current > target) {
        const up = page.getByTestId(`seq-item-${solution[target]}`).getByRole("button", { name: /למעלה/ });
        await up.click();
        current -= 1;
      }
    }
    expect(await order()).toEqual(solution);
    await page.getByRole("button", { name: "בדוק" }).click();
    await expect(page.getByText("מושלם!")).toBeVisible();
    await expect(page.getByText("1665 – הספר \"מיקרוגרפיה\"")).toBeVisible();
  });

  test("focus follows a moved item", async ({ page }) => {
    await goToPart(page, 7);
    const first = page.locator('[data-testid^="seq-item-"]').first();
    const id = await first.getAttribute("data-testid");
    await first.getByRole("button", { name: /למטה/ }).click();
    const moved = page.getByTestId(id!);
    await expect(moved.getByRole("button", { name: /למטה/ })).toBeFocused();
    await expect(page.locator('[data-testid^="seq-item-"]').nth(1)).toHaveAttribute("data-testid", id!);
  });

  test("matching game: check needs every row; wrong pairs are marked; then solved", async ({ page }) => {
    await goToPart(page, 8);
    await expect(page.getByRole("heading", { name: "מי גילה מה?" })).toBeVisible();
    const check = page.getByRole("button", { name: "בדוק" });
    await expect(check).toBeDisabled();

    const answers: Record<string, string> = {
      "אנטוני ואן ליווינהוק": "ראה לראשונה חיידקים בעדשת כדור זעירה",
      "רוברט הוק": "הראה שכל רקמות הצמח בנויות מתאים", // wrong on purpose
      "מתיאס שליידן": "נתן לתאים את שמם, לפי מה שראה בשעם", // wrong on purpose
      "תיאודור שוואן": "הראה שגם רקמות בעלי חיים בנויות מתאים",
      "רודולף וירכוב": "טען שכל תא נוצר מתא אחר",
    };
    for (const [left, right] of Object.entries(answers)) await page.getByLabel(left).selectOption({ label: right });
    await check.click();
    await expect(page.getByText("3 מתוך 5 נכונים")).toBeVisible();
    await page.getByLabel("רוברט הוק").selectOption({ label: "נתן לתאים את שמם, לפי מה שראה בשעם" });
    await page.getByLabel("מתיאס שליידן").selectOption({ label: "הראה שכל רקמות הצמח בנויות מתאים" });
    await check.click();
    await expect(page.getByText("מושלם!")).toBeVisible();
    await expect(await axeSerious(page)).toEqual([]);
  });

  test("true/false game: explanations after checking", async ({ page }) => {
    await goToPart(page, 10);
    await expect(page.getByRole("heading", { name: "נכון או לא נכון?" })).toBeVisible();
    const truths: Record<string, boolean> = {
      "כדור זכוכית קטן יותר מגדיל יותר.": true,
      "בשעם ראה הוק תאים חיים.": false,
      "המיקרוסקופ המורכב של המאה ה-17 הגדיל יותר מעדשת הכדור של ליווינהוק.": false,
      "כל היצורים החיים בנויים מתא אחד או יותר.": true,
      "נגיף הוא תא.": true, // wrong on purpose
      "שליידן ושוואן הוכיחו בניסוי שהתאים חיים.": false,
      "כל תא נוצר מתא אחר.": true,
    };
    for (const [statement, value] of Object.entries(truths)) {
      await page.getByRole("group", { name: statement }).getByLabel(value ? "נכון" : "לא נכון", { exact: true }).check();
    }
    await page.getByRole("button", { name: "בדוק" }).click();
    await expect(page.getByText("6 מתוך 7 נכונים")).toBeVisible();
    await expect(page.getByText("לא נכון – נגיף אינו תא")).toBeVisible();
    await page.getByRole("group", { name: "נגיף הוא תא." }).getByLabel("לא נכון", { exact: true }).check();
    await page.getByRole("button", { name: "בדוק" }).click();
    await expect(page.getByText("מושלם!")).toBeVisible();
    await expect(page.getByRole("button", { name: "לחלק הבא" })).toBeEnabled();
    await expect(await axeSerious(page)).toEqual([]);
  });

  test("integrative timeline: stages by year, two tracks, gaps, expandable events, filter", async ({ page }) => {
    await goToPart(page, 11);
    await expect(page.getByRole("heading", { name: "ציר הזמן המלא: כלים ורעיונות" })).toBeVisible();
    // Self-paced: reading the timeline is not blocked by a check.
    await expect(page.getByRole("button", { name: "לחלק הבא" })).toBeEnabled();

    const list = page.getByTestId("timeline-list");
    await expect(list.getByRole("heading", { level: 3 })).toHaveText([
      "1נולד כלי חדש", "2תצפיות ראשונות", "3עדשות טובות יותר – מבט לתוך התא",
      "4הכללה – תורת התא", "5מאין באים תאים?", "6מעבר לגבולות האור",
    ]);
    await expect(page.getByTestId("gap-achromatic")).toHaveText("154 שנים");
    await expect(page.getByRole("img", { name: /מ-1550 עד 1950: 12 אירועים ב-6 שלבים/ })).toBeVisible();

    // Cards show year, discovery and description; scientists' cards add a portrait, name and credit.
    const bacteria = page.getByTestId("event-bacteria");
    await expect(bacteria).toContainText("1676");
    await expect(bacteria.getByText("ליווינהוק מתאר יצורים קטנים עוד יותר – חיידקים.")).toBeVisible();
    const schwann = page.getByTestId("event-schwann");
    await expect(schwann.getByRole("img", { name: /דיוקן|תצלום/ })).toBeVisible();
    await expect(schwann).toContainText("תיאודור שוואן");
    await expect(schwann).toContainText("1810–1882");
    await expect(schwann.getByRole("heading", { name: "גם בעלי חיים בנויים מתאים – תורת התא" })).toBeVisible();
    await expect(schwann).toContainText("קרדיט לתמונה");
    const hooke = page.getByTestId("event-hooke-cork");
    await expect(hooke).toContainText("שחזור אמנותי מודרני");
    await expect(page.getByTestId("event-ball-lens").getByRole("img", { name: /המיקרוסקופ של ליווינהוק מאחור/ })).toBeVisible();
    await expect(page.getByTestId("event-ball-lens")).toContainText("איור סכמטי");
    for (const id of ["hooke-cork", "ball-lens", "protists", "schleiden", "schwann"]) {
      const img = page.getByTestId(`event-${id}`).locator("img");
      await expect(img).toBeVisible();
      expect(await img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(100);
    }

    // Filter to the tools track: only the four tool events remain.
    await page.getByLabel("כלים וטכנולוגיה").check();
    await expect(list.locator('[data-testid^="event-"]')).toHaveCount(4);
    await page.getByLabel("הכול").check();
    await expect(list.locator('[data-testid^="event-"]')).toHaveCount(12);
    // Additions beyond the transcript are marked only for the teacher.
    await expect(page.getByText("תוספת – לא מהמקור")).toHaveCount(0);
    await expect(page.getByText("מקור התמונה טרם אומת")).toHaveCount(0);
    await expect(await axeSerious(page)).toEqual([]);
  });

  test("teacher-led timeline marks events added beyond the transcript", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("radio", { name: "בהובלת מורה" }).click();
    for (let i = 1; i < 11; i++) await page.keyboard.press("ArrowLeft");
    await expect(page.getByText("חלק 11 מתוך 13")).toBeVisible();
    await expect(page.getByTestId("event-virchow").getByText("תוספת – לא מהמקור")).toBeVisible();
    await expect(page.getByTestId("event-hooke-cork").getByText("תוספת – לא מהמקור")).toHaveCount(0);
    await expect(page.getByTestId("event-schleiden").getByText("מקור התמונה טרם אומת")).toBeVisible();
    await expect(page.getByTestId("event-hooke-cork").getByText("מקור התמונה טרם אומת")).toHaveCount(0);
  });

  test("teacher-led: the teacher can show a game's solution to the class", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("radio", { name: "בהובלת מורה" }).click();
    for (let i = 1; i < 7; i++) await page.keyboard.press("ArrowLeft");
    await expect(page.getByText("חלק 7 מתוך 13")).toBeVisible();
    await page.getByRole("button", { name: "הצג פתרון לכיתה" }).click();
    await expect(page.getByText("זה הפתרון.")).toBeVisible();
    await expect(page.locator('[data-testid^="seq-item-"]').first()).toHaveAttribute("data-testid", "seq-item-hooke");
  });

  test("English version renders the games left-to-right", async ({ page }) => {
    await page.goto("/en/lessons/cell-discovery");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.getByRole("radio", { name: "Teacher-led" }).click();
    for (let i = 1; i < 8; i++) await page.getByRole("button", { name: "Next part" }).click();
    await expect(page.getByRole("heading", { name: "Who discovered what?" })).toBeVisible();
    await expect(await axeSerious(page)).toEqual([]);
  });
});
