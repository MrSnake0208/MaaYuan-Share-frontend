import { type CellObject, read, utils } from "xlsx";

import {
  AutoFightConfig,
  actionMap,
  defaultAutoFightConfig,
  fightActionTemplates,
  operationMap,
} from "./config";

const COLUMNS = ["1", "2", "3", "4", "5"] as const;

type ActionOrder = Record<number, { action: string }>;

type AutoFightNode = Record<string, unknown>;

type AutoFightGraph = Record<string, AutoFightNode>;

const ACTION_REGEX = /([^\d]*?)(\d)(\D)/g;

const NAMED_COLORS = {
  黑: "黑",
  白: "白",
  灰: "灰",
  红: "红",
  橙: "橙",
  黄: "黄",
  绿: "绿",
  蓝: "蓝",
  紫: "紫",
} as const;

// 近似主题色对应的十六进制（仅用于前端色块展示）
const themeColorHexMap: Record<number, string> = {
  0: "#FFFFFF",
  1: "#000000",
  2: "#FFFFFF",
  3: "#4F81BD",
  4: "#4F81BD",
  5: "#C0504D",
  6: "#9BBB59",
  7: "#8064A2",
  8: "#4F81BD",
  9: "#ED7D31",
};

const slideOperationToAction: Record<string, AutoFightNode> = {
  左侧目标: {
    text_doc: "左侧目标",
    action: "Click",
    target: [154, 648, 1, 1],
    post_delay: 2000,
    duration: 800,
  },
  右侧目标: {
    text_doc: "右侧目标",
    action: "Click",
    target: [603, 413, 18, 21],
    post_delay: 2000,
    duration: 800,
  },
  检测橙星: {
    text_doc: "检测橙星",
    recognition: "ColorMatch",
    roi: [77, 167, 70, 70],
    method: 4,
    upper: [255, 255, 205],
    lower: [166, 140, 85],
    count: 1,
    order_by: "Score",
    connected: true,
    action: "Click",
    pre_delay: 2000,
  },
};

const restartNodeTemplate: AutoFightNode = {
  recognition: "TemplateMatch",
  template: "back.png",
  green_mask: true,
  threshold: 0.5,
  roi: [6, 8, 123, 112],
  action: "Click",
  pre_delay: 2000,
  post_delay: 2000,
  next: ["抄作业确定左上角重开"],
  timeout: 20000,
};

const levelTypeToNextNode: Record<AutoFightConfig["levelType"], string> = {
  主线: "抄作业找到关卡-主线",
  洞窟: "抄作业进入关卡-洞窟",
  活动有分级: "抄作业找到关卡-活动分级",
  白鹄: "抄作业进入关卡-白鹄",
  其他: "抄作业找到关卡-OCR",
};

const cloneDeep = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const normalizeConfig = (overrides?: Partial<AutoFightConfig>): AutoFightConfig => ({
  ...defaultAutoFightConfig,
  ...overrides,
});

const getDefaultColorHex = (config: AutoFightConfig): string =>
  (config.defaultColorHex || "#FFFFFF").toUpperCase();

