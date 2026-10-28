import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import type { Source, Stage, WorkMode } from "@/lib/domain/constants";
import { stageChangeActivity } from "@/lib/domain/activity";
import { hashPassword } from "@/lib/password";

import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

type SeedApp = {
  company: string;
  role: string;
  location: string;
  workMode: WorkMode;
  source: Source;
  salary?: [number, number, string?];
  /** Stage history as [stage, days ago]; the last entry is the current stage. */
  path: [Stage, number][];
  /** Follow-up date relative to today (negative = overdue). */
  followUp?: number;
  contact?: [string, string];
  url?: string;
  notes?: string;
};

const APPS: SeedApp[] = [
  { company: "Northwind Labs", role: "Senior Frontend Engineer", location: "Berlin", workMode: "HYBRID", source: "LINKEDIN", salary: [85000, 100000, "EUR"], path: [["APPLIED", 52], ["SCREENING", 46], ["INTERVIEW", 38], ["OFFER", 9]], followUp: 1, contact: ["Mara Klein", "mara.klein@northwind.example"], url: "https://northwind.example/careers/senior-frontend", notes: "## Offer\n- Base: **€96k** + 10% bonus\n- 30 days PTO\n- Decision due Friday\n\nAsk about the equity refresh policy." },
  { company: "Brightline Health", role: "Full-Stack Engineer", location: "Remote (EU)", workMode: "REMOTE", source: "REFERRAL", salary: [80000, 95000, "EUR"], path: [["WISHLIST", 40], ["APPLIED", 37], ["SCREENING", 31], ["INTERVIEW", 20]], followUp: -2, contact: ["Tom Okafor", "tom@brightline.example"], notes: "Referred by Ade. Panel interview done — waiting on system design round scheduling." },
  { company: "Copperleaf", role: "Platform Engineer", location: "London", workMode: "HYBRID", source: "RECRUITER", salary: [90000, 110000, "GBP"], path: [["APPLIED", 33], ["SCREENING", 27], ["INTERVIEW", 14]], followUp: 0, contact: ["Priya Shah", "priya@talentbridge.example"], notes: "Recruiter: Priya (TalentBridge). Take-home: build a rate limiter in Go." },
  { company: "Fernway", role: "Software Engineer II", location: "Amsterdam", workMode: "ONSITE", source: "COMPANY_SITE", salary: [70000, 82000, "EUR"], path: [["APPLIED", 29], ["SCREENING", 21]], followUp: -1, notes: "Phone screen with hiring manager went well. They use Elixir + React." },
  { company: "Quantis", role: "Backend Engineer (Node.js)", location: "Remote", workMode: "REMOTE", source: "JOB_BOARD", salary: [110000, 135000], path: [["APPLIED", 18], ["SCREENING", 11]], followUp: 3, url: "https://jobs.example/quantis-backend" },
  { company: "Larkspur", role: "Staff Engineer", location: "Dublin", workMode: "HYBRID", source: "LINKEDIN", salary: [120000, 145000, "EUR"], path: [["APPLIED", 45], ["SCREENING", 40], ["REJECTED", 34]], notes: "Rejected after screen: looking for more people-management experience." },
  { company: "Tidewater Analytics", role: "Data Platform Engineer", location: "Remote (US)", workMode: "REMOTE", source: "LINKEDIN", salary: [130000, 150000], path: [["APPLIED", 58], ["REJECTED", 49]] },
  { company: "Orchard", role: "Frontend Engineer", location: "Lisbon", workMode: "HYBRID", source: "JOB_BOARD", salary: [55000, 65000, "EUR"], path: [["APPLIED", 41], ["SCREENING", 36], ["INTERVIEW", 30], ["REJECTED", 22]], notes: "Made it to the final round. Feedback: strong technically, wanted more design-system experience." },
  { company: "Pinecrest Software", role: "React Native Developer", location: "Remote", workMode: "REMOTE", source: "OTHER", path: [["APPLIED", 26], ["REJECTED", 25]], notes: "Auto-rejection the next day." },
  { company: "Helio Energy", role: "Senior Software Engineer", location: "Munich", workMode: "ONSITE", source: "RECRUITER", salary: [90000, 105000, "EUR"], path: [["APPLIED", 35], ["SCREENING", 30], ["WITHDRAWN", 24]], notes: "Withdrew: on-site 5 days a week, relocation not an option." },
  { company: "Kestrel Robotics", role: "Embedded/Web Tools Engineer", location: "Zurich", workMode: "ONSITE", source: "COMPANY_SITE", salary: [120000, 140000, "CHF"], path: [["APPLIED", 22]], followUp: -4 },
  { company: "Mosaic Learning", role: "Full-Stack Developer", location: "Remote (EU)", workMode: "REMOTE", source: "LINKEDIN", salary: [60000, 75000, "EUR"], path: [["APPLIED", 16]], followUp: 2 },
  { company: "Atlas Freight", role: "TypeScript Engineer", location: "Rotterdam", workMode: "HYBRID", source: "JOB_BOARD", path: [["APPLIED", 13]] },
  { company: "Sable & Co", role: "Product Engineer", location: "London", workMode: "HYBRID", source: "REFERRAL", salary: [75000, 90000, "GBP"], path: [["WISHLIST", 15], ["APPLIED", 10]], contact: ["Leah Morgan", "leah@sable.example"], notes: "Leah (ex-colleague) passed my CV to the EM directly." },
  { company: "Verdant", role: "Senior Engineer, Payments", location: "Remote", workMode: "REMOTE", source: "LINKEDIN", salary: [140000, 165000], path: [["APPLIED", 8]], followUp: 6 },
  { company: "Glasshouse", role: "Frontend Platform Engineer", location: "Copenhagen", workMode: "HYBRID", source: "COMPANY_SITE", salary: [650000, 750000, "DKK"], path: [["APPLIED", 6]] },
  { company: "Nimbus Cloud", role: "Developer Experience Engineer", location: "Remote", workMode: "REMOTE", source: "JOB_BOARD", path: [["APPLIED", 4]] },
  { company: "Redwood Bank", role: "Software Engineer", location: "Frankfurt", workMode: "ONSITE", source: "RECRUITER", salary: [75000, 85000, "EUR"], path: [["APPLIED", 3]], contact: ["Jonas Weber", "jonas@hirewell.example"] },
  { company: "Lumen Studio", role: "Creative Technologist", location: "Barcelona", workMode: "HYBRID", source: "OTHER", path: [["APPLIED", 2]] },
  { company: "Arcadia Games", role: "Tools Engineer", location: "Montreal", workMode: "HYBRID", source: "LINKEDIN", salary: [95000, 115000, "CAD"], path: [["APPLIED", 1]] },
  { company: "Polaris AI", role: "AI Product Engineer", location: "Remote", workMode: "REMOTE", source: "COMPANY_SITE", salary: [150000, 180000], path: [["WISHLIST", 9]], url: "https://polaris.example/careers", notes: "Tailor CV: highlight the LLM evaluation tooling project." },
  { company: "Wildflower", role: "Senior Frontend Engineer", location: "Berlin", workMode: "HYBRID", source: "LINKEDIN", path: [["WISHLIST", 5]] },
  { company: "Ironbridge", role: "Engineering Manager", location: "Remote (EU)", workMode: "REMOTE", source: "REFERRAL", path: [["WISHLIST", 3]], followUp: 1, contact: ["Sam Reyes", "sam@ironbridge.example"], notes: "Ask Sam for an intro to the VP Eng first." },
  { company: "Cobalt Security", role: "Full-Stack Engineer", location: "Tallinn", workMode: "HYBRID", source: "JOB_BOARD", path: [["WISHLIST", 2]] },
  { company: "Harbor Logistics", role: "Software Engineer", location: "Hamburg", workMode: "ONSITE", source: "COMPANY_SITE", salary: [65000, 75000, "EUR"], path: [["APPLIED", 64], ["WITHDRAWN", 50]], notes: "Withdrew after accepting interview elsewhere — keep in touch." },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDate(daysFromToday: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromToday));
}

