import { Operation } from "models/operation";

// 用于手动屏蔽按热度排序时不想展示的关卡。
// 将对应的 stageId/levelId 或标题关键字添加到下方列表即可生效（大小写不敏感）。
export const hotSortHiddenStageIds: string[] = [
  "2_0_2_5_nian_1_1_dong_ku",
  "	2_0_2_5_nian_1_1",
  "	2_0_2_5_nian_1_0_yue_dong_ku_you",
  "2_0_2_5_nian_1_0_yue_dong_ku_zuo",
  "	2_0_2_5_nian_1_1_dong_ku_01",
];
export const hotSortHiddenLevelIds: string[] = [];
export const hotSortHiddenTitleKeywords: string[] = [];

export function isHiddenInHotSort(operation: Operation): boolean {
  const stageId = operation.preLevel?.stageId?.trim();
  const levelId = operation.preLevel?.levelId?.trim();
  const normalizedStageId = stageId?.toLowerCase();
  const normalizedLevelId = levelId?.toLowerCase();
  const title = (operation.parsedContent?.doc?.title ?? operation.title ?? "").toLowerCase();

  return (
    (!!normalizedStageId &&
      hotSortHiddenStageIds.map((id) => id.toLowerCase()).includes(normalizedStageId)) ||
    (!!normalizedLevelId &&
      hotSortHiddenLevelIds.map((id) => id.toLowerCase()).includes(normalizedLevelId)) ||
    (!!title &&
      hotSortHiddenTitleKeywords.some(
        (keyword) => keyword && title.includes(keyword.toLowerCase()),
      ))
  );
}
