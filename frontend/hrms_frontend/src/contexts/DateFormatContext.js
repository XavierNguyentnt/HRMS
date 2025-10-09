import React, { createContext, useContext } from "react";

// Tạo Context
const DateFormatContext = createContext({
  formatDate: (date) => date,
});

// Hàm tiện ích format dd/mm/yyyy
const formatToDDMMYYYY = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Provider
export const DateFormatProvider = ({ children }) => {
  const value = {
    formatDate: formatToDDMMYYYY,
  };
  return (
    <DateFormatContext.Provider value={value}>
      {children}
    </DateFormatContext.Provider>
  );
};

// Hook dùng trong các component
export const useDateFormatter = () => useContext(DateFormatContext);
