// src/hooks/useDocuments.js (Phiên bản đã sửa lỗi debounce)
import { useState, useCallback, useEffect, useMemo } from "react"; // 👈 1. Import thêm useMemo
import {
  fetchDocuments,
  fetchSubDirectories,
  fetchImmediateFiles,
} from "../../services/api/dmsAPI";
import { debounce } from "lodash";

export const useDocuments = () => {
  const [immediateItems, setImmediateItems] = useState([]); // Cho khu vực trên
  const [allItems, setAllItems] = useState([]); // Cho khu vực dưới
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
      const allFilesDomain = [];
      if (searchTerm) {
        allFilesDomain.push(
          "|",
          "|",
          ["name", "ilike", searchTerm],
          ["path_names", "ilike", searchTerm],
          ["create_uid", "ilike", searchTerm]
        );
      }
      if (selectedDir) {
        allFilesDomain.push(["directory_id", "child_of", selectedDir.id]);
      }
      if (dateRange.from) {
        allFilesDomain.push(["create_date", ">=", dateRange.from]);
      }
      if (dateRange.to) {
        allFilesDomain.push(["create_date", "<=", dateRange.to + "T23:59:59"]);
      }
      const sortOrder = `${sortConfig.field} ${sortConfig.order}`;
      const [allFilesData, subDirsData, immediateFilesData] = await Promise.all(
        [
          fetchDocuments(allFilesDomain, 200, sortOrder), // Dữ liệu cho khu vực dưới
          fetchSubDirectories(selectedDir?.id), // Thư mục cho khu vực trên
          fetchImmediateFiles(selectedDir?.id), // File cho khu vực trên
        ]
      );

      // Chuẩn bị dữ liệu cho khu vực trên (Thư mục + File trực tiếp)
      const directories = subDirsData.map((d) => ({ ...d, type: "directory" }));
      const immediateFiles = immediateFilesData.map((f) => ({
        ...f,
        type: "file",
      }));
      setImmediateItems([...directories, ...immediateFiles]);

      // Chuẩn bị dữ liệu cho khu vực dưới (Tất cả file)
      setAllItems(allFilesData.map((f) => ({ ...f, type: "file" })));
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
    immediateItems, // 👈 Trả về danh sách cho khu vực trên
    allItems, // 👈 Trả về danh sách cho khu vực dưới
    loading,
    filters: { sortConfig, searchTerm, dateRange, selectedDir },
    setFilters: { setSortConfig, setSearchTerm, setDateRange, setSelectedDir },
    refresh: loadDocuments,
  };
};