export const rgbToNamedColor = (r: number, g: number, b: number): string => {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;

  let h = 0;
  if (delta === 0) {
    h = 0;
  } else if (max === rf) {
    h = 60 * (((gf - bf) / delta) % 6);
  } else if (max === gf) {
    h = 60 * ((bf - rf) / delta + 2);
  } else {
    h = 60 * ((rf - gf) / delta + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  const sat = s * 255;
  const val = v * 255;

  // 黑/白/灰优先（与原阈值兼容）
  if (sat <= 43 && val <= 46) return NAMED_COLORS.黑;
  if (sat <= 30 && val >= 221) return NAMED_COLORS.白;
  if (sat <= 43 && val > 46 && val < 221) return NAMED_COLORS.灰;

  // 使用 0..360 的 Hue 统一映射到常用中文色
  // 近似区间：红[0,20]|[345,360] 橙(20,46] 黄(46,68] 绿(68,164] 蓝(164,248] 紫(248,345]
  if (h <= 20 || h > 345) return NAMED_COLORS.红;
  if (h <= 46) return NAMED_COLORS.橙;
  if (h <= 68) return NAMED_COLORS.黄;
  if (h <= 164) return NAMED_COLORS.绿;
  if (h <= 248) return NAMED_COLORS.蓝;
  return NAMED_COLORS.紫;
};

const argbToRgb = (argb: string): [number, number, number] => {
  const hex = parseInt(argb, 16);
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return [r, g, b];
};

export const hexToNamedColor = (hex: string): string => {
  const noHash = hex.startsWith("#") ? hex.slice(1) : hex;
  if (noHash.length !== 6) return "白";
  const r = parseInt(noHash.slice(0, 2), 16);
  const g = parseInt(noHash.slice(2, 4), 16);
  const b = parseInt(noHash.slice(4, 6), 16);
  return rgbToNamedColor(r, g, b);
};

const rgbTupleToHex = (rgb: [number, number, number]): string =>
  `#${rgb[0].toString(16).padStart(2, "0")}${rgb[1]
    .toString(16)
    .padStart(2, "0")}${rgb[2].toString(16).padStart(2, "0")}`.toUpperCase();

// 读取单元格填充颜色（优先 rgb，其次 theme），返回 RGB 十六进制字符串
const getCellFillRgbHex = (cell: CellObject): string | null => {
  const anyCell = cell as unknown as {
    s?: {
      fgColor?: { rgb?: string; theme?: number };
      fill?: {
        patternType?: string;
        fgColor?: { rgb?: string; theme?: number };
        bgColor?: { rgb?: string; theme?: number };
      };
    };
  };
  const s = anyCell?.s;
  // Excel 无填充：patternType === 'none' 或者缺失颜色字段
  const tryColors = [s?.fgColor?.rgb, s?.fill?.fgColor?.rgb, s?.fill?.bgColor?.rgb].filter(
    Boolean,
  ) as string[];
  if (tryColors.length > 0) {
    const [r, g, b] = argbToRgb(tryColors[0]!);
    return rgbTupleToHex([r, g, b]);
  }
  const theme = s?.fgColor?.theme ?? s?.fill?.fgColor?.theme ?? s?.fill?.bgColor?.theme;
  if (typeof theme === "number") {
    return themeColorHexMap[theme] ?? null;
  }
  return null;
};

const pickCellColor = (cell: CellObject, config: AutoFightConfig): string => {
  if (!config.useColor) {
    return "";
  }

  // 文本模式：前缀以 colorList 中的任意标识开头（允许使用字母令牌）
  if (config.colorType === "text") {
    const raw = typeof cell.v === "string" ? cell.v.trim() : "";
    if (!raw) return "";
    const matched = config.colorList.find((token) => raw.startsWith(token));
    return matched ?? "";
  }

  // 填充模式：使用 paletteHexList 来确保“按原色块”精准区分
  const rawFillHex = getCellFillRgbHex(cell);
  const defaultHex = getDefaultColorHex(config);
  // 统一“无色/透明/无填充/白色”到 DEFAULT_COLOR 路径
  const normalizedHex = (() => {
    if (!rawFillHex) return defaultHex;
    const upper = rawFillHex.toUpperCase();
    // alpha=0 或明确白色都应视为默认色路径；xlsx 读出 ARGB 的透明白会被规约为 #FFFFFF
    if (upper === "#FFFFFF") return defaultHex;
    return upper;
  })();

  const palette = (config.paletteHexList ?? []).map((h) => h.toUpperCase());
  const tokens =
    config.colorTokenList && config.colorTokenList.length > 0
      ? config.colorTokenList
      : config.colorList;
  let idx = palette.indexOf(normalizedHex);
  if (idx >= 0 && tokens[idx]) {
    // 返回单字符令牌（例如 A/B/C/...），便于后续解析与最短旋转
    return tokens[idx];
  }
  // 无法解析的颜色，记录告警并回退到 DEFAULT_COLOR
  const fallbackIdx = palette.indexOf(defaultHex);
  if (fallbackIdx >= 0 && tokens[fallbackIdx]) {
    console.warn("[XlsxImporter] 未识别的颜色，回退到默认色", rawFillHex, "→", defaultHex);
    return tokens[fallbackIdx];
  }
  // 仍未找到映射，尽量保持不中断：若存在 token 列表，回退第一个
  if (tokens.length > 0) {
    console.warn("[XlsxImporter] 默认色未在调色板中，使用第一个令牌作为回退", {
      defaultHex,
      palette,
    });
    return tokens[0]!;
  }
  return "";
};

const readSheetRows = (arrayBuffer: ArrayBuffer, config: AutoFightConfig): string[][] => {
  const workbook = read(arrayBuffer, { type: "array", cellStyles: true });
  const [sheetName] = workbook.SheetNames;
  if (!sheetName) {
    throw new Error("xlsx_no_sheet");
  }
  const sheet = workbook.Sheets[sheetName];
  const rangeRef = sheet["!ref"];
  if (!rangeRef) {
    throw new Error("xlsx_empty");
  }
  const range = utils.decode_range(rangeRef);
  const rows: string[][] = [];

  for (let r = range.s.r; r <= range.e.r; r += 1) {
    if (config.useHeader && r === range.s.r) {
      continue;
    }
    const rowValues: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const cellAddress = utils.encode_cell({ r, c });
      const cell = sheet[cellAddress] as CellObject | undefined;
      if (!cell || cell.v === undefined || cell.v === null) {
        rowValues.push("");
        continue;
      }
      const rawText = String(cell.v).trim();
      if (!rawText) {
        rowValues.push("");
        continue;
      }
      if (config.useColor) {
        const color = pickCellColor(cell, config);
        rowValues.push(`${color}${rawText}`);
      } else {
        rowValues.push(rawText);
      }
    }
    if (rowValues.some((value) => value !== "")) {
      rows.push(rowValues);
    }
  }

  return rows;
};

// 提取 Excel 中出现的命名颜色（仅统计含内容的单元格）
export const detectXlsxColors = (
  arrayBuffer: ArrayBuffer,
  overrides?: Partial<AutoFightConfig>,
): string[] => {
  // 强制启用颜色解析做检测，但颜色来源遵循 overrides 中的 colorType
  const config = normalizeConfig({ useColor: true, ...overrides });
  const workbook = read(arrayBuffer, { type: "array", cellStyles: true });
  const [sheetName] = workbook.SheetNames;
  if (!sheetName) {
    return [];
  }
  const sheet = workbook.Sheets[sheetName];
  const rangeRef = sheet["!ref"];
  if (!rangeRef) {
    return [];
  }
  const range = utils.decode_range(rangeRef);
  const set = new Set<string>();

  for (let r = range.s.r; r <= range.e.r; r += 1) {
    if (config.useHeader && r === range.s.r) continue;
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const cellAddress = utils.encode_cell({ r, c });
      const cell = sheet[cellAddress] as CellObject | undefined;
      if (!cell) continue;
      const rawText = cell.v === undefined || cell.v === null ? "" : String(cell.v).trim();
      // 没有文本也允许统计，只要单元格存在填充色
      const fillHex = getCellFillRgbHex(cell);
      if (fillHex) {
        // 转命名色以对齐生成逻辑
        const hexNoHash = fillHex.replace("#", "");
        const r = parseInt(hexNoHash.slice(0, 2), 16);
        const g = parseInt(hexNoHash.slice(2, 4), 16);
        const b = parseInt(hexNoHash.slice(4, 6), 16);
        const colorName = rgbToNamedColor(r, g, b);
        if (colorName) set.add(colorName);
        continue;
      }
      if (rawText) {
        const color = pickCellColor(cell, config);
        if (color) set.add(color);
      }
    }
  }

  return Array.from(set);
};

