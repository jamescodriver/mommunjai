// Auto-tag engine (pure). See docs/DATA-MODEL.md §4.
export interface LeadProfile {
  stage?: string; // prep|infertility|pregnant|lactating|male
  hasPcos?: boolean;
  artPlan?: string; // none|iui|ivf|icsi
  interests?: string[];
  toolResultsCount?: number;
}

export function autoTags(p: LeadProfile): string[] {
  const tags = new Set<string>();
  if (p.hasPcos) tags.add("#PCOS");
  if (p.stage === "prep") tags.add("#เตรียมท้อง");
  if (p.stage === "infertility") tags.add("#มีบุตรยาก");
  if (p.stage === "male") tags.add("#บำรุงชาย");
  if (p.artPlan === "icsi") tags.add("#ICSI");
  if (p.artPlan === "ivf") tags.add("#IVF");
  if (p.artPlan === "iui") tags.add("#IUI");
  const interests = p.interests || [];
  if (interests.includes("ovaall")) tags.add("#สนใจ-OvaAll");
  if (interests.includes("ferty")) tags.add("#สนใจ-Ferty");
  if ((p.toolResultsCount || 0) >= 3) tags.add("#engaged");
  return [...tags];
}
