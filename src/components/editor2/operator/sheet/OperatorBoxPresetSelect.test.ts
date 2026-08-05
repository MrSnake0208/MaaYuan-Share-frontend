import { act, createElement } from "react";
import { type Root, createRoot } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { OperatorBoxPresetSelect } from "./OperatorBoxPresetSelect";

const mocks = vi.hoisted(() => ({
  existedOperators: [{ name: "密探甲" }] as Array<{ name: string }>,
  loadConfigs: vi.fn(),
  presets: [
    {
      id: "box-a",
      label: "Box A",
      members: [
        { operatorKey: "密探丙", order: 3 },
        { operatorKey: "密探甲", order: 1 },
        { operatorKey: "密探乙", order: 2 },
      ],
    },
  ],
  submitOperator: vi.fn(
    (_operator: { name: string; requirements: { level?: number } }) => true,
  ),
  toasterShow: vi.fn(),
}));

vi.mock("../../../../apis/operator-box-training-config", () => ({
  loadOperatorBoxTrainingConfigs: mocks.loadConfigs,
}));

vi.mock("../../../../apis/operator-box-preset", () => ({
  useOperatorBoxPresets: () => ({
    data: mocks.presets,
    error: undefined,
    isLoading: false,
  }),
}));

vi.mock("../../../editor/operator/sheet/SheetProvider", () => ({
  useSheet: () => ({
    existedOperators: mocks.existedOperators,
    submitOperatorInSheet: mocks.submitOperator,
  }),
}));

vi.mock("../../../Toaster", () => ({
  AppToaster: { show: mocks.toasterShow },
}));

vi.mock("../../../../i18n/i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../i18n/i18n")>()),
  useTranslation: () => ({
    common: { loading: "加载中" },
    components: { OperatorFilter: { box_presets: "阵容预设" } },
  }),
}));

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

describe("OperatorBoxPresetSelect", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  });

  beforeEach(() => {
    mocks.existedOperators = [{ name: "密探甲" }];
    mocks.loadConfigs.mockReset();
    mocks.loadConfigs.mockResolvedValue([
      {
        boxId: "box-a",
        operatorId: "密探乙",
        level: 50,
        updateTime: new Date(),
      },
    ]);
    mocks.submitOperator.mockReset();
    mocks.submitOperator.mockReturnValue(true);
    mocks.toasterShow.mockReset();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    document.querySelectorAll(".bp4-portal").forEach((portal) => portal.remove());
    vi.clearAllMocks();
  });

  it("adds ordered Box members with their Box-scoped training snapshot", async () => {
    await act(async () =>
      root.render(createElement(OperatorBoxPresetSelect, { maxSelected: 3 })),
    );

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[title="阵容预设"]')?.click();
    });
    const boxItem = Array.from(document.querySelectorAll<HTMLElement>("[role=menuitem]"))
      .find((item) => item.textContent?.includes("Box A"));
    await act(async () => {
      boxItem?.click();
      await Promise.resolve();
    });

    expect(mocks.loadConfigs).toHaveBeenCalledWith("box-a");
    expect(mocks.submitOperator).toHaveBeenCalledTimes(2);
    expect(mocks.submitOperator.mock.calls.map(([operator]) => operator.name)).toEqual([
      "密探乙",
      "密探丙",
    ]);
    expect(mocks.submitOperator.mock.calls.at(0)?.[0].requirements.level).toBe(50);
  });

  it("stops when the editor has no remaining operator slots", async () => {
    await act(async () =>
      root.render(createElement(OperatorBoxPresetSelect, { maxSelected: 2 })),
    );

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[title="阵容预设"]')?.click();
    });
    const boxItem = Array.from(document.querySelectorAll<HTMLElement>("[role=menuitem]"))
      .find((item) => item.textContent?.includes("Box A"));
    await act(async () => {
      boxItem?.click();
      await Promise.resolve();
    });

    expect(mocks.submitOperator).toHaveBeenCalledTimes(1);
    expect(mocks.submitOperator).toHaveBeenCalledWith(
      expect.objectContaining({ name: "密探乙" }),
    );
  });
});
