import {
  Button,
  ButtonGroup,
  Callout,
  Card,
  Collapse,
  Elevation,
  H3,
  H4,
  H6,
  Icon,
  Menu,
  MenuDivider,
  MenuItem,
  NonIdealState,
  Tag,
} from "@blueprintjs/core";
import { Popover2, Tooltip2 } from "@blueprintjs/popover2";
import { ErrorBoundary } from "@sentry/react";

import {
  banComments,
  deleteOperation,
  rateOperation,
  useOperation,
  useRefreshOperations,
} from "apis/operation";
import clsx from "clsx";
import { useAtom } from "jotai";
import { BanCommentsStatusEnum, CopilotInfoStatusEnum } from "maa-copilot-client";
import {
  ComponentType,
  FC,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  Suspense,
  lazy,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { copyShortCode, handleLazyDownloadJSON } from "services/operation";

import { FactItem } from "components/FactItem";
import { Paragraphs } from "components/Paragraphs";
import { RelativeTime } from "components/RelativeTime";
import { withSuspensable } from "components/Suspensable";
import { AppToaster } from "components/Toaster";
import { DrawerLayout } from "components/drawer/DrawerLayout";
import { EDifficultyLevel } from "components/entity/ELevel";
import { OpRatingType, Operation } from "models/operation";
import { toShortCode } from "models/shortCode";
import { authAtom, isAdmin } from "store/auth";
import { getProfIconPath } from "utils/profIcon";
import { wrapErrorMessage } from "utils/wrapErrorMessage";

import { useLevels } from "../../apis/level";
import { i18nDefer, useTranslation } from "../../i18n/i18n";
import { CopilotDocV1 } from "../../models/copilot.schema";
import { createCustomLevel, findLevelByStageName } from "../../models/level";
import { Level } from "../../models/operation";
import {
  OPERATORS,
  getModuleName,
  useLocalizedOperatorName,
  withDefaultRequirements,
} from "../../models/operator";
import { formatError } from "../../utils/error";
import { readOperatorStats } from "../../utils/operatorStats";
import { Confirm } from "../Confirm";
import { OperatorAvatar } from "../OperatorAvatar";
import { ReLinkRenderer } from "../ReLink";
import { UserName } from "../UserName";
import { ActionSequenceViewer } from "./ActionSequenceViewer";
import {
  buildOperationDiscDisplay,
  type OperationDiscSlot,
} from "./operationDiscDisplay";
import {
  AuthorOperationShareImage,
  AuthorOperationShareImages,
  useAuthorOperationShareImage,
} from "./AuthorOperationShareImages";
import { CommentArea } from "./comment/CommentArea";

const OperationShareDialog = lazy(() => import("./OperationShareDialog"));

const ManageMenu: FC<{
  operation: Operation;
  onRevalidateOperation: () => void;
  onDelete: () => void;
}> = ({ operation, onRevalidateOperation, onDelete }) => {
  const t = useTranslation();
  const refreshOperations = useRefreshOperations();

  const handleBanComments = async (status: BanCommentsStatusEnum) => {
    await wrapErrorMessage(
      (e) =>
        t.components.viewer.OperationViewer.operation_failed({
          error: formatError(e),
        }),
      banComments({ operationId: operation.id, status }),
    ).catch(console.warn);

    onRevalidateOperation();
  };

  const handleDelete = async () => {
    try {
      await wrapErrorMessage(
        (e) =>
          t.components.viewer.OperationViewer.delete_failed({
            error: formatError(e),
          }),
        deleteOperation({ id: operation.id }),
      );

      refreshOperations();

      AppToaster.show({
        intent: "success",
        message: t.components.viewer.OperationViewer.delete_success,
      });
      onDelete();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <>
      <Menu>
        {/* <ReLinkRenderer
          className="hover:text-inherit hover:no-underline"
          to={`/create/${operation.id}`}
          target="_blank"
          render={({ className, ...props }) => (
            <MenuItem
              icon="edit"
              text={t.components.viewer.OperationViewer.modify_task}
              {...props}
            />
          )}
        /> */}
        <ReLinkRenderer
          className="hover:text-inherit hover:no-underline"
          to={`/editor/${operation.id}`}
          target="_blank"
          render={({ className, href, onClick, onKeyDown, target }) => (
            <MenuItem
              icon="edit"
              text={t.components.viewer.OperationViewer.modify_task_v2}
              className={className}
              href={href}
              target={target}
              onClick={onClick as MouseEventHandler<HTMLElement>}
              onKeyDown={onKeyDown as KeyboardEventHandler<HTMLElement>}
            />
          )}
        />
        {operation.commentStatus === BanCommentsStatusEnum.Enabled && (
          <Confirm
            intent="danger"
            trigger={({ handleClick }) => (
              <MenuItem
                icon="comment"
                text={t.components.viewer.OperationViewer.close_comments}
                shouldDismissPopover={false}
                onClick={handleClick}
              />
            )}
            onConfirm={() => handleBanComments(BanCommentsStatusEnum.Disabled)}
          >
            <H6>{t.components.viewer.OperationViewer.close_comments}</H6>
            <p>{t.components.viewer.OperationViewer.confirm_close_comments}</p>
            <p>{t.components.viewer.OperationViewer.existing_comments_preserved}</p>
          </Confirm>
        )}
        {operation.commentStatus === BanCommentsStatusEnum.Disabled && (
          <Confirm
            trigger={({ handleClick }) => (
              <MenuItem
                icon="comment"
                text={t.components.viewer.OperationViewer.open_comments}
                shouldDismissPopover={false}
                onClick={handleClick}
              />
            )}
            onConfirm={() => handleBanComments(BanCommentsStatusEnum.Enabled)}
          >
            <H6>{t.components.viewer.OperationViewer.open_comments}</H6>
            <p>{t.components.viewer.OperationViewer.confirm_open_comments}</p>
          </Confirm>
        )}
        <MenuDivider />
        <Confirm
          intent="danger"
          confirmButtonText={t.components.viewer.OperationViewer.delete}
          repeats={3}
          onConfirm={handleDelete}
          trigger={({ handleClick }) => (
            <MenuItem
              icon="delete"
              intent="danger"
              text={t.components.viewer.OperationViewer.delete_task}
              shouldDismissPopover={false}
              onClick={handleClick}
            />
          )}
        >
          <H4>{t.components.viewer.OperationViewer.delete_task}</H4>
          <p>{t.components.viewer.OperationViewer.confirm_delete_task}</p>
          <p>{t.components.viewer.OperationViewer.three_confirmations}</p>
        </Confirm>
      </Menu>
    </>
  );
};

export const OperationViewer: ComponentType<{
  operationId: Operation["id"];
  onCloseDrawer: () => void;
  headerActions?: ReactNode;
}> = withSuspensable(
  function OperationViewer({ operationId, onCloseDrawer, headerActions }) {
    const t = useTranslation();
    const navigate = useNavigate();
    const {
      data: operation,
      error,
      mutate,
    } = useOperation({
      id: operationId,
      suspense: true,
    });

    useEffect(() => {
      // on finished loading, scroll to #fragment if any
      if (operation) {
        const fragment = window.location.hash;
        if (fragment) {
          const el = document.querySelector(fragment);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    }, [operation]);

    const { data: levels } = useLevels();

    const [auth] = useAtom(authAtom);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    // make eslint happy: we got Suspense out there
    if (!operation) throw new Error("unreachable");

    useEffect(() => {
      if (error) {
        AppToaster.show({
          intent: "danger",
          message: t.components.viewer.OperationViewer.refresh_failed({
            error: formatError(error),
          }),
        });
      }
    }, [error, t]);

    const handleRating = async (decision: OpRatingType) => {
      // cancel rating if already rated by the same type
      if (decision === operation.ratingType) {
        decision = OpRatingType.None;
      }

      wrapErrorMessage(
        (e) =>
          t.components.viewer.OperationViewer.submit_rating_failed({
            error: formatError(e),
          }),
        mutate(async (val) => {
          await rateOperation({
            id: operationId,
            rating: decision,
          });
          return val;
        }),
      ).catch(console.warn);
    };

    const handleCopyToEditor = () => {
      const shortCode = toShortCode({ id: operation.id });
      onCloseDrawer();
      navigate(`/editor?shortcode=${encodeURIComponent(shortCode)}`);
    };

	    return (
	      <>
	        <DrawerLayout
	        title={
	          <>
	            <div className="flex min-w-0 items-center gap-2">
	              <Icon icon="document" />
	              <span className="min-w-0 truncate">
	                {t.components.viewer.OperationViewer.maa_copilot_task}
	              </span>
	            </div>

	            <div className="ml-auto flex flex-wrap items-center justify-end gap-2 md:gap-4">
	              {headerActions}
	              {(operation.uploaderId === auth.userId || isAdmin(auth)) && (
	                // 使用 Portal 渲染，避免被头部容器裁剪/遮挡；提升层级与全局样式一致
	                <Popover2
	                  content={
                    <ManageMenu
                      operation={operation}
                      onRevalidateOperation={() => mutate()}
                      onDelete={() => onCloseDrawer()}
                    />
                  }
                  usePortal={true}
                  // 仅对本弹层提升层级，避免被 Drawer 内容遮挡
                  portalClassName="operation-viewer-portal"
                >
	                  <Button
	                    icon="wrench"
	                    text={t.components.viewer.OperationViewer.manage}
	                    rightIcon="caret-down"
	                  />
	                </Popover2>
	              )}

              <Button
                icon="download"
                text={t.components.viewer.OperationViewer.download_json}
                onClick={() =>
                  handleLazyDownloadJSON(
                    operation.id,
                    operation.parsedContent.doc.title,
                    Array.isArray(operation.metadata?.tags)
                      ? (operation.metadata?.tags as string[])
                      : undefined,
                  )
                }
              />

              <Button
                icon="media"
                text={t.components.viewer.OperationViewer.generate_share_image}
                onClick={() => setShareDialogOpen(true)}
              />

              <Button
                icon="clipboard"
                text={t.components.viewer.OperationViewer.copy_secret_code}
                intent="primary"
                onClick={() => copyShortCode(operation)}
              />

              <Button
                icon="share"
                text={t.components.viewer.OperationViewer.copy_to_editor_v2}
                intent="primary"
                onClick={handleCopyToEditor}
              />
            </div>
          </>
        }
      >
        <AuthorOperationShareImages operation={operation}>
          <ErrorBoundary
            fallback={
              <NonIdealState
                icon="issue"
                title={t.components.viewer.OperationViewer.render_error}
                description={t.components.viewer.OperationViewer.render_problem}
              />
            }
          >
            <OperationViewerInner levels={levels} operation={operation} handleRating={handleRating} />
          </ErrorBoundary>
        </AuthorOperationShareImages>
	        </DrawerLayout>
	        {shareDialogOpen ? (
	          <Suspense fallback={null}>
	            <OperationShareDialog
	              canManageAuthorConfig={
	                operation.uploaderId === auth.userId || isAdmin(auth)
	              }
	              operation={operation}
	              onClose={() => setShareDialogOpen(false)}
	            />
	          </Suspense>
	        ) : null}
	      </>
    );
  },
  {
    pendingTitle: i18nDefer.components.viewer.OperationViewer.loading_task,
  },
);

const OperatorCard: FC<{
  operator: CopilotDocV1.Operator;
  showExtras?: boolean;
}> = ({ operator, showExtras }) => {
  const t = useTranslation();
  const displayName = useLocalizedOperatorName(operator.name);
  const info = OPERATORS.find((o) => o.name === operator.name);
  const { module } = withDefaultRequirements(operator.requirements, info?.rarity);

  // —— 属性拓展读取（extensions）+ 兼容旧字段 ——
  const getDiscSlots = (op: CopilotDocV1.Operator): OperationDiscSlot[] => {
    // 原方案优先：并行数组（camelCase）；viewer 接口层已 camel 化
    const ds = (op as any).discsSelected ?? [];
    const ss = (op as any).discStarStones ?? [];
    const as = (op as any).discAssistStars ?? [];
    const ext = (op as any).extensions as
      | {
          discs?: { slots?: OperationDiscSlot[] };
          stats?: { starLevel?: number; attack?: number; hp?: number };
        }
      | undefined;
    const extensionSlots = ext?.discs?.slots;
    const hasLegacy = ds.length > 0 || ss.length > 0 || as.length > 0;
    if (hasLegacy) {
      return [0, 1, 2].map((i) => {
        const disc = ds[i] ?? 0;
        const starStone = ss[i] ?? "";
        const extensionSlot = extensionSlots?.find((slot) => slot.index === i);
        return {
          index: i,
          disc,
          discConfirmed:
            extensionSlot?.discConfirmed ??
            (disc !== 0 || Boolean(starStone.trim())),
          starStone,
          assistStar: as[i] ?? "",
        };
      });
    }
    // 回退：extensions.slots
    const slots = extensionSlots;
    if (slots && slots.length > 0) {
      const norm = [...slots]
        .filter((s) => s && typeof s.index === "number")
        .map((s, i) => ({
          index: s.index ?? i,
          disc: s.disc ?? 0,
          discConfirmed: s.discConfirmed ?? (s.disc ?? 0) !== 0,
          starStone: s.starStone ?? "",
          assistStar: s.assistStar ?? "",
        }))
        .sort((a, b) => a.index - b.index);
      while (norm.length < 3)
        norm.push({
          index: norm.length,
          disc: 0,
          discConfirmed: false,
          starStone: "",
          assistStar: "",
        });
      return norm.slice(0, 3);
    }
    return [0, 1, 2].map((i) => ({
      index: i,
      disc: 0,
      discConfirmed: false,
      starStone: "",
      assistStar: "",
    }));
  };
  // 读取命盘集合与选中结果（优先 extensions.slots；回退 discsSelected）
  const discList = (info as any)?.discs ?? [];
  const slots = getDiscSlots(operator);
  const discDisplays = buildOperationDiscDisplay(slots, discList);
  const visibleDiscDisplays = showExtras
    ? discDisplays
    : discDisplays.filter((display) => display.item);

  const discColorClasses = (color?: string) => {
    switch (color) {
      case "金":
        return "!bg-yellow-100 dark:!bg-yellow-900 dark:!text-yellow-200 !text-yellow-800";
      case "紫":
        return "!bg-purple-100 dark:!bg-purple-900 dark:!text-purple-200 !text-purple-800";
      case "蓝":
        return "!bg-blue-100 dark:!bg-blue-900 dark:!text-blue-200 !text-blue-800";
      case "橙":
        return "!bg-orange-100 dark:!bg-orange-900 dark:!text-orange-200 !text-orange-800";
      default:
        return "!bg-gray-300 dark:!bg-gray-600 opacity-15 dark:opacity-25 hover:opacity-30 dark:hover:opacity-50";
    }
  };

  return (
    <div className="relative flex items-start">
      <div className="relative w-[23ch] shrink-0">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden shadow-md mx-auto">
          <OperatorAvatar
            id={info?.id}
            rarity={info?.rarity}
            className="w-20 h-20"
            fallback={displayName}
            sourceSize={96}
          />
          {info && info.prof !== "TOKEN" && (
            <img
              className="absolute top-0 right-0 w-5 h-5 p-px bg-gray-600 rounded-tr-md"
              src={getProfIconPath(info.prof)}
              alt={info.prof}
            />
          )}
          {module !== CopilotDocV1.Module.Default && (
            <div
              title={t.components.viewer.OperationViewer.module_title({
                count: module,
                name: getModuleName(module),
              })}
              className="absolute -bottom-1 right-1 font-serif font-bold text-lg text-white [text-shadow:0_0_3px_#a855f7,0_0_5px_#a855f7]"
            >
              {module === CopilotDocV1.Module.Original ? (
                <Icon icon="small-square" />
              ) : (
                getModuleName(module)
              )}
            </div>
          )}
        </div>
        <h4 className="mt-1 -mx-2 leading-4 font-semibold tracking-tighter text-center">
          {displayName}
        </h4>
        {/* 星级（展示 1..5）与基础数值（仅当作业有设置时显示） */}
        {(() => {
          const stats = readOperatorStats(operator);
          const show = stats.hasStar || stats.hasAttack || stats.hasHp;
          if (!show) return null;
          const current = Math.min(5, Math.max(0, stats.starLevel));
          return (
            <div className="mt-1 flex flex-col items-center gap-1 select-none">
              {stats.hasStar && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                    <Icon
                      key={n}
                      icon="star"
                      className={clsx(
                        "w-4 h-4",
                        n <= current ? "text-yellow-500 opacity-100" : "text-gray-500 opacity-40",
                      )}
                    />
                  ))}
                </div>
              )}
              {(stats.hasAttack || stats.hasHp) && (
                <div className="flex items-center gap-2 text-xs opacity-80">
                  {stats.hasAttack && <span title="攻击">攻: {Math.max(0, stats.attack)}</span>}
                  {stats.hasHp && <span title="生命">血: {Math.max(0, stats.hp)}</span>}
                </div>
              )}
            </div>
          );
        })()}
        {visibleDiscDisplays.length > 0 && (
          <div className="mt-1 mx-[-4px] grid gap-1">
            {visibleDiscDisplays.map(
              ({ item: d, _slot, forbidden, starStone, assistStar }) => {
                return (
                  <div key={_slot} className={clsx("flex gap-1", !showExtras && "justify-center")}>
                    {/* 提升命盘描述 Tooltip 的层级，避免被 Drawer 内容遮挡 */}
                    {d ? (
                      <Tooltip2
                        content={forbidden ? `不能有：${d.desp}` : d.desp}
                        usePortal={true}
                        portalClassName="operation-viewer-portal"
                      >
                        <div
                          className={clsx(
                            "bp4-button bp4-minimal bp4-small w-[7ch] shrink-0 whitespace-nowrap !p-0 px-1 flex items-center justify-center font-serif !font-bold !text-sm !rounded-md !border-2 !border-current relative",
                            discColorClasses(d.color),
                            forbidden && "!border-red-600 dark:!border-red-400",
                          )}
                        >
                          <span className="bp4-button-text inline-flex w-full min-w-0 items-center justify-center gap-1 overflow-hidden">
                            {forbidden ? (
                              <span className="w-4 h-4 shrink-0 rounded-full bg-red-600 text-white border border-white/80 text-[12px] leading-[14px] inline-flex items-center justify-center">
                                ×
                              </span>
                            ) : null}
                            <span
                              className={clsx(
                                "min-w-0",
                                d.multiline
                                  ? "whitespace-normal text-center leading-3"
                                  : "truncate",
                                forbidden && "opacity-60",
                              )}
                            >
                              {d.abbreviation}
                            </span>
                          </span>
                        </div>
                      </Tooltip2>
                    ) : null}
                    {showExtras && starStone ? (
                      <div
                        className="bp4-button bp4-minimal bp4-small w-[7ch] shrink-0 whitespace-nowrap !p-0 px-1 flex items-center justify-center font-serif !font-bold !text-sm !rounded-md !border-2 !border-current bg-slate-200 dark:bg-slate-600"
                        title={starStone}
                      >
                        <span className="bp4-button-text">{starStone}</span>
                      </div>
                    ) : null}
                    {showExtras && assistStar ? (
                      <div
                        className="bp4-button bp4-minimal bp4-small w-[7ch] shrink-0 whitespace-nowrap !p-0 px-1 flex items-center justify-center font-serif !font-bold !text-sm !rounded-md !border-2 !border-current bg-slate-200 dark:bg-slate-600"
                        title={assistStar}
                      >
                        <span className="bp4-button-text">{assistStar}</span>
                      </div>
                    ) : null}
                  </div>
                );
              },
            )}
          </div>
        )}
        {/* prof icon moved into avatar container to stick to avatar corner */}
      </div>
    </div>
  );
};

