import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(), // Clerk User ID
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("OFFICER"),
      v.literal("MANAGER"),
      v.literal("DIRECTOR"),
      v.literal("AUDITOR"),
      v.literal("SYSADMIN")
    ),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  history: defineTable({
    userId: v.string(), // Maps to clerkId
    userName: v.string(),
    timestamp: v.number(),
    donorType: v.string(),
    summary: v.string(),
    report: v.string(),
    downloadUrl: v.string(),
  }).index("by_user_id", ["userId"]),
});
