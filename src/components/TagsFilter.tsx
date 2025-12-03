import { Button, Tag } from "@blueprintjs/core";
import clsx from "clsx";
import { FC, useMemo } from "react";

import { TAGS } from "../constants/tags";

interface Props {
  className?: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

// 简易 HEX 增加透明度工具（#RRGGBB + AA）
const withAlpha = (hex: string, alphaHex: string) =>
  /^#([\da-fA-F]{6})$/.test(hex) ? `${hex}${alphaHex}` : hex;

export const TagsFilter: FC<Props> = ({ className, value, onChange, disabled }) => {
  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (tag: string) => {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange(Array.from(next));
  };

  return (
    <div className={clsx("flex items-center gap-2 flex-wrap", className)}>
      {TAGS.map((tag) => {
        const isSelected = selected.has(tag);
        // 复用 OperationCard 中的平台标签样式（两枚标签：代号鸢、如鸢）
        // 背景/前景取决于具体标签色值
        const styleMap: Record<string, { bg: string; fg: string }> = {
          代号鸢: { bg: "#d20f39", fg: "#d20f39" },
          如鸢: { bg: "#1e66f5", fg: "#1e66f5" },
        };
        const colors = styleMap[tag];
        return (
          <Tag
            key={tag}
            interactive
            className={clsx(
              "transition border border-solid !text-xs tracking-tight !px-2 !py-1 !my-1 leading-none !min-h-0",
              !disabled && "cursor-pointer",
              disabled && "pointer-events-none opacity-50",
              // 未选中态：描边 + 浅底色
              !isSelected && "opacity-100",
            )}
            // 选中态：实底彩色 + 白字；未选中态：描边 + 浅底色（同色系）
            style={
              colors
                ? isSelected
                  ? {
                      backgroundColor: colors.bg,
                      color: "#ffffff",
                      borderColor: colors.bg,
                    }
                  : {
                      backgroundColor: withAlpha(colors.bg, "20"), // 约 12.5% 透明度
                      color: colors.fg,
                      borderColor: colors.bg,
                    }
                : undefined
            }
            aria-pressed={isSelected}
            aria-disabled={disabled}
            onClick={() => !disabled && toggle(tag)}
          >
            <div className="flex items-center">
              <div className="flex whitespace-pre">
                <span className="text-xs">{tag}</span>
              </div>
            </div>
          </Tag>
        );
      })}
      <Button
        small
        minimal
        className="!px-2"
        onClick={() => onChange([])}
        disabled={disabled || value.length === 0}
      >
        清空
      </Button>
    </div>
  );
};

TagsFilter.displayName = "TagsFilter";

export default TagsFilter;