export interface DetectedColor {
  label: string;
  rgb: string;
}

// 提取 Excel 中出现的颜色调色板（包含色块展示所需的 RGB）
export const detectXlsxPalette = (
  arrayBuffer: ArrayBuffer,
  overrides?: Partial<AutoFightConfig>,
): DetectedColor[] => {
  const config = normalizeConfig({ useColor: true, ...overrides });
  const workbook = read(arrayBuffer, { type: "array", cellStyles: true });
  const [sheetName] = workbook.SheetNames;
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rangeRef = sheet["!ref"];
  if (!rangeRef) return [];
  const range = utils.decode_range(rangeRef);

  const map = new Map<string, DetectedColor>(); // key: rgb hex
  const defaultHex = getDefaultColorHex(config);
  let hasNoFillOrDefault = false;

  for (let r = range.s.r; r <= range.e.r; r += 1) {
    if (config.useHeader && r === range.s.r) continue;
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const cellAddress = utils.encode_cell({ r, c });
      const cell = sheet[cellAddress] as CellObject | undefined;
      if (!cell) continue;
      const rawFillHex = getCellFillRgbHex(cell);
      if (!rawFillHex) {
        hasNoFillOrDefault = true;
        continue;
      }
      // 白色或透明白等价为默认色
      const fillHex = rawFillHex.toUpperCase() === "#FFFFFF" ? defaultHex : rawFillHex;
      const hexNoHash = fillHex.replace("#", "");
      const r8 = parseInt(hexNoHash.slice(0, 2), 16);
      const g8 = parseInt(hexNoHash.slice(2, 4), 16);
      const b8 = parseInt(hexNoHash.slice(4, 6), 16);
      const label = rgbToNamedColor(r8, g8, b8);
      if (!map.has(fillHex)) {
        map.set(fillHex, { label, rgb: fillHex });
      }
    }
  }

  // 若存在无填充/透明，则确保默认色进入调色板（便于后续映射）
  if (hasNoFillOrDefault && !map.has(defaultHex)) {
    map.set(defaultHex, { label: hexToNamedColor(defaultHex), rgb: defaultHex });
  }

  return Array.from(map.values());
};

