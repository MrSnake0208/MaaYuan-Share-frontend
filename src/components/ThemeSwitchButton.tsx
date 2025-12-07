import { Button } from "@blueprintjs/core";
import { useCallback, useEffect, useState } from "react";

type ThemeName = "light" | "maayuan" | "dark";

const themeOrder: ThemeName[] = ["light", "maayuan", "dark"];
const themeIcon: Record<ThemeName, "flash" | "tint" | "moon"> = {
  light: "flash",
  maayuan: "tint",
  dark: "moon",
};

const getInitialTheme = (): ThemeName => {
  const saved = localStorage.getItem("theme") as ThemeName | null;
  if (saved && themeOrder.includes(saved)) return saved;
  return "maayuan";
};

export const ThemeSwitchButton = () => {
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme());

  const applyTheme = useCallback((next: ThemeName) => {
    document.body.classList.toggle("bp4-dark", next === "dark");
    document.body.classList.toggle("dark", next === "dark");
    document.body.classList.toggle("theme-maayuan", next === "maayuan");
    document.body.dataset.theme = next;
    localStorage.setItem("theme", next);
  }, []);

  const handleThemeSwitch = useCallback(() => {
    const currentIndex = themeOrder.indexOf(theme);
    const next = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(next);
  }, [theme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return <Button onClick={handleThemeSwitch} icon={themeIcon[theme]} />;
};
