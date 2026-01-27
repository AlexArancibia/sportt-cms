/**
 * Central place for React Query keys.
 *
 * Keep keys stable and structured so you can:
 * - invalidate exact slices of server-state
 * - avoid typos across the app
 * - migrate endpoint-by-endpoint safely
 */
export const queryKeys = {
  auth: {
    session: () => ["auth", "session"] as const,
  },
} as const

