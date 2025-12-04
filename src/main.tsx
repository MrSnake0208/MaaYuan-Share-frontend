import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

import "normalize.css";
import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import ReactGA from "react-ga-neo";
import { Route, Routes } from "react-router-dom";

import { withSuspensable } from "components/Suspensable";
import { ViewPage } from "pages/view";
import { clearOutdatedSwrCache } from "utils/swr";

import { App } from "./App";
import { AppLayout } from "./layouts/AppLayout";
import { NotFoundPage } from "./pages/404";
import { IndexPage } from "./pages/index";
import "./styles/blueprint.less";

import "./styles/index.css";

Sentry.init({
  dsn: "https://0a2bb44996194bb7aff8d0e32dcacb55@o1299554.ingest.sentry.io/6545242",
  integrations: [new BrowserTracing(), new Sentry.Replay()],
  tracesSampleRate: 0.05,

  replaysSessionSampleRate: 0.001,
  replaysOnErrorSampleRate: 0.1,

  debug: import.meta.env.DEV,

  enabled: import.meta.env.PROD,
  beforeSend: (event) => {
    if (import.meta.env.DEV) return null;
    return event;
  },
});

ReactGA.initialize("G-K3MCHSLB5K");

// add platform class to root element
if (navigator.userAgent.includes("Win")) {
  document.documentElement.classList.add("platform--windows");
} else {
  document.documentElement.classList.add("platform--non-windows");
}

const maaYuanBackgrounds = [
  "MaaYuan-侦探皮（透明底）.png",
  "MaaYuan-兔女郎（透明底）.png",
  "MaaYuan-南瓜头（透明底）.png",
  "MaaYuan-原皮（透明底）.png",
  "MaaYuan-原色牛皮（透明底）.png",
  "MaaYuan-原色皮（透明底）.png",
  "MaaYuan-周岁（透明底）.png",
  "MaaYuan-天使（透明底）.png",
  "MaaYuan-幽灵床单（透明底）.png",
  "MaaYuan-广狐版（透明底）.png",
  "MaaYuan-恶魔（透明底）.png",
  "MaaYuan-牛牛（透明底）.png",
  "MaaYuan-牛皮（透明底）.png",
  "MaaYuan-牛郎（透明底）.png",
  "MaaYuan-簪花头（透明底）.png",
  "MaaYuan-织女（透明底）.png",
  "MaaYuan-蜜蜂皮（透明底）.png",
  "MaaYuan-豹皮（透明底）.png",
  "MaaYuan-飞云版（透明底）.png",
  "MaaYuan-魂皮（透明底）.png",
  "MaaYuan-魔女（透明底）.png",
  "MaaYuan-麦麦（透明底）.png",
  "MaaYuan-黑猫版（透明底）.png",
];

const maaYuanTileSize = 220;
const maaYuanPatternSize = 2400;
const maaYuanRepeatMultiplier = 3;
const maaYuanMinGap = 16;
const maaYuanPlacementAttempts = 80;
let maaYuanPatternPromise: Promise<string | null> | null = null;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const buildMaaYuanPattern = () => {
  if (maaYuanPatternPromise) return maaYuanPatternPromise;

  maaYuanPatternPromise = (async () => {
    if (!maaYuanBackgrounds.length) return null;

    const namesToPlace = Array.from(
      { length: maaYuanBackgrounds.length * maaYuanRepeatMultiplier },
      (_, index) => maaYuanBackgrounds[index % maaYuanBackgrounds.length],
    );
    const placements: { name: string; x: number; y: number }[] = [];
    const maxX = maaYuanPatternSize - maaYuanTileSize - maaYuanMinGap;
    const maxY = maaYuanPatternSize - maaYuanTileSize - maaYuanMinGap;

    namesToPlace.forEach((name) => {
      for (let attempt = 0; attempt < maaYuanPlacementAttempts; attempt += 1) {
        const x = Math.floor(Math.random() * maxX);
        const y = Math.floor(Math.random() * maxY);
        const overlaps = placements.some(
          (pos) =>
            Math.abs(pos.x - x) < maaYuanTileSize + maaYuanMinGap &&
            Math.abs(pos.y - y) < maaYuanTileSize + maaYuanMinGap,
        );
        if (!overlaps) {
          placements.push({ name, x, y });
          break;
        }
      }
    });

    if (!placements.length) return null;

    const images = await Promise.all(
      placements.map((item) => loadImage(`/maayuan/${encodeURIComponent(item.name)}`)),
    );

    const canvas = document.createElement("canvas");
    canvas.width = maaYuanPatternSize;
    canvas.height = maaYuanPatternSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    images.forEach((img, index) => {
      const pos = placements[index];
      ctx.drawImage(img, pos.x, pos.y, maaYuanTileSize, maaYuanTileSize);
    });

    return canvas.toDataURL("image/png");
  })().catch(() => {
    maaYuanPatternPromise = null;
    return null;
  });

  return maaYuanPatternPromise;
};

const applyMaaYuanBackground = () => {
  const wrapper = document.querySelector(".docs-content-wrapper") as HTMLElement | null;
  const targets = [document.body, wrapper].filter(Boolean) as HTMLElement[];

  if (!document.body.classList.contains("theme-maayuan") || !maaYuanBackgrounds.length) {
    targets.forEach((el) => {
      el.style.backgroundImage = "";
      el.style.backgroundRepeat = "";
      el.style.backgroundSize = "";
      el.style.backgroundPosition = "";
      el.style.backgroundAttachment = "";
    });
    maaYuanPatternPromise = null;
    return;
  }

  buildMaaYuanPattern().then((dataUrl) => {
    if (!dataUrl) return;
    const patternSize = maaYuanPatternSize;
    targets.forEach((el) => {
      el.style.backgroundImage = `url("${dataUrl}")`;
      el.style.backgroundRepeat = "repeat";
      el.style.backgroundSize = `${patternSize}px ${patternSize}px`;
      el.style.backgroundPosition = "0 0";
      el.style.backgroundAttachment = "fixed";
    });
  });
};

applyMaaYuanBackground();

new MutationObserver(applyMaaYuanBackground).observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});

clearOutdatedSwrCache();

const CreatePageLazy = withSuspensable(
  lazy(() => import("./pages/create").then((m) => ({ default: m.CreatePage }))),
);
const EditorPageLazy = withSuspensable(
  lazy(() => import("./pages/editor").then((m) => ({ default: m.EditorPage }))),
);
const AboutPageLazy = withSuspensable(
  lazy(() => import("./pages/about").then((m) => ({ default: m.AboutPage }))),
);
const ProfilePageLazy = withSuspensable(
  lazy(() => import("./pages/profile").then((m) => ({ default: m.ProfilePage }))),
);
const AdminPageLazy = withSuspensable(
  lazy(() => import("./pages/admin").then((m) => ({ default: m.AdminPage }))),
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App>
      <AppLayout>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/create/:id" element={<CreatePageLazy />} />
          <Route path="/create" element={<CreatePageLazy />} />
          <Route path="/about" element={<AboutPageLazy />} />
          <Route path="/profile/:id" element={<ProfilePageLazy />} />
          <Route path="/operation/:id" element={<ViewPage />} />
          <Route path="/editor" element={<EditorPageLazy />} />
          <Route path="/editor/:id" element={<EditorPageLazy />} />
          <Route path="/admin" element={<AdminPageLazy />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </App>
  </React.StrictMode>,
);
