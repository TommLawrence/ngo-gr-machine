import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("history").order("desc").collect();
  },
});

export const getHistoryByUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("history")
      .withIndex("by_user_id", (q) => q.eq("userId", args.clerkId))
      .order("desc")
      .collect();
  },
});

export const addHistoryItem = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    donorType: v.string(),
    summary: v.string(),
    report: v.string(),
    downloadUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("history", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const deleteHistoryItem = mutation({
  args: { id: v.id("history") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
