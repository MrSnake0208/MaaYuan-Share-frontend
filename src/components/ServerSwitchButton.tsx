import { Button, Tooltip } from "@blueprintjs/core";
import { useMemo } from "react";

import { getSiteSwitchInfo } from "../utils/serverSwitch";

export const ServerSwitchButton = () => {
  const { targetSite } = useMemo(() => getSiteSwitchInfo(), []);

  if (!targetSite) {
    return null;
  }

  const tooltip = `当前站点不可用时可跳转至：${targetSite}`;

  const handleClick = () => {
    window.location.href = targetSite;
  };

  return (
    <Tooltip content={tooltip}>
      <Button minimal icon="exchange" onClick={handleClick}>
        切换站点
      </Button>
    </Tooltip>
  );
};
