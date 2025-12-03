import { atom, useAtomValue } from "jotai";
import { findLastIndex, isNumber, isString, get as lodashGet } from "lodash-es";
import { useMemo } from "react";

import { editorAtoms } from "../editor-state";
import { i18n } from "../../../i18n/i18n";
import { toMaaOperation } from "../reconciliation";
import { ZodIssue, getLabel, operationSchema } from "./schema";

export type EntityIssue = ZodIssue & {
  fieldLabel?: string;
};

export function useEntityErrors(id: string): EntityIssue[] | undefined {
  return useAtomValue(
    useMemo(() => atom((get) => get(editorAtoms.visibleEntityErrors)?.[id]), [id]),
  );
}

export const editorValidationAtom = atom(null, (get, set) => {
  const operation = get(editorAtoms.operation);
  const metadata = get(editorAtoms.metadata);
  const result = operationSchema.safeParse(toMaaOperation(operation));

  const globalIssues: ZodIssue[] = [];
  const entityIssues: Record<string, EntityIssue[]> = {};

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const entityIndexIndex = findLastIndex(issue.path, isNumber);
      if (entityIndexIndex !== -1) {
        const entityPath = issue.path.slice(0, entityIndexIndex + 1);
        try {
          const maybeEntity = lodashGet(operation, entityPath);
          if (maybeEntity && "id" in maybeEntity && isString(maybeEntity.id)) {
            (entityIssues[maybeEntity.id] ||= []).push({
              ...issue,
              fieldLabel: getLabel(issue.path),
            });
            return;
          }
        } catch {
          console.warn("Failed to get entity at", issue.path);
        }
      }
      globalIssues.push(issue);
    });
  }

  // 追加：校验元数据中的标签必填（清洗后需至少 1 项）
  try {
    const cleanedTags = Array.isArray(metadata?.tags)
      ? Array.from(new Set(metadata.tags.map((s) => (s ?? "").trim()).filter((s) => s.length > 0)))
      : [];
    if (cleanedTags.length === 0) {
      // 使用自定义 issue，将其作为全局错误显示；消息仅保留“必填”，标签由 getLabeledPath 渲染
      globalIssues.push({
        // @ts-expect-error: constructing minimal ZodIssue-like object for display
        code: "custom",
        path: ["metadata", "tags"],
        message: i18n.components.editor2.validation.required,
      });
    }
  } catch {
    // ignore metadata validation failures
  }

  set(editorAtoms.entityErrors, (prev) =>
    Object.keys(entityIssues).length === 0 && Object.keys(prev).length === 0 ? prev : entityIssues,
  );
  set(editorAtoms.globalErrors, (prev) =>
    prev.length === 0 && globalIssues.length === 0 ? prev : globalIssues,
  );

  return result;
});
