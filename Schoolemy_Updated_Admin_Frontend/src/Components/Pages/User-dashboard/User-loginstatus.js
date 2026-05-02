import React from "react";
import styled from "styled-components";
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
  DateCell,
  SerialNumberCell,
  LoadingText,
  NoResults,
  PaginationContainer,
  PaginationButton,
  PageInfo
} from "../../Common/SharedStyles";
import { usePaginatedFetch } from "../../../Hooks/usePaginatedFetch";
import { useUserStats } from "../../../Hooks/useUserStats";

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  min-width: 0;
`;

const TableStyled = styled(Table)`
  min-width: 900px;
  table-layout: auto;
`;

// Custom StatusBadge for this page with 'logged-out' status
const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;

  ${props => props.status === 'active' ? `
    background-color: #d4edda;
    color: #155724;
  ` : props.status === 'inactive' ? `
    background-color: #f8d7da;
    color: #721c24;
  ` : props.status === 'logged-out' ? `
    background-color: #fff3cd;
    color: #856404;
  ` : `
    background-color: #e2e3e5;
    color: #383d41;
  `}
`;

const LoginHistoryContainer = styled.div`
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #e9ecef;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #6e8efb;
    border-radius: 3px;
  }
`;

const LoginEntry = styled.div`
  background: white;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 8px;
  border-left: 3px solid #6e8efb;
  font-size: 0.85em;
  line-height: 1.6;

  &:last-child {
    margin-bottom: 0;
  }

  div {
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }

    strong {
      color: #495057;
      margin-right: 4px;
    }
  }
`;

const formatDuration = (durationMs) => {
  if (durationMs == null || durationMs < 0) return "—";
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  const secs = Math.floor((durationMs % 60000) / 1000);
  return secs > 0 ? `${secs}s` : "—";
};

const calculateDuration = (loginTime, logoutTime) => {
  if (!loginTime) return "—";
  const login = new Date(loginTime).getTime();
  if (isNaN(login)) return "—";
  const endTime = logoutTime ? new Date(logoutTime).getTime() : Date.now();
  if (logoutTime && (isNaN(endTime) || endTime < login)) return "—";
  return formatDuration(endTime - login);
};

const LOGIN_STATUS_STAT_FIELDS = [
  {
    key: 'activeUsers',
    label: 'Active Users',
    filter: (user) => {
      const userInfo = user.userInfo || user;
      return userInfo.status?.toLowerCase() === 'active';
    }
  },
  {
    key: 'inactiveUsers',
    label: 'Inactive Users',
    filter: (user) => {
      const userInfo = user.userInfo || user;
      return userInfo.status?.toLowerCase() === 'inactive';
    }
  },
  {
    key: 'loggedOutUsers',
    label: 'Logged Out Users',
    filter: (user) => {
      const userInfo = user.userInfo || user;
      return userInfo.status?.toLowerCase() === 'logged-out';
    }
  }
];

const UserLoginStatus = () => {
  const navigate = useNavigate();

  const { rows: users, loading, page, setPage, totalRows, totalPages, searchTerm, setSearchTerm } = usePaginatedFetch(
    "/getallusers",
    20
  );

  const baseStats = useUserStats(users, totalRows, LOGIN_STATUS_STAT_FIELDS);

  const stats = {
    totalUsers: totalRows,
    ...baseStats,
    totalLoginSessions: users.reduce((acc, user) => {
      const userInfo = user.userInfo || user;
      return acc + (userInfo.loginHistory?.length || 0);
    }, 0)
  };

  if (loading) return <LoadingText>Loading user login status...</LoadingText>;

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
          <Heading>User Login Status</Heading>
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
            <StatTitle>Active Users</StatTitle>
            <StatValue>{stats.activeUsers}</StatValue>
          </StatCard>
          <StatCard>
            <StatTitle>Inactive Users</StatTitle>
            <StatValue>{stats.inactiveUsers}</StatValue>
          </StatCard>
          <StatCard>
            <StatTitle>Logged Out Users</StatTitle>
            <StatValue>{stats.loggedOutUsers}</StatValue>
          </StatCard>
          <StatCard>
            <StatTitle>Total Login Sessions</StatTitle>
            <StatValue>{stats.totalLoginSessions}</StatValue>
          </StatCard>
        </StatsContainer>

        <TableWrapper>
        <TableStyled>
          <TableHeader>
            <tr>
              <TableHeaderCell style={{ width: '60px' }}>S.No</TableHeaderCell>
              <TableHeaderCell style={{ width: '120px' }}>Reg No</TableHeaderCell>
              <TableHeaderCell style={{ width: '150px' }}>Username</TableHeaderCell>
              <TableHeaderCell style={{ width: '200px' }}>Email</TableHeaderCell>
              <TableHeaderCell style={{ width: '100px' }}>Status</TableHeaderCell>
              <TableHeaderCell style={{ width: '150px' }}>Last Activity</TableHeaderCell>
              <TableHeaderCell style={{ width: '150px' }}>Last Logout</TableHeaderCell>
              <TableHeaderCell>Login History</TableHeaderCell>
            </tr>
          </TableHeader>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => {
                const userInfo = user.userInfo || user;
                const serialNum = (page - 1) * 20 + index + 1;
                const loginHistory = userInfo.loginHistory || [];
                return (
                  <TableRow key={userInfo._id || userInfo.email}>
                    <SerialNumberCell>{serialNum}</SerialNumberCell>
                    <TableCell>{userInfo.studentRegisterNumber || "N/A"}</TableCell>
                    <TableCell>
                      <strong>{userInfo.username || "N/A"}</strong>
                    </TableCell>
                    <TableCell>{userInfo.email || "N/A"}</TableCell>
                    <TableCell>
                      <StatusBadge status={userInfo.status?.toLowerCase()}>
                        {userInfo.status || "N/A"}
                      </StatusBadge>
                    </TableCell>
                    <DateCell>{formatDate(userInfo.lastActivity)}</DateCell>
                    <DateCell>{formatDate(userInfo.lastLogout)}</DateCell>
                    <TableCell>
                      {loginHistory && loginHistory.length > 0 ? (
                        <LoginHistoryContainer>
                          {loginHistory.slice(-5).reverse().map((session, idx) => (
                            <LoginEntry key={idx}>
                              <div><strong>Login:</strong> {formatDate(session.loginTime)}</div>
                              <div><strong>Logout:</strong> {session.logoutTime ? formatDate(session.logoutTime) : "Active"}</div>
                              <div><strong>Duration:</strong> {calculateDuration(session.loginTime, session.logoutTime)}</div>
                              {session.ipAddress && session.ipAddress !== "127.0.0.1" && (
                                <div><strong>IP:</strong> {session.ipAddress}</div>
                              )}
                            </LoginEntry>
                          ))}
                          {loginHistory.length > 5 && (
                            <div style={{textAlign: 'center', fontSize: '0.8em', color: '#6c757d', padding: '4px'}}>
                              ... and {loginHistory.length - 5} more sessions
                            </div>
                          )}
                        </LoginHistoryContainer>
                      ) : (
                        <span style={{color: '#6c757d', fontStyle: 'italic'}}>No login history</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <tr>
                <td colSpan="8">
                  <NoResults>{loading ? "Loading..." : "No users found matching your search criteria"}</NoResults>
                </td>
              </tr>
            )}
          </tbody>
        </TableStyled>
        </TableWrapper>

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

export default UserLoginStatus;
