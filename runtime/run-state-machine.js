export const RUN_STATES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  NEEDS_REVIEW: "needs_review",
  COMPLETED: "completed",
  FAILED: "failed"
};

export const RUN_TRANSITIONS = {
  pending: ["in_progress", "failed"],
  in_progress: ["needs_review", "completed", "failed"],
  needs_review: ["in_progress", "completed", "failed"],
  completed: [],
  failed: []
};

export function canTransition(from, to) {
  const allowed = RUN_TRANSITIONS[from] || [];
  return allowed.includes(to);
}
