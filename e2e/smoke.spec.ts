import { expect, test, type Locator, type Page } from "@playwright/test";

// Next.js keeps up to 3 visited routes mounted but hidden (React <Activity>), so
// locators that could match a previous page are filtered to visible elements.

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await expect(page.getByText("demo@applytrack.dev")).toBeVisible();
  await page.getByLabel("Email").fill("demo@applytrack.dev");
  await page.getByLabel("Password").fill("demo-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /Applications/ })).toBeVisible();
}

async function drag(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  await target.waitFor();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("missing bounding box");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + Math.min(40, to.height / 2), { steps: 20 });
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().startsWith(page.url().split("?")[0]));
  await page.mouse.up();
  await saved;
}

test("sign in, move a card, reload, export, stats", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("Due follow-ups")).toBeVisible();

  const wishlist = page.locator('section[data-stage="WISHLIST"]');
  const applied = page.locator('section[data-stage="APPLIED"]');
  const card = wishlist.getByTestId("board-card").first();
  const cardId = await card.getAttribute("data-card-id");
  expect(cardId).toBeTruthy();

  await drag(page, card, applied.locator("ul"));
  await expect(applied.locator(`[data-card-id="${cardId}"]`)).toBeVisible();

  await page.reload();
  await expect(applied.locator(`[data-card-id="${cardId}"]`)).toBeVisible();
  await expect(wishlist.locator(`[data-card-id="${cardId}"]`)).toHaveCount(0);

  // The move is in the activity timeline.
  await page.goto(`/applications/${cardId}`);
  await expect(page.getByText("Activity")).toBeVisible();
  await expect(page.locator("ol").getByText("Applied").first()).toBeVisible();

  const response = await page.request.get("/api/export");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/csv");
  expect(await response.text()).toContain("Company,Role,Stage");

  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: "Funnel conversion" })).toBeVisible();
  await expect(page.getByText("Response rate", { exact: true })).toBeVisible();

  // Put the card back so the demo data stays tidy.
  await page.goto("/");
  await drag(page, applied.locator(`[data-card-id="${cardId}"]`), wishlist.locator("ul"));
  await expect(wishlist.locator(`[data-card-id="${cardId}"]`)).toBeVisible();
});

test("create, edit, import and delete an application", async ({ page }) => {
  await signIn(page);
  const company = `E2E Corp ${Date.now()}`;

  await page.goto("/applications/new");
  await page.getByRole("button", { name: "Add application" }).filter({ visible: true }).click();
  await expect(page.getByText("Company is required")).toBeVisible();

  await page.getByLabel("Company *").filter({ visible: true }).fill(company);
  await page.getByLabel("Role *").filter({ visible: true }).fill("QA Engineer");
  await page.getByLabel("Stage").filter({ visible: true }).selectOption("APPLIED");
  await page.getByLabel("Notes (markdown)").filter({ visible: true }).fill("## Heading\n- **bold** item");
  await page.getByRole("button", { name: "Add application" }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: company }).filter({ visible: true })).toBeVisible();
  await expect(page.locator(".prose-notes strong")).toHaveText("bold");

  await page.getByRole("link", { name: "Edit" }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Edit application" }).filter({ visible: true })).toBeVisible();
  await page.getByLabel("Stage").filter({ visible: true }).selectOption("INTERVIEW");
  await page.getByRole("button", { name: "Save changes" }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: company }).filter({ visible: true })).toBeVisible();
  await expect(page.locator("ol").getByText("Interview")).toBeVisible();

  await page.getByLabel("Follow-up date").filter({ visible: true }).fill("2020-01-01");
  await page.getByRole("button", { name: "Save", exact: true }).filter({ visible: true }).click();
  await expect(page.getByText("Follow-up saved")).toBeVisible();
  await page.goto("/");
  // Overdue follow-up: shows on the board and in the "Due follow-ups" panel.
  await expect(page.getByRole("link", { name: new RegExp(company) }).filter({ visible: true })).toHaveCount(2);

  await page.goto("/import-export");
  await page.getByLabel(/CSV file/).filter({ visible: true }).setInputFiles({
    name: "import.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`Company,Role,Stage,Source\n${company} Import,Dev,Screening,LinkedIn\nBad,Row,Nope,\n`),
  });
  await page.getByRole("button", { name: "Import" }).filter({ visible: true }).click();
  await expect(page.getByText(/Imported 1 application\. Skipped 1 invalid row/)).toBeVisible();

  for (const name of [`${company} Import`, company]) {
    await page.goto(`/?q=${encodeURIComponent(name)}`);
    await page.getByTestId("board-card").filter({ hasText: name }).first().click();
    await expect(page.getByRole("heading", { name }).filter({ visible: true })).toBeVisible();
    page.once("dialog", (d) => void d.accept());
    await page.getByRole("button", { name: "Delete" }).filter({ visible: true }).click();
    await expect(page).toHaveURL("/");
  }
});
