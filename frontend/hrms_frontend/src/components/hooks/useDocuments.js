// src/hooks/useDocuments.js (Phiên bản đã sửa lỗi debounce)
import { useState, useCallback, useEffect, useMemo } from "react"; // 👈 1. Import thêm useMemo
import { fetchDocuments } from "../../services/api/dmsAPI";
import { debounce } from "lodash";

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // State cho các bộ lọc
  const [sortConfig, setSortConfig] = useState({
    field: "create_date",
    order: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedDir, setSelectedDir] = useState(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const domain = [];
      if (searchTerm) {
        domain.push(
          "|",
          "|",
          ["name", "ilike", searchTerm],
          ["path_names", "ilike", searchTerm],
          ["create_uid", "ilike", searchTerm]
        );
      }
      if (selectedDir) {
        domain.push(["directory_id", "child_of", selectedDir.id]);
      }
      if (dateRange.from) {
        domain.push(["create_date", ">=", dateRange.from]);
      }
      if (dateRange.to) {
        domain.push(["create_date", "<=", dateRange.to + "T23:59:59"]);
      }
      const sortOrder = `${sortConfig.field} ${sortConfig.order}`;
      const data = await fetchDocuments(domain, 200, sortOrder);
      setDocuments(data);
    } catch (err) {
      console.error("Lỗi tải tài liệu:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDir, dateRange, sortConfig]);

  // 👇 2. Sửa lại hoàn toàn logic debounce
  // Sử dụng useMemo để đảm bảo hàm debounced chỉ được tạo một lần
  const debouncedLoadDocuments = useMemo(
    () => debounce(loadDocuments, 500),
    [loadDocuments]
  );

  useEffect(() => {
    // Gọi hàm debounced
    debouncedLoadDocuments();

    // Hàm cleanup sẽ hủy bỏ lần gọi cuối cùng nếu component bị unmount
    return () => {
      debouncedLoadDocuments.cancel();
    };
  }, [debouncedLoadDocuments]);

  return {
    documents,
    loading,
    filters: { sortConfig, searchTerm, dateRange, selectedDir },
    setFilters: { setSortConfig, setSearchTerm, setDateRange, setSelectedDir },
    refresh: loadDocuments,
  };
};