const getActionTemplate = (actionCode: string) => {
  const position = actionCode[0];
  const actionType = actionCode[1];
  const key = `${position}号位${
    actionType === "普" ? "普攻" : actionType === "大" ? "上拉" : actionType === "下" ? "下拉" : "O"
  }`;
  return fightActionTemplates[key];
};

const getSlideOperations = (
  previousColor: string,
  targetColor: string,
  config: AutoFightConfig,
): string[] => {
  const colors = config.colorList;
  const previousIndex = colors.indexOf(previousColor);
  const targetIndex = colors.indexOf(targetColor);
  if (previousIndex === -1 || targetIndex === -1) {
    return [];
  }
  const clockwiseDistance = (targetIndex - previousIndex + colors.length) % colors.length;
  const counterDistance = (previousIndex - targetIndex + colors.length) % colors.length;
  if (clockwiseDistance <= counterDistance) {
    return new Array(clockwiseDistance).fill("右侧目标");
  }
  return new Array(counterDistance).fill("左侧目标");
};

// --- 预处理辅助 ---

// xlsx 库可能给每格多读一个脏前缀字符（通常是 a 或 A），非颜色模式下需要剥掉
const isDirtyPrefix = (ch: string) => ch === "a" || ch === "A";

// 剩余部分是否全是合法动作符号（可整体加序号）
const isAllActionSymbols = (s: string) =>
  s.length > 0 && Array.from(s).every((c) => actionMap[c] && actionMap[c] !== "未知");

