/**
 * Editor v2 预览抽屉
 * - 复用 OperationViewerInner 渲染，与发布后的展示一致（交互禁用）
 * - 数据来源：editor2 的表单状态（Jotai atoms）
 * - 设计原则：最小侵入，不改动现有 OperationViewer 数据加载逻辑
 */
import { Button, Drawer, DrawerSize, NonIdealState } from "@blueprintjs/core";
import { ErrorBoundary } from "@sentry/react";
import { useAtomValue } from "jotai";
import { FC, useMemo, useState } from "react";

import { CopilotInfoStatusEnum, BanCommentsStatusEnum } from "maa-copilot-client";
import { DrawerLayout } from "components/drawer/DrawerLayout";
import { useLevels } from "../../apis/level";
import { useTranslation } from "../../i18n/i18n";
import { Operation, OpRatingType } from "../../models/operation";
import { editorAtoms } from "./editor-state";
import { OperationViewerInner } from "../viewer/OperationViewer";

// 将 editor2 当前状态映射为 Viewer 可消费的 Operation 结构
function usePreviewOperation(): Operation {
  const editorOp = useAtomValue(editorAtoms.operation);
  const metadata = useAtomValue(editorAtoms.metadata);

  // 直接复用编辑器中的结构作为 parsedContent；为缺失字段提供占位
  const parsedContent = useMemo(() => {
    // 深拷贝以避免原地修改
    const cloned = JSON.parse(JSON.stringify(editorOp));
    // 确保 doc 存在
    cloned.doc = cloned.doc || { title: "（未命名）", details: "" };
    // 确保基础字段存在
    cloned.stageName = cloned.stageName || "";
    cloned.difficulty = cloned.difficulty || 0;
    cloned.opers = Array.isArray(cloned.opers) ? cloned.opers : [];
    cloned.groups = Array.isArray(cloned.groups) ? cloned.groups : [];
    cloned.actions = Array.isArray(cloned.actions) ? cloned.actions : [];
    return cloned;
  }, [editorOp]);

  const operation: Operation = {
    // CopilotInfo（后端提供）的字段在预览时使用占位/默认值
    id: -1 as unknown as Operation["id"],
    uploader: "预览",
    uploaderId: 0 as any,
    uploadTime: new Date().toISOString() as any,
    views: 0,
    like: 0,
    dislike: 0,
    notEnoughRating: true,
    ratingRatio: 0,
    ratingLevel: 0 as any,
    ratingType: OpRatingType.None,
    status: CopilotInfoStatusEnum.Private,
    commentStatus: BanCommentsStatusEnum.Enabled,
    // 预览不提供后端直出 Level，交给 Viewer 内部回退逻辑
    preLevel: undefined,
    metadata: metadata
      ? {
          sourceType: metadata.sourceType,
          repostAuthor: metadata.repostAuthor || "",
          repostPlatform: metadata.repostPlatform || "",
          repostUrl: metadata.repostUrl || "",
          tags: metadata.tags || [],
        }
      : undefined,
    parsedContent: parsedContent as any,
  };

  return operation;
}

export const EditorPreviewTrigger: FC<{ buttonProps?: any }> = ({ buttonProps }) => {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const operation = usePreviewOperation();
  const { data: levels } = useLevels();

  return (
    <>
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        size={DrawerSize.LARGE}
        className="max-w-[1100px]"
      >
        <DrawerLayout
          title={
            <>
              {t.components?.viewer?.OperationViewer?.maa_copilot_task || "作业预览"}
              <span className="ml-2 text-xs opacity-70">（预览模式）</span>
            </>
          }
        >
          <ErrorBoundary
            fallback={
              <NonIdealState
                icon="issue"
                title={t.components.viewer.OperationViewer.render_error}
                description={t.components.viewer.OperationViewer.render_problem}
              />
            }
          >
            <OperationViewerInner
              levels={levels || []}
              operation={operation}
              // 预览模式下禁用评分交互
              handleRating={async () => {}}
            />
          </ErrorBoundary>
        </DrawerLayout>
      </Drawer>

      <Button
        icon="eye-open"
        text={t.components.editor2?.EditorToolbar?.preview || "预览"}
        {...buttonProps}
        onClick={() => setOpen(true)}
      />
    </>
  );
};
