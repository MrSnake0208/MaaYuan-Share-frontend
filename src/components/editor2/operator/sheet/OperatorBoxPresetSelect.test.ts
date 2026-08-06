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
  removeOperator: vi.fn(),
  navigate: vi.fn(),
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
    removeOperator: mocks.removeOperator,
    submitOperatorInSheet: mocks.submitOperator,
  }),
}));

vi.mock("../../../Toaster", () => ({
  AppToaster: { show: mocks.toasterShow },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
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
    mocks.removeOperator.mockReset();
    mocks.navigate.mockReset();
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

  it("replaces the current selection with ordered Box members", async () => {
    await act(async () =>
      root.render(createElement(OperatorBoxPresetSelect, { maxSelected: 3 })),
    );

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[title="Box A"]')?.click();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mocks.loadConfigs).toHaveBeenCalledWith("box-a");
    expect(mocks.removeOperator).toHaveBeenCalledWith([0]);
    expect(mocks.submitOperator).toHaveBeenCalledTimes(3);
    expect(mocks.submitOperator.mock.calls.map(([operator]) => operator.name)).toEqual([
      "密探甲",
      "密探乙",
      "密探丙",
    ]);
    expect(mocks.submitOperator.mock.calls.at(1)?.[0].requirements.level).toBe(50);
  });

  it("stops when the preset exceeds the editor's operator limit", async () => {
    await act(async () =>
      root.render(createElement(OperatorBoxPresetSelect, { maxSelected: 2 })),
    );

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[title="Box A"]')?.click();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mocks.removeOperator).toHaveBeenCalledWith([0]);
    expect(mocks.submitOperator).toHaveBeenCalledTimes(2);
    expect(mocks.submitOperator).toHaveBeenCalledWith(
      expect.objectContaining({ name: "密探乙" }),
    );
  });

  it("uses the editor callback when rendered outside the sheet provider", async () => {
    const applyOperators = vi.fn();
    await act(async () =>
      root.render(
        createElement(OperatorBoxPresetSelect, {
          maxSelected: 3,
          onApplyOperators: applyOperators,
        }),
      ),
    );

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[title="Box A"]')?.click();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(applyOperators).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: "密探甲" }),
        expect.objectContaining({ name: "密探乙" }),
        expect.objectContaining({ name: "密探丙" }),
      ]),
    );
    expect(mocks.removeOperator).not.toHaveBeenCalled();
    expect(mocks.submitOperator).not.toHaveBeenCalled();
  });

  it("links to the operator recorder when no presets exist", async () => {
    mocks.presets = [];
    await act(async () => root.render(createElement(OperatorBoxPresetSelect)));

    const createPresetButton = container.querySelector<HTMLButtonElement>(
      'button[title="没有阵容预设？快去创建一个吧"]',
    );
    expect(createPresetButton?.textContent).toContain("没有阵容预设？快去创建一个吧");

    await act(async () => createPresetButton?.click());

    expect(mocks.navigate).toHaveBeenCalledWith("/operator-recorder");
  });
});
