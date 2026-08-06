import { Button } from "@blueprintjs/core";
import { useNavigate } from "react-router-dom";

import { useState } from "react";

import { loadOperatorBoxTrainingConfigs } from "../../../../apis/operator-box-training-config";
import { useOperatorBoxPresets } from "../../../../apis/operator-box-preset";
import { AppToaster } from "../../../Toaster";
import { useSheet } from "../../../editor/operator/sheet/SheetProvider";
import { useTranslation } from "../../../../i18n/i18n";
import { getOperatorBoxKeys } from "../../../../models/operator-box-preset";
import { formatError } from "../../../../utils/error";
import { createOperator } from "../../reconciliation";
import type { EditorOperator } from "../../editor-state";
import { MAX_ACTIVE_OPERATORS } from "../constants";
import { applyOperatorTrainingConfig } from "../operatorTrainingConfigModel";

interface OperatorBoxPresetSelectProps {
  maxSelected?: number;
  onApplyOperators?: (operators: EditorOperator[]) => void;
}

export function OperatorBoxPresetSelect({
  maxSelected = MAX_ACTIVE_OPERATORS,
  onApplyOperators,
}: OperatorBoxPresetSelectProps) {
  const t = useTranslation();
  const navigate = useNavigate();
  const { data: presets = [], error, isLoading } = useOperatorBoxPresets();
  const { existedOperators, removeOperator, submitOperatorInSheet } = useSheet();
  const [applyingId, setApplyingId] = useState<string>();

  const applyPreset = async (presetId: string) => {
    if (applyingId) return;
    const preset = presets.find((candidate) => candidate.id === presetId);
    if (!preset) return;

    setApplyingId(preset.id);
    try {
      const configs = await loadOperatorBoxTrainingConfigs(preset.id);
      const configsByOperatorId = new Map(
        configs.map((config) => [config.operatorId, config]),
      );

      let remainingSlots = maxSelected;
      const presetOperators: EditorOperator[] = [];

      for (const name of getOperatorBoxKeys(preset)) {
        if (remainingSlots <= 0) break;

        const baseOperator = createOperator({ name });
        const config = configsByOperatorId.get(name);
        const operator = config
          ? applyOperatorTrainingConfig(baseOperator, config)
          : baseOperator;
        presetOperators.push(operator);
        remainingSlots -= 1;
      }

      if (onApplyOperators) {
        onApplyOperators(presetOperators);
        return;
      }

      // A preset represents a complete lineup. Clear the current selection
      // before applying it so old operators do not consume preset slots.
      if (existedOperators.length > 0) {
        removeOperator(existedOperators.map((_, index) => index));
      }
      for (const operator of presetOperators) {
        submitOperatorInSheet(operator);
      }
    } catch (caught) {
      AppToaster.show({ intent: "danger", message: formatError(caught) });
    } finally {
      setApplyingId(undefined);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      aria-label={t.components.OperatorFilter.box_presets}
    >
      {isLoading ? (
        <Button minimal disabled loading className="!py-1.5">
          {t.common.loading}
        </Button>
      ) : !error && presets.length === 0 ? (
        <Button
          minimal
          intent="primary"
          icon="plus"
          className="!py-1.5"
          title="没有阵容预设？快去创建一个吧"
          onClick={() => navigate("/operator-recorder")}
        >
          没有阵容预设？快去创建一个吧
        </Button>
      ) : error ? (
        <Button minimal disabled intent="danger" title={formatError(error)} className="!py-1.5">
          {formatError(error)}
        </Button>
      ) : (
        presets.map((preset) => (
          <Button
            key={preset.id}
            minimal
            intent="primary"
            icon="people"
            disabled={Boolean(applyingId)}
            loading={applyingId === preset.id}
            title={preset.label}
            className="!py-1.5"
            onClick={() => void applyPreset(preset.id)}
          >
            {preset.label}
          </Button>
        ))
      )}
    </div>
  );
}
