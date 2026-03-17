import React, { useEffect, useState } from "react";
import axios from "../../../Utils/api";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

// Styled components
const PageWrapper = styled.div`
  padding: 2rem;
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
  max-width: 1200px;
  margin: 2rem auto;
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

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
  
  &:first-child {
    font-weight: 500;
    color: #212529;
    text-align: center;
  }
`;

const SerialNumberCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #6c757d;
  text-align: center;
  font-size: 0.9em;
`;

const DateCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  font-size: 0.9em;
  white-space: nowrap;
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
  ` : `
    background-color: #e2e3e5;
    color: #383d41;
  `}
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  background-color: #e0f7fa;
  color: #006064;
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
  if (!dateString) return "N/A";
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const UserTable = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    maleCount: 0,
    femaleCount: 0,
    activeCount: 0,
    inactiveCount: 0
  });

  const calculateStats = (users) => {
    const totalUsers = users.length;
    const maleCount = users.filter(user => user.gender?.toLowerCase() === 'male').length;
    const femaleCount = users.filter(user => user.gender?.toLowerCase() === 'female').length;
    const activeCount = users.filter(user => user.status?.toLowerCase() === 'active').length;
    const inactiveCount = users.filter(user => user.status?.toLowerCase() === 'inactive').length;
    
    return {
      totalUsers,
      maleCount,
      femaleCount,
      activeCount,
      inactiveCount
    };
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/getallusers");
      const userData = response.data.data;
      setUsers(userData);
      setFilteredUsers(userData);
      setStats(calculateStats(userData)); // Set stats only once with all users
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  });

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
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <TableRow key={user._id}>
                <SerialNumberCell>{index + 1}</SerialNumberCell>
                <TableCell>{user.studentRegisterNumber || "N/A"}</TableCell>
                <TableCell>
                  <strong>{user.username || "N/A"}</strong>
                </TableCell>
                <TableCell>{user.email || "N/A"}</TableCell>
                <TableCell>{user.mobile || "N/A"}</TableCell>
                <TableCell>{user.gender || "N/A"}</TableCell>
                <TableCell>
                  <StatusBadge status={user.status?.toLowerCase()}>
                    {user.status || "N/A"}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <RoleBadge>{user.role || "N/A"}</RoleBadge>
                </TableCell>
                <DateCell>{formatDate(user.createdAt)}</DateCell>
              </TableRow>
            ))
          ) : (
            <tr>
              <td colSpan="9">
                <NoResults>No users found matching your search criteria</NoResults>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
    </PageWrapper>
  );
};

export default UserTable;