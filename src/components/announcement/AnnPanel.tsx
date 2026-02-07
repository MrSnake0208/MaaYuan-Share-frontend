import { Card, Icon } from "@blueprintjs/core";

import clsx from "clsx";
import { FC, ReactNode, useEffect, useMemo, useState } from "react";

import { useAnnouncement } from "../../apis/announcement";
import { useTranslation } from "../../i18n/i18n";
import { AnnouncementSection, parseAnnouncement } from "../../models/announcement";
import { formatError } from "../../utils/error";
import { useLazyStorage } from "../../utils/useLazyStorage";
import { CardTitle } from "../CardTitle";
import { AnnDialog } from "./AnnDialog";

const ENABLE_ANNOUNCEMENT = !["false", "0", "off", "disabled", "no"].includes(
  String(import.meta.env.VITE_ENABLE_ANNOUNCEMENT ?? "true").toLowerCase(),
);

interface AnnPanelProps {
  className?: string;
  trigger?: (params: { handleClick: () => void }) => ReactNode;
}

export const AnnPanel: FC<AnnPanelProps> = ({ className, trigger }) => {
  const enabled = ENABLE_ANNOUNCEMENT;
  const t = useTranslation();
  const { data, error } = useAnnouncement();
  const announcement = useMemo(() => (data ? parseAnnouncement(data) : undefined), [data]);
  const [lastNoticed, setLastNoticed] = useLazyStorage("copilot-last-noticed", 0);
  const [displaySections, setDisplaySections] = useState<AnnouncementSection[]>();

  const [isOpen, setIsOpen] = useState<{ yes: boolean; manually: boolean }>();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const freshSections = announcement?.sections.filter(
      ({ meta: { time, level } = {} }) => level !== "verbose" && +(time || 0) > lastNoticed,
    );

    if (freshSections?.length) {
      setIsOpen({ yes: true, manually: false });
      setDisplaySections(freshSections);
      setLastNoticed(Date.now());
    }
  }, [announcement, enabled, lastNoticed, setLastNoticed]);

  const handleClick = () => {
    setIsOpen({ yes: true, manually: true });
    setDisplaySections(announcement?.sections);
  };

  trigger ??= ({ handleClick }) => (
    <Card
      interactive
      className={clsx(
        "relative overflow-hidden !bg-gradient-to-br !from-blue-50 !to-indigo-50 " +
        "dark:!from-blue-900/20 dark:!to-indigo-900/20 " +
        "border border-blue-100 dark:border-blue-800 " +
        "hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300",
        className
      )}
      onClick={handleClick}
    >
      {/* 装饰性背景元素 */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Icon icon="info-sign" className="text-white" size={14} />
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-100">
              {t.components.announcement.AnnPanel.title}
            </span>
          </div>
          {/* 新公告徽章 */}
          {announcement && announcement.sections.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full shadow-sm">
              {announcement.sections.length} 条新公告
            </span>
          )}
        </div>

        {/* 公告列表 */}
        <div className="flex items-end gap-2">
          {announcement && (
            <ul className="flex-1 space-y-2">
              {announcement?.sections.slice(0, 3).map(({ title, meta }, index) => (
                <li
                  key={title}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 group"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs flex items-center justify-center font-medium mt-0.5">
                    {index + 1}
                  </span>
                  <span className="line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                  </span>
                  {meta?.level === "warning" && (
                    <Icon icon="warning-sign" className="text-amber-500 flex-shrink-0" size={12} />
                  )}
                </li>
              ))}
            </ul>
          )}
          {!announcement && error && (
            <div className="flex-1 text-red-500 text-sm">
              {t.components.announcement.AnnPanel.load_failed({
                error: formatError(error),
              })}
            </div>
          )}
          {/* 查看更多 */}
          <div className="flex-shrink-0 flex flex-col items-center text-gray-400 hover:text-blue-500 transition-colors">
            <Icon icon="more" size={16} />
            <span className="text-xs mt-1">更多</span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      {enabled && trigger({ handleClick })}
      {enabled && (
        <AnnDialog
          sections={displaySections}
          isOpen={!!isOpen?.yes}
          canOutsideClickClose={isOpen?.manually}
          onClose={() => setIsOpen(undefined)}
        />
      )}
    </>
  );
};