export function OperationViewerInner({
  levels,
  operation,
  handleRating,
}: {
  levels: Level[];
  operation: Operation;
  handleRating: (decision: OpRatingType) => Promise<void>;
}) {
  const t = useTranslation();
  return (
    <div className="h-full overflow-auto p-4 md:p-8">
      <H3>
        {operation.parsedContent.doc.title}
        {operation.status === CopilotInfoStatusEnum.Private && (
          <Tag minimal className="ml-2 font-normal opacity-75">
            {t.components.viewer.OperationViewer.private}
          </Tag>
        )}
      </H3>

      <div className="flex flex-col-reverse md:grid grid-rows-1 grid-cols-3 gap-2 md:gap-8">
        <div className="flex flex-col">
          <Paragraphs content={operation.parsedContent.doc.details} linkify />
        </div>

        <div className="flex flex-col">
          <FactItem title={t.components.viewer.OperationViewer.stage}>
            <EDifficultyLevel
              level={(() => {
                // 优先使用后端直出字段；回退到本地映射
                const levelFromBackend =
                  operation.preLevel ||
                  findLevelByStageName(levels, operation.parsedContent.stageName) ||
                  createCustomLevel(operation.parsedContent.stageName);
                // 标签显示规则：{catOne} | {name}
                const displayLevel = {
                  ...levelFromBackend,
                  // 与 OperationCard 保持一致：使用 name 渲染第二部分
                  catTwo: levelFromBackend.name,
                };
                return displayLevel;
              })()}
              difficulty={operation.parsedContent.difficulty}
            />
          </FactItem>

          <FactItem relaxed className="items-start" title={"作业点赞数"}>
            <div className="flex items-center mr-2">
              <Icon icon="thumbs-up" className="mr-1.5" />
              <span className="tabular-nums text-gray-800 dark:text-slate-100 font-bold">
                {operation.like}
              </span>
            </div>

            <ButtonGroup className="flex items-center ml-2">
              <Tooltip2 content="o(*≧▽≦)ツ" placement="bottom">
                <Button
                  icon="thumbs-up"
                  intent={operation.ratingType === OpRatingType.Like ? "success" : "none"}
                  className="mr-2"
                  active={operation.ratingType === OpRatingType.Like}
                  onClick={() => handleRating(OpRatingType.Like)}
                />
              </Tooltip2>
              <Tooltip2 content=" ヽ(。>д<)ｐ" placement="bottom">
                <Button
                  icon="thumbs-down"
                  intent={operation.ratingType === OpRatingType.Dislike ? "danger" : "none"}
                  active={operation.ratingType === OpRatingType.Dislike}
                  onClick={() => handleRating(OpRatingType.Dislike)}
                />
              </Tooltip2>
            </ButtonGroup>
          </FactItem>
        </div>

        <div className="flex flex-wrap md:flex-col items-start select-none tabular-nums gap-4">
          <FactItem dense title={t.components.viewer.OperationViewer.views} icon="eye-open">
            <span className="text-gray-800 dark:text-slate-100 font-bold">{operation.views}</span>
          </FactItem>

          <FactItem dense title={t.components.viewer.OperationViewer.published_at} icon="time">
            <span className="text-gray-800 dark:text-slate-100 font-bold">
              <RelativeTime moment={operation.uploadTime} />
            </span>
          </FactItem>

          <FactItem dense title={t.components.viewer.OperationViewer.author} icon="user">
            <UserName
              className="text-gray-800 dark:text-slate-100 font-bold"
              userId={operation.uploaderId}
            >
              {operation.uploader}
            </UserName>
          </FactItem>

          {/* 搬运信息或原创作者填写的来源链接 */}
          {(operation.metadata?.sourceType === "repost" || operation.metadata?.repostUrl) && (
            <FactItem
              relaxed
              className="items-start"
              title={t.components.editor2.InfoEditor.source}
              icon="share"
            >
              <div className="flex flex-col gap-1 text-gray-800 dark:text-slate-100">
                <div className="flex items-center gap-2">
                  <Tag
                    minimal
                    intent={operation.metadata?.sourceType === "repost" ? "warning" : "success"}
                  >
                    {operation.metadata?.sourceType === "repost"
                      ? t.components.editor2.InfoEditor.source_repost
                      : t.components.editor2.InfoEditor.source_original}
                  </Tag>
                </div>
                {operation.metadata?.sourceType === "repost" &&
                  operation.metadata?.repostAuthor && (
                    <div className="text-sm">
                      {t.components.editor2.InfoEditor.repost_author}:{" "}
                      {operation.metadata.repostAuthor}
                    </div>
                  )}
                {operation.metadata?.sourceType === "repost" &&
                  operation.metadata?.repostPlatform && (
                    <div className="text-sm">
                      {t.components.editor2.InfoEditor.repost_platform}:{" "}
                      {operation.metadata.repostPlatform}
                    </div>
                  )}
                {operation.metadata?.repostUrl && (
                  <div className="text-sm break-all">
                    {t.components.editor2.InfoEditor.repost_link}:
                    <a
                      className="underline hover:no-underline"
                      href={operation.metadata.repostUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {operation.metadata.repostUrl}
                    </a>
                  </div>
                )}
              </div>
            </FactItem>
          )}
        </div>
      </div>

      <div className="h-[1px] w-full bg-gray-200 mt-4 mb-6" />

      <ErrorBoundary
        fallback={
          <NonIdealState
            icon="issue"
            title={t.components.viewer.OperationViewer.render_error}
            description={t.components.viewer.OperationViewer.render_preview_problem}
            className="h-96 bg-stripe rounded"
          />
        }
      >
        <OperationViewerInnerDetails operation={operation} />
      </ErrorBoundary>

      <div className="h-[1px] w-full bg-gray-200 mt-4 mb-6" />

      <div className="mb-6">
        <H4 className="mb-4" id="comment">
          {operation.commentStatus === BanCommentsStatusEnum.Disabled
            ? t.components.viewer.OperationViewer.comments
            : t.components.viewer.OperationViewer.comments_count({
                count: operation.commentsCount,
              })}
        </H4>
        {operation.commentStatus === BanCommentsStatusEnum.Disabled ? (
          <NonIdealState
            icon="tree"
            title={t.components.viewer.OperationViewer.comments_closed}
            description={t.components.viewer.OperationViewer.comments_closed_note}
          />
        ) : (
          <CommentArea operationId={operation.id} />
        )}
      </div>
    </div>
  );
}
function OperationViewerInnerDetails({ operation }: { operation: Operation }) {
  const t = useTranslation();
  const [showOperators, setShowOperators] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [operatorView, setOperatorView] = useState<"native" | "share">(
    "native",
  );
  const operatorShareImageUrl = useAuthorOperationShareImage("operators");
  const actionShareImageUrl = useAuthorOperationShareImage("actions");
  // 眼睛开关：控制是否显示星石/辅星，默认关闭（不显示）
  const [showExtras, setShowExtras] = useState(false);

  return (
    <div>
      <div className="flex items-center flex-wrap">
        <H4
          className="inline-flex items-center cursor-pointer hover:opacity-80"
          onClick={() => setShowOperators((v) => !v)}
        >
          {t.components.viewer.OperationViewer.operators_and_groups}
          <Icon
            icon="chevron-down"
            className={clsx("ml-1 transition-transform", showOperators && "rotate-180")}
          />
        </H4>
        <details className="inline ml-2">
          <summary className="inline cursor-pointer">
            <Icon icon="help" size={14} className="mb-1 opacity-50" />
          </summary>
          <Callout intent="primary" icon={null} className="mb-4">
            <p>
              {t.components.viewer.OperationViewer.operators_and_groups_note.jsx({
                operators: (s) => <b>{s}</b>,
                groups: (s) => <b>{s}</b>,
              })}
            </p>
          </Callout>
        </details>
        {operatorShareImageUrl ? (
          <ButtonGroup minimal className="ml-2">
            <Button
              icon="people"
              active={operatorView === "native"}
              intent={operatorView === "native" ? "primary" : "none"}
              onClick={() => setOperatorView("native")}
            >
              原有视图
            </Button>
            <Button
              icon="media"
              active={operatorView === "share"}
              intent={operatorView === "share" ? "primary" : "none"}
              onClick={() => setOperatorView("share")}
            >
              分享图
            </Button>
          </ButtonGroup>
        ) : null}
        {operatorView === "native" ? (
          <Icon
            icon={showExtras ? "eye-open" : "eye-off"}
            size={14}
            className="ml-2 mb-1 opacity-60 cursor-pointer hover:opacity-90 align-middle"
            onClick={() => setShowExtras((v) => !v)}
            title={showExtras ? "隐藏星石/辅星" : "显示星石/辅星"}
          />
        ) : null}
      </div>
      <Collapse isOpen={showOperators}>
        {operatorView === "share" && operatorShareImageUrl ? (
          <AuthorOperationShareImage kind="operators" />
        ) : (
          <>
            <div className="mt-2 flex flex-wrap gap-8">
              {!operation.parsedContent.opers?.length &&
                !operation.parsedContent.groups?.length && (
                  <NonIdealState
                    className="my-2"
                    title={t.components.viewer.OperationViewer.no_operators}
                    description={t.components.viewer.OperationViewer.no_operators_added}
                    icon="slash"
                    layout="horizontal"
                  />
                )}
              {operation.parsedContent.opers?.map((operator) => (
                <OperatorCard
                  key={operator.name}
                  operator={operator}
                  showExtras={showExtras}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {operation.parsedContent.groups?.map((group) => (
                <Card
                  elevation={Elevation.ONE}
                  className="!p-2 flex flex-col items-center"
                  key={group.name}
                >
                  <H6 className="mb-3 text-gray-800">{group.name}</H6>
                  <div className="flex flex-wrap px-2 gap-8">
                    {group.opers?.filter(Boolean).map((operator) => (
                      <OperatorCard
                        key={operator.name}
                        operator={operator}
                        showExtras={showExtras}
                      />
                    ))}

                    {group.opers?.filter(Boolean).length === 0 && (
                      <span className="text-zinc-500">
                        {t.components.viewer.OperationViewer.no_operator}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Collapse>

      <H4
        className="mt-6 inline-flex items-center cursor-pointer hover:opacity-80"
        onClick={() => setShowActions((v) => !v)}
      >
        {t.components.viewer.OperationViewer.action_sequence}
        <Icon
          icon="chevron-down"
          className={clsx("ml-1 transition-transform", showActions && "rotate-180")}
        />
      </H4>
      <Collapse isOpen={showActions}>
        <ActionSequenceViewer
          operation={operation}
          shareImage={
            actionShareImageUrl ? (
              <AuthorOperationShareImage kind="actions" />
            ) : undefined
          }
        />
      </Collapse>
    </div>
  );
}
