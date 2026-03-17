import React, { useEffect, useState, useCallback } from "react";
import axios from "../../../Utils/api";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

// Styled components
const PageWrapper = styled.div`
  padding: 2rem;
  max-width: 100%;
  box-sizing: border-box;
`;

const BackButton = styled.button`
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Container = styled.div`
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  overflow-x: auto;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Heading = styled.h2`
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  position: relative;
  padding-bottom: 0.5rem;
  margin: 0;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #3498db, #9b59b6);
    border-radius: 2px;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex: 1;
  min-width: 150px;
`;

const StatTitle = styled.div`
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
`;

const SearchContainer = styled.div`
  position: relative;
  min-width: 250px;
`;

const SearchInput = styled.input`
  padding: 10px 15px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 25px;
  width: 100%;
  font-size: 14px;
  transition: all 0.3s ease;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #6e8efb;
    box-shadow: 0 0 0 3px rgba(110, 142, 251, 0.1);
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  min-width: 0;
`;

const Table = styled.table`
  width: 100%;
  min-width: 900px;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  table-layout: auto;
`;

const TableHeader = styled.thead`
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
`;

const TableHeaderCell = styled.th`
  padding: 16px 12px;
  text-align: left;
  font-weight: 500;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 60%;
    width: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TableRow = styled.tr`
  transition: all 0.2s ease;
  
  &:nth-child(even) {
    background-color: #f8f9fa;
  }
  
  &:hover {
    background-color: #f1f3f5;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const TableCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  vertical-align: middle;
  font-size: 0.9em;
  
  &:first-child {
    font-weight: 500;
    color: #212529;
    text-align: center;
  }
`;

const DateCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  white-space: nowrap;
  vertical-align: middle;
  font-size: 0.9em;
`;

const SerialNumberCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #6c757d;
  text-align: center;
  font-size: 0.9em;
`;

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

const LoadingText = styled.p`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-size: 18px;
`;

const NoResults = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-size: 16px;
  background: white;
  border-radius: 8px;
`;

// Date formatting function
const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return "—";
  }
};

// Format duration from milliseconds
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

// Calculate duration from loginTime and logoutTime
const calculateDuration = (loginTime, logoutTime) => {
  if (!loginTime) return "—";
  const login = new Date(loginTime).getTime();
  if (isNaN(login)) return "—";
  const endTime = logoutTime ? new Date(logoutTime).getTime() : Date.now();
  if (logoutTime && (isNaN(endTime) || endTime < login)) return "—";
  return formatDuration(endTime - login);
};

const UserLoginStatus = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    loggedOutUsers: 0,
    totalLoginSessions: 0
  });

  const calculateStats = (users) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status?.toLowerCase() === 'active').length;
    const inactiveUsers = users.filter(user => user.status?.toLowerCase() === 'inactive').length;
    const loggedOutUsers = users.filter(user => user.status?.toLowerCase() === 'logged-out').length;
    const totalLoginSessions = users.reduce((total, user) => total + (user.loginHistory?.length || 0), 0);
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      loggedOutUsers,
      totalLoginSessions
    };
  };

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get("/getallusers");
      const userData = response.data.data;
      setUsers(userData);
      setFilteredUsers(userData);
      setStats(calculateStats(userData));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        Object.values(user).some(
          value => value && 
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

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
        <Table>
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <TableRow key={user._id}>
                  <SerialNumberCell>{index + 1}</SerialNumberCell>
                  <TableCell>{user.studentRegisterNumber || "N/A"}</TableCell>
                  <TableCell>
                    <strong>{user.username || "N/A"}</strong>
                  </TableCell>
                  <TableCell>{user.email || "N/A"}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.status?.toLowerCase()}>
                      {user.status || "N/A"}
                    </StatusBadge>
                  </TableCell>
                  <DateCell>{formatDate(user.lastActivity)}</DateCell>
                  <DateCell>{formatDate(user.lastLogout)}</DateCell>
                  <TableCell>
                    {user.loginHistory && user.loginHistory.length > 0 ? (
                      <LoginHistoryContainer>
                        {user.loginHistory.slice(-5).reverse().map((session, idx) => (
                          <LoginEntry key={idx}>
                            <div><strong>Login:</strong> {formatDate(session.loginTime)}</div>
                            <div><strong>Logout:</strong> {session.logoutTime ? formatDate(session.logoutTime) : "Active"}</div>
                            <div><strong>Duration:</strong> {calculateDuration(session.loginTime, session.logoutTime)}</div>
                            {session.ipAddress && session.ipAddress !== "127.0.0.1" && (
                              <div><strong>IP:</strong> {session.ipAddress}</div>
                            )}
                          </LoginEntry>
                        ))}
                        {user.loginHistory.length > 5 && (
                          <div style={{textAlign: 'center', fontSize: '0.8em', color: '#6c757d', padding: '4px'}}>
                            ... and {user.loginHistory.length - 5} more sessions
                          </div>
                        )}
                      </LoginHistoryContainer>
                    ) : (
                      <span style={{color: '#6c757d', fontStyle: 'italic'}}>No login history</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  <NoResults>No users found matching your search criteria</NoResults>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        </TableWrapper>
      </Container>
    </PageWrapper>
  );
};

export default UserLoginStatus;
