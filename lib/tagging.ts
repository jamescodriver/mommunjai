// Auto-tag engine (pure). See docs/DATA-MODEL.md §4.
export interface LeadProfile {
  stage?: string; // prep|infertility|pregnant|lactating|male
  hasPcos?: boolean;
  artPlan?: string; // R4: ยัง|IUI|IVF-ICSI|บำรุงไข่|เตรียมผนังมดลูก (also accepts legacy none|iui|ivf|icsi)
  /** R2 — the "มีบุตรยาก" 7-item checklist. */
  infertilityIssues?: string[];
  interests?: string[];
  toolResultsCount?: number;
}

export function autoTags(p: LeadProfile): string[] {
  const tags = new Set<string>();
  if (p.hasPcos || p.infertilityIssues?.includes("pcos")) tags.add("#PCOS");
  if (p.stage === "prep") tags.add("#เตรียมท้อง");
  if (p.stage === "infertility") tags.add("#มีบุตรยาก");
  if (p.stage === "male") tags.add("#บำรุงชาย");
  // R4 — "IVF-ICSI" is now one combined option; tag both legacy slugs so
  // existing staff filters/dashboards built around #IVF/#ICSI keep working.
  if (p.artPlan === "IVF-ICSI" || p.artPlan === "ivf" || p.artPlan === "icsi") { tags.add("#IVF"); tags.add("#ICSI"); }
  if (p.artPlan === "IUI" || p.artPlan === "iui") tags.add("#IUI");
  if (p.artPlan === "บำรุงไข่") tags.add("#บำรุงไข่");
  if (p.artPlan === "เตรียมผนังมดลูก") tags.add("#เตรียมผนังมดลูก");
  const interests = p.interests || [];
  if (interests.includes("ovaall")) tags.add("#สนใจ-OvaAll");
  if (interests.includes("ferty")) tags.add("#สนใจ-Ferty");
  if ((p.toolResultsCount || 0) >= 3) tags.add("#engaged");
  return [...tags];
}
