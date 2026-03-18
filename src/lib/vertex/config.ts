export interface VertexRuntimeConfig {
  project: string;
  location: string;
  model: string;
}

function getVertexProjectId() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    ""
  ).trim();
}

function getVertexLocation() {
  return (
    process.env.GOOGLE_CLOUD_LOCATION ||
    process.env.VERTEX_AI_LOCATION ||
    "us-central1"
  ).trim();
}

export function getVertexDraftRuntimeConfig(): VertexRuntimeConfig | null {
  const project = getVertexProjectId();

  if (!project) {
    return null;
  }

  return {
    project,
    location: getVertexLocation(),
    model: (process.env.VERTEX_DRAFT_MODEL || "gemini-2.5-flash").trim(),
  };
}

export function getVertexReviewRuntimeConfig(): VertexRuntimeConfig | null {
  const project = getVertexProjectId();

  if (!project) {
    return null;
  }

  return {
    project,
    location: getVertexLocation(),
    model: (process.env.VERTEX_REVIEW_MODEL || "gemini-2.5-pro").trim(),
  };
}
