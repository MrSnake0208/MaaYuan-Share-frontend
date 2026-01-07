import { H2 } from "@blueprintjs/core";

import { Markdown } from "components/Markdown";

import changelog from "../../CHANGELOG.md?raw";

import { useTranslation } from "../i18n/i18n";

export const AboutPage = () => {
  const t = useTranslation();
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-16">
      
      {/* 1. Slogan 区域 */}
      <div className="mb-10 flex flex-col items-center text-center animate-bounce-in">
        
        {/* 第一行：主标题 (蓝紫渐变) */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400">
            {t.pages.about.slogan_line1}
          </span>
        </h1>

        {/* 第二行：副标题 (灰色) */}
        <div className="text-lg md:text-xl font-medium text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed tracking-wide">
          {t.pages.about.slogan_line2}
        </div>

        {/* 装饰元素 */}
        <div className="mt-8 w-16 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500 opacity-80" />
      </div>

      {/* 2. 日志区域 */}
      <div className="
        p-8 md:p-12
        rounded-3xl
        bg-white dark:bg-zinc-800
        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]
        border border-zinc-100 dark:border-zinc-700
      ">
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-700/50 mb-4 select-none shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-600">
             <span className="text-3xl">📝</span>
          </div>
          <div>
            <H2 className="!text-4xl !font-bold !m-0 bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400">
              {t.pages.about.changelog}
            </H2>
            <p className="text-zinc-400 text-base mt-2 font-medium tracking-widest uppercase opacity-80">
              Update History
            </p>
          </div>
        </div>

        <div className="
          prose prose-xl dark:prose-invert max-w-none leading-relaxed
          prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-800 dark:prose-headings:text-zinc-100
          prose-p:text-zinc-600 dark:prose-p:text-zinc-300
          prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-a:no-underline prose-a:font-medium
          prose-li:marker:text-zinc-300 dark:prose-li:marker:text-zinc-500
          prose-hr:border-zinc-200 dark:prose-hr:border-zinc-700
        ">
          <Markdown>{changelog}</Markdown>
        </div>
        
        <div className="mt-16 pt-8 border-t border-dashed border-zinc-200 dark:border-zinc-700 text-center">
          <p className="text-sm text-zinc-400 font-medium select-none">
            Recorded ❤️ by MaaYuan
          </p>
        </div>
      </div>
    </div>
  );
};