// 预处理：给无编号单元格自动补序号
// 单字符直接编号；多字符整体加一个序号，交给后续多动作展开
// "↑"→"1↑"、"防"→"1防"、"↑↑"→"1↑↑"、"↓↓↓"→"2↓↓↓"
// 颜色模式保留首字符（颜色 token），非颜色模式剥掉脏前缀 a/A 和未知前缀
const preprocessRow = (row: string[], config: AutoFightConfig): string[] => {
  const usedNumbers = new Set<number>();
  for (const cell of row) {
    const m = /\d+/.exec(cell);
    if (m) usedNumbers.add(Number(m[0]));
  }
  const nextNum = () => {
    let n = 1;
    while (usedNumbers.has(n)) n++;
    usedNumbers.add(n);
    return n;
  };

  const stripPrefix = (cell: string): { prefix: string; rest: string } => {
    if (config.useColor) {
      // 颜色模式：首字符是颜色 token，原样保留
      return { prefix: cell[0], rest: cell.slice(1) };
    }
    // 非颜色模式：跳过不在 actionMap 中的前缀字符 和 xlsx 脏前缀 a/A
    let i = 0;
    while (i < cell.length && (!actionMap[cell[i]] || isDirtyPrefix(cell[i]))) {
      // 脏前缀只在后面还有内容时才剥（单独的 a/A 是合法普攻动作）
      if (isDirtyPrefix(cell[i]) && i + 1 >= cell.length) break;
      i++;
    }
    return { prefix: "", rest: cell.slice(i) };
  };

  return row.map((cell) => {
    if (!cell || !cell.trim()) return cell;
    if (/\d/.test(cell)) return cell; // 已有编号
    // 单字符：直接编号
    if (cell.length === 1) {
      if (actionMap[cell] && actionMap[cell] !== "未知") return `${nextNum()}${cell}`;
      return cell;
    }
    // 多字符无编号：剥前缀后整体加序号
    const { prefix, rest } = stripPrefix(cell);
    if (isAllActionSymbols(rest)) {
      return `${prefix}${nextNum()}${rest}`;
    }
    return cell;
  });
};

const parseActionsForRow = (row: string[], config: AutoFightConfig): ActionOrder => {
  // 在 actionOrder 指定序号插入，已有条目及后续全部后移
  const insertWithShift = (order: number, entry: ActionOrder[number]) => {
    if (actionOrder[order]) {
      const keys = Object.keys(actionOrder).map(Number).sort((a, b) => b - a);
      for (const k of keys) {
        if (k >= order) { actionOrder[k + 1] = actionOrder[k]; delete actionOrder[k]; }
      }
    }
    actionOrder[order] = entry;
  };

  const actionOrder: ActionOrder = {};
  const processed = preprocessRow(row, config);

  processed.forEach((seq, idx) => {
    if (typeof seq !== "string" || seq.trim() === "") {
      return;
    }

    const normalized = seq
      .replace(/普攻/g, "普")
      .replace(/技能/g, "大")
      .replace(/防御/g, "防");

    const columnIndex = COLUMNS[idx] ?? String(idx + 1);
    const matches = Array.from(normalized.matchAll(ACTION_REGEX));

    matches.forEach((match) => {
        let operations = match[1];
        if (config.useColor && config.colorList.length > 0) {
          const expectedColor = matches[0]?.[1]?.[0];
          if (!operations || !config.colorList.includes(operations[0] ?? "")) {
            operations = (expectedColor ?? "") + operations;
          }
        }
        const number = Number(match[2]);
        const symbol = match[3];
        const actionType = actionMap[symbol] ?? "未知";
        if (actionType === "未知") {
          console.warn("未知的动作符号", symbol);
          return;
        }

        // 找下一个可用序号（如 "4A" 在 "2↓↓↓" 之后序号被占 → 自动顺延）
        let order = number;
        while (actionOrder[order]) order++;
        actionOrder[order] = {
          action: `${operations}${columnIndex}${actionType}`,
        };

        // 单元格内后续动作：同位置连动（如 "2↓↓↓" → 2号位连续3次↓）
        // 注意：若 remaining 含数字（如 "1↓2↑" 的后续 "2↑"），allValid 会因数字
        // 不在 actionMap 而自然为 false，从而跳过展开——这正是期望行为
        const matchEnd = (match.index ?? 0) + match[0].length;
        const remaining = normalized.slice(matchEnd);
        if (remaining.length > 0 && isAllActionSymbols(remaining)) {
          for (const c of remaining) {
            order++;
            insertWithShift(order, {
              action: `${operations}${columnIndex}${actionMap[c]}`,
            });
          }
        }
      });
  });

  // 整体重排序号，保证连续且按序号顺序执行
  const sorted = Object.entries(actionOrder).sort(([a], [b]) => Number(a) - Number(b));
  const renumbered: ActionOrder = {};
  sorted.forEach(([, action], i) => { renumbered[i + 1] = action; });
  return renumbered;
};

