import { Button, Menu, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import { useState } from "react";

import { loadOperatorBoxTrainingConfigs } from "../../../../apis/operator-box-training-config";
import { useOperatorBoxPresets } from "../../../../apis/operator-box-preset";
import { AppToaster } from "../../../Toaster";
import { useSheet } from "../../../editor/operator/sheet/SheetProvider";
import { useTranslation } from "../../../../i18n/i18n";
import { getOperatorBoxKeys } from "../../../../models/operator-box-preset";
import { formatError } from "../../../../utils/error";
import { createOperator } from "../../reconciliation";
import { MAX_ACTIVE_OPERATORS } from "../constants";
import { applyOperatorTrainingConfig } from "../operatorTrainingConfigModel";

interface OperatorBoxPresetSelectProps {
  maxSelected?: number;
}

export function OperatorBoxPresetSelect({
  maxSelected = MAX_ACTIVE_OPERATORS,
}: OperatorBoxPresetSelectProps) {
  const t = useTranslation();
  const { data: presets = [], error, isLoading } = useOperatorBoxPresets();
  const { existedOperators, submitOperatorInSheet } = useSheet();
  const [applyingId, setApplyingId] = useState<string>();

  if (!isLoading && !error && presets.length === 0) return null;

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
      const existingNames = new Set(
        existedOperators.map((operator) => operator.name),
      );
      let remainingSlots = maxSelected - existedOperators.length;

      for (const name of getOperatorBoxKeys(preset)) {
        if (existingNames.has(name)) continue;
        if (remainingSlots <= 0) break;

        const baseOperator = createOperator({ name });
        const config = configsByOperatorId.get(name);
        const operator = config
          ? applyOperatorTrainingConfig(baseOperator, config)
          : baseOperator;
        if (submitOperatorInSheet(operator)) {
          existingNames.add(name);
          remainingSlots -= 1;
        }
      }
    } catch (caught) {
      AppToaster.show({ intent: "danger", message: formatError(caught) });
    } finally {
      setApplyingId(undefined);
    }
  };

  return (
    <Popover2
      captureDismiss
      usePortal
      popoverClassName="z-[1600]"
      portalClassName="z-[1600]"
      content={
        <Menu>
          {isLoading ? (
            <MenuItem disabled text={t.common.loading} />
          ) : error ? (
            <MenuItem disabled intent="danger" text={formatError(error)} />
          ) : (
            presets.map((preset) => (
              <MenuItem
                key={preset.id}
                icon="people"
                disabled={Boolean(applyingId)}
                text={preset.label}
                onClick={() => void applyPreset(preset.id)}
              />
            ))
          )}
        </Menu>
      }
    >
      <Button
        minimal
        icon="people"
        loading={Boolean(applyingId)}
        title={t.components.OperatorFilter.box_presets}
      />
    </Popover2>
  );
}
