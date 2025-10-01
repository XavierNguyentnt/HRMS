import React, { useState, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import { SunFill, MoonStarsFill, Display } from "react-bootstrap-icons";
import "./Layout.css";

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");

  useEffect(() => {
    const root = window.document.documentElement;
    const currentTheme = localStorage.getItem("theme");

    if (currentTheme) {
      root.setAttribute("data-theme", currentTheme);
    } else {
      root.removeAttribute("data-theme");
    }
  }, []);

  const switchTheme = (newTheme) => {
    const root = window.document.documentElement;
    if (newTheme === "system") {
      localStorage.removeItem("theme");
      root.removeAttribute("data-theme");
    } else {
      localStorage.setItem("theme", newTheme);
      root.setAttribute("data-theme", newTheme);
    }
    setTheme(newTheme);
  };

  const icons = {
    light: <SunFill />,
    dark: <MoonStarsFill />,
    system: <Display />,
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="link"
        id="theme-switcher"
        className="header-icon text-decoration-none p-0">
        {icons[theme]}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item
          onClick={() => switchTheme("light")}
          active={theme === "light"}>
          <SunFill className="me-2" /> Light
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => switchTheme("dark")}
          active={theme === "dark"}>
          <MoonStarsFill className="me-2" /> Dark
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => switchTheme("system")}
          active={theme === "system"}>
          <Display className="me-2" /> System
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ThemeSwitcher;
