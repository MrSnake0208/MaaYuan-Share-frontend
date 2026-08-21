import { useAtomValue, useSetAtom } from "jotai";
import { useAtomDevtools } from "jotai-devtools";
import { useAtomCallback } from "jotai/utils";
import { CopilotInfoStatusEnum } from "maa-copilot-client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { OperationEditor } from "components/editor2/Editor";

import { useLevels } from "../apis/level";
import { createOperation, getOperation, updateOperation, useOperation } from "../apis/operation";
import { withSuspensable } from "../components/Suspensable";
import { AppToaster } from "../components/Toaster";
import { defaultEditorState, editorAtoms, historyAtom } from "../components/editor2/editor-state";
import { toEditorOperation } from "../components/editor2/reconciliation";
import { toSimingOperationRemote } from "../components/editor2/siming-export";
import type { EditorMetadata } from "../components/editor2/types";
import { validateOriginalOperatorRequirements } from "../components/editor2/validation/editorSourceValidation";
import { parseOperationLoose } from "../components/editor2/validation/schema";
import { editorValidationAtom } from "../components/editor2/validation/validation";
import { i18n, useTranslation } from "../i18n/i18n";
import { CopilotDocV1 } from "../models/copilot.schema";
import { findLevelByStageName } from "../models/level";
import { Level } from "../models/operation";
import { parseShortCode } from "../models/shortCode";
import { stripOperationExportFields } from "../services/operation";
import {
  buildOperationMetadataPayload,
  validateEditorMetadata,
} from "../services/operationMetadata";
import { formatError } from "../utils/error";
import { wrapErrorMessage } from "../utils/wrapErrorMessage";

type CamelLevelMeta = CopilotDocV1.LevelMeta | undefined;

const buildCamelLevelMeta = (
  level: Level | undefined,
  stageName?: string,
  existing?: CamelLevelMeta,
): CamelLevelMeta => {
  if (level) {
    // 保留用户在编辑器中对 catThree 的输入，避免被所选关卡默认值覆盖
    return {
      stageId: level.stageId,
      levelId: level.levelId,
      name: level.name,
      catOne: level.catOne,
      catTwo: level.catTwo,
      catThree: existing?.catThree ?? level.catThree,
      width: level.width,
      height: level.height,
    };
  }
  if (existing) {
    if (!existing.stageId && stageName) {
      return {
        ...existing,
        stageId: stageName,
      };
    }
    return existing;
  }
  if (!stageName) {
    return undefined;
  }
  return {
    stageId: stageName,
  };
};

const toSnakeLevelMeta = (meta: CamelLevelMeta) =>
  meta
    ? {
        stage_id: meta.stageId,
        level_id: meta.levelId,
        name: meta.name,
        cat_one: meta.catOne,
        cat_two: meta.catTwo,
        cat_three: meta.catThree,
        width: meta.width,
        height: meta.height,
      }
    : undefined;

