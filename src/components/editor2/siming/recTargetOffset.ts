export type RecTargetOffset = [number, number, number, number];

export const DEFAULT_REC_TARGET_OFFSET: RecTargetOffset = [0, 0, 0, 0];

export const REC_TARGET_OFFSET_PRESETS: ReadonlyArray<{
  label: string;
  value: RecTargetOffset;
}> = [
  { label: "默认", value: DEFAULT_REC_TARGET_OFFSET },
  { label: "泰山府", value: [-80, 0, 0, 0] },
];

export function normalizeRecTargetOffset(value: unknown): RecTargetOffset {
  if (!Array.isArray(value) || value.length !== 4) {
    return [...DEFAULT_REC_TARGET_OFFSET];
  }

  const normalized = value.map((item) =>
    typeof item === "number" && Number.isFinite(item) ? Math.trunc(item) : 0,
  );
  return normalized as RecTargetOffset;
}
