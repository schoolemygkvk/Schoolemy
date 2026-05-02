// Custom hook for calculating user statistics
// Computes stat card values (total, male/female, active/inactive, etc.) from user rows
// Used across User Management and Login Status pages

import { useMemo } from "react";

export const useUserStats = (rows, totalRows, statFields) => {
  return useMemo(() => {
    // Always include total users from API metadata (not just current page)
    const result = { totalUsers: totalRows || 0 };

    // Calculate each stat by filtering rows and counting matches
    if (statFields && Array.isArray(statFields)) {
      statFields.forEach(({ key, filter }) => {
        if (key && typeof filter === 'function') {
          result[key] = rows.filter(filter).length;
        }
      });
    }

    return result;
  }, [rows, totalRows, statFields]);
};



export const USER_STAT_FIELDS = [
  {
    key: 'maleCount',
    label: 'Male Users',
    filter: (user) => {
      const userInfo = user.userInfo || user;
      return userInfo.gender?.toString().trim().toLowerCase() === 'male';
    }
  },
  {
    key: 'femaleCount',
    label: 'Female Users',
    filter: (user) => {
      const userInfo = user.userInfo || user;
      return userInfo.gender?.toString().trim().toLowerCase() === 'female';
    }
  },
  {
    key: 'activeCount',
    label: 'Active Users',
    filter: (user) => {
      const userInfo = user.userInfo || user;
      return userInfo.status?.toString().trim().toLowerCase() === 'active';
    }
  },
  {
    key: 'inactiveCount',
    label: 'Inactive Users',
    filter: (user) => {
      const userInfo = user.userInfo || user;
      return userInfo.status?.toString().trim().toLowerCase() === 'inactive';
    }
  }
];