const setOperationAction = (
  actionOp: string,
  roundIndex: number,
  actionIndex: number,
  graph: AutoFightGraph,
  currentActionKey: string | null,
): { actionIndex: number; currentActionKey: string | null } => {
  if (actionOp === "未知") {
    console.warn("未知的操作符", actionOp);
    return { actionIndex, currentActionKey };
  }

  const actionKey = `回合${roundIndex}行动${actionIndex + 1}`;
  const template = slideOperationToAction[actionOp];
  if (!template) {
    return { actionIndex, currentActionKey };
  }

  graph[actionKey] = cloneDeep(template);
  if (actionOp === "检测橙星") {
    if (currentActionKey && graph[currentActionKey]) {
      graph[currentActionKey].on_error = ["抄作业点左上角重开"];
      graph[currentActionKey].timeout = 200;
    } else {
      const detectorKey = `检测回合${roundIndex}`;
      if (graph[detectorKey]) {
        graph[detectorKey].on_error = ["抄作业点左上角重开"];
        graph[detectorKey].timeout = 200;
      }
    }
  }

  if (currentActionKey && graph[currentActionKey]) {
    graph[currentActionKey].next = [actionKey];
  }

  return { actionIndex: actionIndex + 1, currentActionKey: actionKey };
};

const addRestartInfo = (graph: AutoFightGraph, config: AutoFightConfig) => {
  const nextNode = levelTypeToNextNode[config.levelType];
  graph["抄作业点左上角重开"] = {
    ...cloneDeep(restartNodeTemplate),
    next: ["抄作业确定左上角重开", nextNode],
  };

  if (config.levelType === "洞窟") {
    graph["抄作业进入关卡-洞窟"] =
      config.caveType === "左"
        ? {
            text_doc: "左",
            recognition: "OCR",
            expected: "前往",
            roi: [237, 810, 82, 89],
            action: "Click",
            target: [258, 833, 42, 39],
            pre_delay: 1500,
            next: ["抄作业战斗开始"],
            timeout: 20000,
          }
        : {
            text_doc: "右",
            recognition: "OCR",
            expected: "前往",
            roi: [558, 804, 79, 89],
            action: "Click",
            target: [581, 832, 41, 41],
            pre_delay: 1500,
            next: ["抄作业战斗开始"],
            timeout: 20000,
          };
  } else if (config.levelType === "活动有分级") {
    graph["抄作业找到关卡-活动分级"] = {
      recognition: "OCR",
      expected: config.levelRecognitionName,
      roi: [0, 249, 720, 1030],
      action: "Click",
      pre_delay: 1500,
      next: ["抄作业选择活动分级"],
      timeout: 20000,
    };
    graph["抄作业选择活动分级"] = {
      recognition: "OCR",
      expected: config.difficulty,
      roi: [37, 351, 647, 491],
      pre_delay: 1500,
      action: "Click",
      next: ["抄作业进入关卡"],
      timeout: 20000,
    };
  } else if (config.levelType !== "主线" && config.levelType !== "白鹄") {
    graph["抄作业找到关卡-OCR"] = {
      recognition: "OCR",
      expected: config.levelRecognitionName,
      roi: [0, 249, 720, 1030],
      action: "Click",
      pre_delay: 2000,
      next: ["抄作业战斗开始"],
      timeout: 20000,
    };
  }
};

