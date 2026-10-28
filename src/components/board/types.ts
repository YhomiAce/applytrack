import type { Source, Stage, WorkMode } from "@/lib/domain/constants";

/** Serializable board card passed from the server to the client board. */
export type BoardCardData = {
  id: string;
  company: string;
  role: string;
  stage: Stage;
  position: number;
  location: string | null;
  workMode: WorkMode;
  source: Source;
  salary: string | null;
  appliedAt: string | null;
  followUpAt: string | null;
  followUpDue: boolean;
};
