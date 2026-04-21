// Shared constants used across multiple screens and components

export const BLURHASH = "LOMIJ@0J0JE0%3~E9sEK%3IoNFEK";

export const SAFE_AREA_EDGES = ["top", "left", "right"];

export const getActiveJobs = (jobs) =>
  jobs.filter((j) => j.workflow_step_label !== "Completed");

export const getCompletedJobs = (jobs) =>
  jobs.filter((j) => j.workflow_step_label === "Completed");
