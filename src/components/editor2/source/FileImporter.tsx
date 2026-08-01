import { MenuItem } from "@blueprintjs/core";

import { ChangeEventHandler, FC, useRef } from "react";

import { useTranslation } from "../../../i18n/i18n";
import { AppToaster } from "../../Toaster";
import { roundActionsToEditorActions } from "../action/roundMapping";
import { toEditorOperation, toMaaOperation } from "../reconciliation";
import { normalizeRecTargetOffset } from "../siming/recTargetOffset";
import { parseOperationLoose } from "../validation/schema";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRoundActionsRecord = (value: unknown): value is Record<string, string[][]> => {
  if (!isRecord(value)) {
    return false;
  }
  const entries = Object.values(value);
  if (entries.length === 0) {
    return false;
  }
  return entries.every(
    (entry) =>
      Array.isArray(entry) &&
      entry.every(
        (tokens) =>
          Array.isArray(tokens) &&
          tokens.length > 0 &&
          tokens.every((token) => typeof token === "string"),
      ),
  );
};

const isSimingActionsRecord = (
  value: unknown,
): value is Record<string, Record<string, unknown>> => {
  if (!isRecord(value)) {
    return false;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return false;
  }
  const hasRoundNode = entries.some(([key]) => /^(检测回合\d+|回合\d+行动\d+)$/.test(key));
  return (
    hasRoundNode &&
    entries.some(
      ([, entry]) =>
        isRecord(entry) &&
        ("next" in entry ||
          "action" in entry ||
          "recognition" in entry ||
          "expected" in entry ||
          "text_doc" in entry),
    )
  );
};

const ensureDocTitle = (options: {
  titleFallback: string;
  update: Parameters<typeof toMaaOperation>[0];
}) => {
  const { titleFallback, update } = options;
  if (!update.doc) {
    update.doc = { title: titleFallback };
    return;
  }
  if (!update.doc.title || !update.doc.title.trim()) {
    update.doc.title = titleFallback;
  }
};

const importViaSimingBackend = async (params: { file: File; baseUrl: string }) => {
  const { file, baseUrl } = params;
  const form = new FormData();
  form.append("file", file, file.name);

  const resp = await fetch(`${String(baseUrl).replace(/\/$/, "")}/api/actions/import`, {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Siming导入接口失败: ${resp.status} ${text}`);
  }

  const data: {
    actions?: Record<string, unknown>;
    config_info?: Record<string, unknown>;
  } = await resp.json();
  if (!data?.actions || typeof data.actions !== "object") {
    throw new Error("Siming导入接口返回空内容");
  }

  const editorActions = roundActionsToEditorActions(
    data.actions as unknown as Record<string, string[][]>,
  );
  const configInfo = isRecord(data.config_info) ? data.config_info : {};
  const levelName =
    typeof configInfo.level_name === "string" && configInfo.level_name.trim()
      ? configInfo.level_name.trim()
      : file.name;
  const levelType = typeof configInfo.level_type === "string" ? configInfo.level_type.trim() : "";
  const levelRecognitionName =
    typeof configInfo.level_recognition_name === "string" ? configInfo.level_recognition_name : "";
  const activityDifficultyOverride =
    typeof configInfo.difficulty === "string" ? configInfo.difficulty : "";
  const recTargetOffset = normalizeRecTargetOffset(configInfo.rec_target_offset);
  const catOne = (() => {
    if (levelType === "活动" || levelType === "活动有分级") return "活动";
    if (levelType === "洞窟") return "洞窟";
    if (levelType === "主线" || levelType === "白鹄" || levelType === "兰台") return levelType;
    if (levelType === "其他" && levelRecognitionName.trim()) return "地宫";
    return levelType;
  })();
  const editorOperation = {
    minimumRequired: "v4.0.0",
    doc: { title: file.name },
    stageName: levelName,
    levelMeta: {
      stageId: levelName,
      catOne,
      catTwo: levelName,
    },
    levelRecognitionName,
    activityDifficultyOverride,
    recTargetOffset,
    opers: [],
    groups: [],
    actions: editorActions,
  };

  const maaOperation = toMaaOperation(
    editorOperation as unknown as Parameters<typeof toMaaOperation>[0],
  );
  return JSON.stringify(maaOperation, null, 2);
};

const tryParseMaaOperation = (params: { raw: unknown; fileName: string }): string | undefined => {
  try {
    const operation = parseOperationLoose(params.raw);
    const editorOperation = toEditorOperation(operation);
    ensureDocTitle({
      titleFallback: params.fileName,
      update: editorOperation,
    });
    const maaOperation = toMaaOperation(editorOperation);
    return JSON.stringify(maaOperation, null, 2);
  } catch {
    return undefined;
  }
};

export const FileImporter: FC<{ onImport: (content: string) => void }> = ({ onImport }) => {
  const t = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const fileContent = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(fileContent);
      } catch (error) {
        throw new Error(`JSON 解析失败: ${(error as Error).message || "Unknown error"}`);
      }

      const isSimingSource = isRoundActionsRecord(parsed) || isSimingActionsRecord(parsed);
      let simingImportError: unknown;
      if (isSimingSource) {
        const baseUrl =
          (import.meta as any).env?.VITE_SIMING_BASE_URL ||
          (typeof process !== "undefined" && (process as any).env?.VITE_SIMING_BASE_URL) ||
          "http://127.0.0.1:49481";
        try {
          const content = await importViaSimingBackend({ file, baseUrl });
          onImport(content);
          return;
        } catch (error) {
          simingImportError = error;
        }
      }

      const maaContent = tryParseMaaOperation({
        raw: parsed,
        fileName: file.name,
      });
      if (maaContent) {
        onImport(maaContent);
        return;
      }

      if (simingImportError) {
        throw simingImportError;
      }

      if (!isSimingSource) {
        throw new Error("无法识别的导入文件结构");
      }
    } catch (error) {
      console.warn("Failed to import file in editor2:", error);
      AppToaster.show({
        message: t.components.editor.source.FileImporter.cannot_read_file,
        intent: "danger",
      });
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <MenuItem
        icon="document-open"
        shouldDismissPopover={false}
        onClick={() => inputRef.current?.click()}
        text={
          <>
            {t.components.editor.source.FileImporter.import_local_file}
            <input
              className="hidden"
              type="file"
              accept="application/json"
              ref={inputRef}
              onChange={handleUpload}
            />
          </>
        }
      />
    </>
  );
};
