import { z } from "zod";

export const jobBoardSchema = z.object({
  name: z.string(),
  emailAddress: z.string().email().optional(),
});

export const jobBoardsSchema = z.array(jobBoardSchema);

export const matchPolicySchema = z.object({
  schemaVersion: z.literal(1),
  recommendThreshold: z.number(),
  title: z.object({
    prefer: z.array(z.string()),
    seniorityPrefer: z.array(z.string()),
    reject: z.array(z.string()),
  }),
  skills: z.object({
    prefer: z.array(z.string()),
    weight: z.number(),
  }),
  locations: z.object({
    prefer: z.array(z.string()),
    rejectUnlessRemoteEu: z.array(z.string()),
  }),
  industriesBonus: z.array(z.string()),
  titleDownrank: z.array(z.string()),
});

export const jobStatusSchema = z.enum([
  "recommended",
  "saved",
  "dismissed",
  "applied",
]);

export const recommendedJobSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  url: z.string(),
  postedAt: z.string().nullable(),
  discoveredAt: z.string(),
  discoveryChannel: z.literal("email"),
  score: z.number(),
  reasons: z.array(z.string()),
  status: jobStatusSchema,
});

export const recommendedJobsStoreSchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string().nullable(),
  jobs: z.array(recommendedJobSchema),
});

export type JobBoard = z.infer<typeof jobBoardSchema>;
export type MatchPolicy = z.infer<typeof matchPolicySchema>;
export type RecommendedJob = z.infer<typeof recommendedJobSchema>;
export type RecommendedJobsStore = z.infer<typeof recommendedJobsStoreSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
