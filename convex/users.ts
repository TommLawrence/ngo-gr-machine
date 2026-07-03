import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get current user based on Clerk ID
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

// Create or update a user on first login
export const storeUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser !== null) {
      // Update name, email, or imageUrl if they changed in Clerk
      if (existingUser.name !== args.name || existingUser.email !== args.email || existingUser.imageUrl !== args.imageUrl) {
        await ctx.db.patch(existingUser._id, {
          name: args.name,
          email: args.email,
          imageUrl: args.imageUrl
        });
      }
      return existingUser._id;
    }

    // Default to 'OFFICER' role for new sign-ups, or check if it's the first user to make them SYSADMIN
    const allUsers = await ctx.db.query("users").take(1);
    const role = allUsers.length === 0 ? "SYSADMIN" : "OFFICER";

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      role,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    // Basic authorization check could go here
    return await ctx.db.query("users").collect();
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("OFFICER"),
      v.literal("MANAGER"),
      v.literal("DIRECTOR"),
      v.literal("AUDITOR"),
      v.literal("SYSADMIN")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Fetch the user being deleted
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    // Prevent self-deletion at backend level
    if (targetUser.clerkId === identity.subject) {
      throw new Error("You cannot delete your own account.");
    }

    // Only SYSADMINs can delete users
    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!caller || caller.role !== "SYSADMIN") {
      throw new Error("Only System Admins can remove users.");
    }

    await ctx.db.delete(args.userId);
  },
});
