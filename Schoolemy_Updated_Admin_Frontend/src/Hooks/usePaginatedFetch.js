
import { useCallback, useEffect, useState } from "react";
import axios from "../Utils/api";


export const usePaginatedFetch = (endpoint, pageSize = 20) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTermState] = useState("");
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the search term changes
  const setSearchTerm = useCallback((term) => {
    setPage(1);
    setSearchTermState(term);
  }, []);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (pageNum = 1, searchQuery = "") => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: pageNum,
          limit: pageSize,
          ...(searchQuery && { search: searchQuery })
        };

        const response = await axios.get(endpoint, { params });

        const fetchedRows = response.data.data || [];
        const paginationData = response.data.pagination || {};

        setRows(fetchedRows);
        setTotalRows(paginationData.total || 0);
        setTotalPages(paginationData.pages || 0);
      } catch (err) {
        setError(err.message);
        setRows([]);
        setTotalRows(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, pageSize]
  );

  useEffect(() => {
    fetchData(page, searchTerm);
  }, [page, searchTerm, fetchData]);

  return {
    rows,
    loading,
    error,
    page,
    setPage,
    totalRows,
    totalPages,
    searchTerm,
    setSearchTerm
  };
};
