// 固定 Tags 词表与快捷映射
// 初始内容：如鸢、代号鸢；可按需扩展

export const TAGS: readonly string[] = ["如鸢", "代号鸢"];

// 密探所属游戏（与 TAGS 词表一致；顺序即 operators.json 中 games 字段的规范顺序）
export const GAMES = ["如鸢", "代号鸢"] as const;
export type OperatorGame = (typeof GAMES)[number];

// 将快捷预设映射为具体 tags 列表
// 约定："通用" → 同时包含「如鸢」「代号鸢」（AND 语义）
export function mapQuickPresetToTags(preset: string): string[] {
  const p = (preset || "").trim();
  if (!p) return [];
  if (p === "通用") return ["如鸢", "代号鸢"];
  return TAGS.includes(p) ? [p] : [];
}
