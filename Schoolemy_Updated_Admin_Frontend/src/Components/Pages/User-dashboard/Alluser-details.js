import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../../Utils/dateUtils";
import {
  PageWrapper,
  BackButton,
  Container,
  HeaderSection,
  Heading,
  StatsContainer,
  StatCard,
  StatTitle,
  StatValue,
  SearchContainer,
  SearchInput,
  SearchIcon,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  SerialNumberCell,
  DateCell,
  StatusBadge,
  RoleBadge,
  LoadingText,
  NoResults,
  PaginationContainer,
  PaginationButton,
  PageInfo
} from "../../Common/SharedStyles";
import { usePaginatedFetch } from "../../../Hooks/usePaginatedFetch";
import { useUserStats, USER_STAT_FIELDS } from "../../../Hooks/useUserStats";

const UserTable = () => {
  const navigate = useNavigate();

  // Use custom hook for pagination and data fetching
  const { rows: users, loading, page, setPage, totalRows, totalPages, searchTerm, setSearchTerm } = usePaginatedFetch(
    "/getallusers",
    20
  );

  // Calculate stats from current page using custom hook
  const stats = useUserStats(users, totalRows, USER_STAT_FIELDS);

  if (loading) return <LoadingText>Loading users...</LoadingText>;

  return (
    <PageWrapper>
      <BackButton onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </BackButton>
      <Container>
        <HeaderSection>
        <Heading>User Management</Heading>
        <SearchContainer>
          <SearchIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
      </HeaderSection>

      <StatsContainer>
        <StatCard>
          <StatTitle>Total Users</StatTitle>
          <StatValue>{stats.totalUsers}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Male Users</StatTitle>
          <StatValue>{stats.maleCount}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Female Users</StatTitle>
          <StatValue>{stats.femaleCount}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Active Users</StatTitle>
          <StatValue>{stats.activeCount}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Inactive Users</StatTitle>
          <StatValue>{stats.inactiveCount}</StatValue>
        </StatCard>
      </StatsContainer>

      <Table>
        <TableHeader>
          <tr>
            <TableHeaderCell style={{ width: '50px' }}>S.No</TableHeaderCell>
            <TableHeaderCell>Reg No</TableHeaderCell>
            <TableHeaderCell>Username</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Mobile</TableHeaderCell>
            <TableHeaderCell>Gender</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Joined On</TableHeaderCell>
          </tr>
        </TableHeader>
        <tbody>
          {users.length > 0 ? (
            users.map((user, index) => {
              const userInfo = user.userInfo || user;
              const serialNum = (page - 1) * 20 + index + 1;
              return (
                <TableRow key={userInfo._id || userInfo.email}>
                  <SerialNumberCell>{serialNum}</SerialNumberCell>
                  <TableCell>{userInfo.studentRegisterNumber || "N/A"}</TableCell>
                  <TableCell>
                    <strong>{userInfo.username || "N/A"}</strong>
                  </TableCell>
                  <TableCell>{userInfo.email || "N/A"}</TableCell>
                  <TableCell>{userInfo.mobile || "N/A"}</TableCell>
                  <TableCell>{userInfo.gender || "N/A"}</TableCell>
                  <TableCell>
                    <StatusBadge status={userInfo.status?.toLowerCase()}>
                      {userInfo.status || "N/A"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <RoleBadge>{userInfo.role || "N/A"}</RoleBadge>
                  </TableCell>
                  <DateCell>{formatDate(userInfo.createdAt)}</DateCell>
                </TableRow>
              );
            })
          ) : (
            <tr>
              <td colSpan="9">
                <NoResults>{loading ? "Loading..." : "No users found matching your search criteria"}</NoResults>
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {users.length > 0 && (
        <PaginationContainer>
          <PaginationButton
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </PaginationButton>
          <PageInfo>
            Page {page} of {totalPages} ({totalRows} total users)
          </PageInfo>
          <PaginationButton
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages || totalPages === 0}
          >
            Next
          </PaginationButton>
        </PaginationContainer>
      )}
    </Container>
    </PageWrapper>
  );
};

export default UserTable;