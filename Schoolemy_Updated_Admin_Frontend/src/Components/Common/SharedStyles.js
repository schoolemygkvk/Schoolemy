import styled from "styled-components";

export const PageWrapper = styled.div`
  padding: 2rem;
`;

export const Container = styled.div`
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  max-width: 1200px;
  margin: 2rem auto;
`;

export const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;
export const BackButton = styled.button`
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

export const Heading = styled.h2`
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

export const LoadingText = styled.p`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-size: 18px;
`;

export const StatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

export const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex: 1;
  min-width: 150px;
`;

export const StatTitle = styled.div`
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

export const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
`;

export const SearchContainer = styled.div`
  position: relative;
  min-width: 250px;
`;

export const SearchInput = styled.input`
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

export const SearchIcon = styled.span`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

export const TableHeader = styled.thead`
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
`;

export const TableHeaderCell = styled.th`
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

export const TableRow = styled.tr`
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

export const TableCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;

  &:first-child {
    font-weight: 500;
    color: #212529;
    text-align: center;
  }
`;

export const SerialNumberCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #6c757d;
  text-align: center;
  font-size: 0.9em;
`;

export const DateCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  font-size: 0.9em;
  white-space: nowrap;
`;

// Badges
export const StatusBadge = styled.span`
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

export const RoleBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  background-color: #e0f7fa;
  color: #006064;
`;

export const NoResults = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-size: 16px;
  background: white;
  border-radius: 8px;
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

export const PaginationButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(110, 142, 251, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PageInfo = styled.div`
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
`;
