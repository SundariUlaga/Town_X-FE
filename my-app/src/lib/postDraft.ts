const DRAFT_KEY = "townx_post_draft";

export type PostDraft = {
  version: 1;
  savedAt: string;
  currentStep: number;
  formData: Record<string, unknown>;
  selectedDistrictId: string;
  selectedTalukId: string;
  selectedVillageId: string;
  uploadedFileNames: string[];
};

export function loadPostDraft(): PostDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PostDraft;
    if (parsed?.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePostDraft(draft: Omit<PostDraft, "version" | "savedAt">): void {
  const payload: PostDraft = {
    version: 1,
    savedAt: new Date().toISOString(),
    ...draft,
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function clearPostDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