/** A timestamp `days` ago, at a plausible working-hours time. */
function daysAgo(days: number, hour = 10): Date {
  const d = utcDate(-days);
  return new Date(d.getTime() + hour * 60 * 60 * 1000);
}

/**
 * Creates the demo account with ~25 applications spread across stages and
 * the last couple of months, including realistic stage-change history so the
 * stats page has something to show. Idempotent: does nothing if the demo user
 * already exists.
 *
 * @returns true when data was inserted.
 */
export async function seedDemoData(db: PrismaClient): Promise<boolean> {
  const existing = await db.user.findUnique({ where: { email: DEMO_EMAIL }, select: { id: true } });
  if (existing) return false;

  const userId = randomUUID();
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const positions = new Map<Stage, number>();

  await db.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        name: "Demo User",
        email: DEMO_EMAIL,
        emailVerified: true,
        accounts: {
          create: { id: randomUUID(), accountId: userId, providerId: "credential", password: passwordHash },
        },
      },
    });

    for (const app of APPS) {
      const current = app.path[app.path.length - 1][0];
      const position = positions.get(current) ?? 0;
      positions.set(current, position + 1);
      const appliedStep = app.path.find(([stage]) => stage === "APPLIED");
      const [firstStage, firstDays] = app.path[0];

      await tx.application.create({
        data: {
          userId,
          company: app.company,
          role: app.role,
          location: app.location,
          workMode: app.workMode,
          source: app.source,
          salaryMin: app.salary?.[0] ?? null,
          salaryMax: app.salary?.[1] ?? null,
          currency: app.salary?.[2] ?? "USD",
          jobUrl: app.url ?? null,
          contactName: app.contact?.[0] ?? null,
          contactEmail: app.contact?.[1] ?? null,
          notes: app.notes ?? "",
          stage: current,
          position,
          appliedAt: appliedStep ? utcDate(-appliedStep[1]) : null,
          followUpAt: app.followUp === undefined ? null : utcDate(app.followUp),
          createdAt: daysAgo(firstDays, 9),
          activities: {
            create: [
              { type: "CREATED", toStage: firstStage, message: "Application added", createdAt: daysAgo(firstDays, 9) },
              ...app.path.slice(1).map(([stage, days], i) => ({
                ...stageChangeActivity(app.path[i][0], stage),
                type: "STAGE_CHANGED" as const,
                createdAt: daysAgo(days, 14),
              })),
              ...(app.followUp === undefined
                ? []
                : [
                    {
                      type: "FOLLOW_UP_SET" as const,
                      message: `Follow-up set for ${utcDate(app.followUp).toISOString().slice(0, 10)}`,
                      createdAt: new Date(Math.min(Date.now(), daysAgo(app.path[app.path.length - 1][1], 15).getTime() + DAY_MS / 24)),
                    },
                  ]),
            ],
          },
        },
      });
    }
  });
  return true;
}