export interface ConvertOptions extends Partial<AutoFightConfig> {}

export const convertXlsxToAutoFightJson = (
  arrayBuffer: ArrayBuffer,
  overrides?: ConvertOptions,
) => {
  const config = normalizeConfig(overrides);
  const rows = readSheetRows(arrayBuffer, config);
  if (!rows.length) {
    throw new Error("xlsx_no_content");
  }

  const graph: AutoFightGraph = {};
  // 首回合目标切换：如指定（或默认）当前指向，则使用其作为初始颜色基准
  let previousColor = "";
  if (config.useColor && (config.colorList?.length ?? 0) > 0) {
    const idx = Math.max(1, config.currentEnemyIndex ?? 1) - 1;
    previousColor = config.colorList[idx % config.colorList.length];
  }

  rows.forEach((row, roundIdx) => {
    const round = roundIdx + 1;
    const detectionKey = `检测回合${round}`;
    graph[detectionKey] = {
      recognition: "OCR",
      expected: `回合${round}`,
      roi: [585, 28, 90, 65],
      next: [`回合${round}行动1`],
      post_delay: config.roundPostDelay,
    };

    const actionOrder = parseActionsForRow(row, config);
    const sortedEntries = Object.entries(actionOrder).sort(([a], [b]) => Number(a) - Number(b));

    const totalActions = sortedEntries.reduce(
      (acc, [, action]) => acc + Math.max(action.action.length - 1, 0),
      0,
    );

    let actionIndex = 0;
    let currentActionKey: string | null = null;
    let progression = 0;

    sortedEntries.forEach(([, action]) => {
      const directionsMatch = action.action.match(/^[^\d]+/);
      const directions = directionsMatch ? directionsMatch[0].split("") : [];
      directions.forEach((direction) => {
        progression += 1;
        const mapped = operationMap[direction] ?? "未知";
        if (config.useColor && config.colorList.includes(direction)) {
          if (!previousColor) {
            previousColor = direction;
            return;
          }
          if (previousColor === direction) {
            return;
          }
          const slideOps = getSlideOperations(previousColor, direction, config);
          previousColor = direction;
          slideOps.forEach((slideOp) => {
            const result = setOperationAction(slideOp, round, actionIndex, graph, currentActionKey);
            actionIndex = result.actionIndex;
            currentActionKey = result.currentActionKey;
          });
        } else {
          const result = setOperationAction(mapped, round, actionIndex, graph, currentActionKey);
          actionIndex = result.actionIndex;
          currentActionKey = result.currentActionKey;
        }
      });

      actionIndex += 1;
      progression += 1;

      const actionTemplate = getActionTemplate(action.action.slice(-2));
      if (!actionTemplate) {
        console.warn("未找到动作模板", action.action);
        return;
      }

      const actionKey = `回合${round}行动${actionIndex}`;
      const rawDoc = action.action.slice(-2);
      graph[actionKey] = {
        ...cloneDeep(actionTemplate),
        text_doc: rawDoc.endsWith("O") ? rawDoc.slice(0, -1) + "sp" : rawDoc,
      };

      if (currentActionKey && graph[currentActionKey]) {
        graph[currentActionKey].next = [actionKey];
      }

      currentActionKey = actionKey;

      const isRoundLastAction = progression === totalActions && round < rows.length;
      if (isRoundLastAction) {
        graph[actionKey].next = ["抄作业战斗胜利", `检测回合${round + 1}`];
      }
    });
  });

  addRestartInfo(graph, config);

  return JSON.stringify(graph, null, 2);
};
