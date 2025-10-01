import React, { createContext, useState, useContext } from "react";

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mặc định mở

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const value = {
    isSidebarOpen,
    toggleSidebar,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};