export const EditorPage = withSuspensable(() => {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id ? +params.id : undefined;
  const isNew = !id;

  const [preLevel, setPreLevel] = useState<Level | undefined>(undefined);
  const setEditorPreLevel = useCallback(
    (level?: Level) => {
      setPreLevel(level);
    },
    [setPreLevel],
  );

  const apiOperation = useOperation({
    id,
    suspense: true,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  }).data;
  const t = useTranslation();
  const resetEditor = useSetAtom(editorAtoms.reset);
  const setMetadataLocked = useSetAtom(editorAtoms.metadataLocked);
  const operatorsLocked = useAtomValue(editorAtoms.operatorsLocked);
  const currentOperation = useAtomValue(editorAtoms.operation);
  const { data: levels } = useLevels({ suspense: false });
  const [searchParams, setSearchParams] = useSearchParams();
  const importShortcode = searchParams.get("shortcode");
  const importedShortcodeRef = useRef<string | null>(null);

  const validateMetadata = useCallback(
    (metadata: EditorMetadata) => {
      const validation = validateEditorMetadata(metadata);
      if (validation.ok) {
        return { ok: true as const };
      }
      if (validation.reason === "invalid-url") {
        return {
          ok: false as const,
          message: t.pages.editor.validation.metadata_invalid_url,
        };
      }
      if (validation.reason === "contains-cjk") {
        return {
          ok: false as const,
          message: t.pages.editor.validation.metadata_url_no_cjk,
        };
      }

      const labels = {
        tags: t.components.editor2.InfoEditor.tags,
        repostAuthor: t.components.editor2.InfoEditor.repost_author,
        repostPlatform: t.components.editor2.InfoEditor.repost_platform,
        repostUrl: t.components.editor2.InfoEditor.repost_link,
      };
      const missingFields = validation.fields.map((field) => labels[field]);
      if (missingFields.length > 0) {
        return {
          ok: false as const,
          message: t.pages.editor.validation.metadata_missing({
            fields: missingFields.join("、"),
          }),
        };
      }

      return { ok: true as const };
    },
    [t],
  );

  // 统一遵循 Hooks 规则：避免条件调用，保证调用顺序一致
  // devtools 在非开发环境通常不会生效，但保持调用安全无副作用
  useAtomDevtools(historyAtom, { name: "editorStateAtom" });

  useLayoutEffect(() => {
    // 将后端返回的预计算关卡信息注入全局，供 InfoEditor 使用
    setEditorPreLevel(apiOperation?.preLevel);
    if (apiOperation) {
      const serverMetadata = apiOperation?.metadata;
      resetEditor({
        operation: toEditorOperation(parseOperationLoose(JSON.parse(apiOperation.content))),
        metadata: {
          visibility: apiOperation.status === CopilotInfoStatusEnum.Public ? "public" : "private",
          sourceType: serverMetadata?.sourceType === "repost" ? "repost" : "original",
          repostAuthor: serverMetadata?.repostAuthor ?? "",
          repostPlatform: serverMetadata?.repostPlatform ?? "",
          repostUrl: serverMetadata?.repostUrl ?? "",
          tags: serverMetadata?.tags ?? [],
        },
      });
    } else {
      resetEditor(defaultEditorState);
    }
  }, [apiOperation, resetEditor, setEditorPreLevel]);

  useEffect(() => {
    if (!importShortcode) {
      importedShortcodeRef.current = null;
      return;
    }

    if (importedShortcodeRef.current === importShortcode) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const shortCodeContent = parseShortCode(importShortcode);

        if (!shortCodeContent) {
          throw new Error(t.components.editor.source.ShortCodeImporter.invalid_shortcode);
        }

        const operationData = await getOperation({ id: shortCodeContent.id });
        setEditorPreLevel(operationData.preLevel);
        const operationContent = operationData.parsedContent;

        if (operationContent.doc.title === t.models.converter.invalid_operation_content) {
          throw new Error(t.components.editor.source.ShortCodeImporter.cannot_parse_content);
        }

        const sanitizedContent = stripOperationExportFields(
          operationContent as unknown as Record<string, unknown>,
        );
        const parsedOperation = parseOperationLoose(sanitizedContent);
        const importedOp = toEditorOperation(parsedOperation);
        // 拦截：若开启密探锁定，则跳过对 opers/groups 的变更
        let spyChangeAttempted = false;
        try {
          const nextOpersJson = JSON.stringify(importedOp.opers ?? []);
          const currOpersJson = JSON.stringify(currentOperation.opers ?? []);
          const nextGroupsJson = JSON.stringify(importedOp.groups ?? []);
          const currGroupsJson = JSON.stringify(currentOperation.groups ?? []);
          spyChangeAttempted = nextOpersJson !== currOpersJson || nextGroupsJson !== currGroupsJson;
        } catch {}
        if (operatorsLocked) {
          importedOp.opers = currentOperation.opers;
          importedOp.groups = currentOperation.groups;
        }

        resetEditor({
          operation: importedOp,
          metadata: {
            // 神秘代码导入：默认仅自己可见
            visibility: "private",
            // 修正：导入后本次编辑视为“搬运”；
            // 若原作业为搬运则沿用原作业元数据；否则填充上传者/平台/链接。
            sourceType: "repost",
            repostAuthor:
              (operationData.metadata?.sourceType === "repost"
                ? operationData.metadata?.repostAuthor
                : operationData.uploader) ?? "",
            repostPlatform:
              (operationData.metadata?.sourceType === "repost"
                ? operationData.metadata?.repostPlatform
                : "作业站") ?? "",
            repostUrl:
              (operationData.metadata?.sourceType === "repost"
                ? operationData.metadata?.repostUrl
                : `https://share.maayuan.top/?op=${operationData.id}`) ?? "",
            // 补齐：导入标签（多选 AND），从后端返回/映射到的 metadata.tags 读取
            tags: Array.isArray(operationData.metadata?.tags)
              ? Array.from(
                  new Set(
                    (operationData.metadata?.tags ?? [])
                      .map((s) => (s ?? "").trim())
                      .filter((s) => s.length > 0),
                  ),
                )
              : [],
          },
        });
        // 神秘代码导入：锁定作业来源编辑，保护原作者
        setMetadataLocked(true);
        if (operatorsLocked && spyChangeAttempted) {
          AppToaster.show({
            intent: "warning",
            message: "已开启密探锁定，密探变更已跳过（详见报告）",
          });
        }
        importedShortcodeRef.current = importShortcode;
      } catch (error) {
        console.warn(error);
        AppToaster.show({
          intent: "danger",
          message: t.components.editor.source.ShortCodeImporter.load_failed + formatError(error),
        });
        importedShortcodeRef.current = importShortcode;
      } finally {
        if (!cancelled) {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete("shortcode");
              return next;
            },
            { replace: true },
          );
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [importShortcode, resetEditor, setSearchParams, setEditorPreLevel, setMetadataLocked, t]);

  const handleSubmit = useAtomCallback(
    useCallback(
      async (get, set) => {
        const result = set(editorValidationAtom);
        if (!result.success) {
          set(editorAtoms.errorsVisible, true);
          AppToaster.show({
            message: i18n.pages.editor.validation_error,
            intent: "danger",
          });
          return false;
        }
        const baseOperation = result.data;
        const editorOperation = get(editorAtoms.operation);
        const editorMetadata = get(editorAtoms.metadata);
        const operatorRequirementIssues = validateOriginalOperatorRequirements(
          editorMetadata,
          editorOperation,
        );
        if (operatorRequirementIssues.length > 0) {
          const fieldLabels = {
            starLevel: "星级",
            disc: "命盘",
            starStone: "星石",
          };
          AppToaster.show({
            message: i18n.pages.editor.validation.original_operator_missing({
              fields: operatorRequirementIssues
                .map(
                  (issue) =>
                    `${issue.operatorName}：${issue.fields
                      .map((field) => fieldLabels[field])
                      .join("、")}`,
                )
                .join("；"),
            }),
            intent: "danger",
          });
          return false;
        }
        const metadataValidation = validateMetadata(editorMetadata);
        if (!metadataValidation.ok) {
          AppToaster.show({
            message: metadataValidation.message,
            intent: "danger",
          });
          return false;
        }
        const metadataPayload = buildOperationMetadataPayload(editorMetadata);
        // 解析所选关卡，便于洞窟时设置 cave_type
        const selectedLevel = levels
          ? findLevelByStageName(
              levels,
              (baseOperation as any).stageName ??
                (baseOperation as any).stage_name ??
                editorOperation.stageName ??
                editorOperation["stage_name"] ??
                "",
            )
          : undefined;

        // 调试输出：创建作业时打印当前选择的关卡分类信息
        if (selectedLevel) {
          // eslint-disable-next-line no-console
          console.log("[CreateOperation] level meta:", {
            catOne: selectedLevel.catOne,
            catTwo: selectedLevel.catTwo,
            catThree: selectedLevel.catThree,
            stageId: selectedLevel.stageId,
            name: selectedLevel.name,
          });
        } else {
          // eslint-disable-next-line no-console
          console.log("[CreateOperation] level meta: <none>");
        }

        const stageNameCandidate =
          (baseOperation as any).stage_name ??
          (baseOperation as any).stageName ??
          editorOperation.stageName ??
          (editorOperation as any).stage_name ??
          "";

        const camelLevelMeta = buildCamelLevelMeta(
          selectedLevel,
          stageNameCandidate,
          editorOperation.levelMeta,
        );

        const editorOperationWithMeta = { ...editorOperation };
        if (camelLevelMeta) {
          editorOperationWithMeta.levelMeta = camelLevelMeta;
        } else {
          delete (editorOperationWithMeta as any).levelMeta;
        }
        set(editorAtoms.operation, editorOperationWithMeta);

        const snakeLevelMeta = toSnakeLevelMeta(camelLevelMeta);
        if (snakeLevelMeta) {
          (baseOperation as any).level_meta = snakeLevelMeta;
        } else {
          delete (baseOperation as any).level_meta;
        }

        const levelForExport: Level | undefined =
          selectedLevel ??
          (camelLevelMeta
            ? {
                stageId: camelLevelMeta.stageId ?? "",
                levelId: camelLevelMeta.levelId ?? "",
                name: camelLevelMeta.name ?? "",
                catOne: camelLevelMeta.catOne ?? "",
                catTwo: camelLevelMeta.catTwo ?? "",
                catThree: camelLevelMeta.catThree ?? "",
                width: camelLevelMeta.width ?? 0,
                height: camelLevelMeta.height ?? 0,
              }
            : undefined);

        const status =
          editorMetadata.visibility === "public"
            ? CopilotInfoStatusEnum.Public
            : CopilotInfoStatusEnum.Private;

        const upload = async () => {
          const operation = await toSimingOperationRemote(baseOperation, editorOperationWithMeta, {
            level: levelForExport,
          });
          if (id) {
            await updateOperation({
              id,
              content: JSON.stringify(operation),
              status,
              metadata: metadataPayload,
            });
            AppToaster.show({
              message: i18n.pages.editor.edit.success,
              intent: "success",
            });
            navigate(`/?op=${id}`);
          } else {
            const newId = await createOperation({
              content: JSON.stringify(operation),
              status,
              metadata: metadataPayload,
            });
            AppToaster.show({
              message: i18n.pages.editor.create.success,
              intent: "success",
            });
            if (newId) {
              navigate(`/?op=${newId}`);
            } else {
              navigate("/");
            }
          }
        };

        await wrapErrorMessage(
          (e) => i18n.pages.editor.upload_failed({ error: formatError(e) }),
          upload(),
        );
        return true;
      },
      [id, levels, navigate, validateMetadata],
    ),
  );

  return (
    <OperationEditor
      preLevel={preLevel}
      subtitle={isNew ? t.pages.editor.create.subtitle : t.pages.editor.edit.subtitle}
      submitAction={isNew ? t.pages.editor.create.submit : t.pages.editor.edit.submit}
      onSubmit={handleSubmit}
    />
  );
});
