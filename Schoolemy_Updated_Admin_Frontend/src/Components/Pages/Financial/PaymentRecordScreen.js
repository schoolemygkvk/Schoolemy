import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
import styled from "styled-components";

// Styled components
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

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(110, 142, 251, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(110, 142, 251, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
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
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 1000px; /* Ensures table doesn't shrink too much */
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
  white-space: nowrap;
  
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
  }
`;

const TableCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  white-space: nowrap;
  
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

const AmountCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  font-weight: 500;
  text-align: right;
  white-space: nowrap;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  white-space: nowrap;
  
  ${props => props.status === 'success' ? `
    background-color: #d4edda;
    color: #155724;
  ` : props.status === 'pending' ? `
    background-color: #fff3cd;
    color: #856404;
  ` : props.status === 'failed' ? `
    background-color: #f8d7da;
    color: #721c24;
  ` : `
    background-color: #e2e3e5;
    color: #383d41;
  `}
`;

const MethodBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  background-color: #e0f7fa;
  color: #006064;
  white-space: nowrap;
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

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  background-color: white;
  color: #6e8efb;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
    border-color: #6e8efb;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f8f9fa;
    color: #6c757d;
    border-color: #dee2e6;
  }
`;

const PageInfo = styled.span`
  color: #6c757d;
  font-size: 14px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 10px 20px;
  border: 2px solid ${props => props.active ? '#6e8efb' : '#dee2e6'};
  background: ${props => props.active ? 'linear-gradient(135deg, #6e8efb, #a777e3)' : 'white'};
  color: ${props => props.active ? 'white' : '#495057'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.active ? '0 2px 8px rgba(110, 142, 251, 0.3)' : 'none'};
  
  &:hover {
    border-color: #6e8efb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(110, 142, 251, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${props => props.color || '#6e8efb'};
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
`;

const PaymentTypeBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  white-space: nowrap;
  background-color: ${props => props.type === 'course' ? '#e3f2fd' : '#f3e5f5'};
  color: ${props => props.type === 'course' ? '#1565c0' : '#6a1b9a'};
`;

const TransactionCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  font-family: monospace;
  font-size: 0.85em;
  white-space: nowrap;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TransactionBadge = styled.span`
  display: inline-block;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
  background: ${props => props.type === 'course' 
    ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' 
    : 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)'};
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px ${props => props.type === 'course' 
      ? 'rgba(25, 118, 210, 0.4)' 
      : 'rgba(123, 31, 162, 0.4)'};
  }
`;

const TransactionTypeLabel = styled.div`
  font-size: 10px;
  font-weight: 500;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  background: ${props => props.type === 'course' ? '#e3f2fd' : '#f3e5f5'};
  color: ${props => props.type === 'course' ? '#1565c0' : '#6a1b9a'};
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

const getPaymentTypeFromTxnId = (txnId) => {
  if (!txnId || txnId === "N/A") return "unknown";
  const txnLower = txnId.toLowerCase();
  if (txnLower.startsWith("order")) return "course";
  return "meet";
};

const PaymentRecordScreen = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("course"); // course, meet
  const [selectedTxnId, setSelectedTxnId] = useState(null);

  const limit = 20;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/payments", {
        params: {
          page: 1,
          limit: 10000, // Fetch all payments
          sortBy: "createdAt",
          order: "desc",
        },
      });
      const rows = res.data?.data;
      setPayments(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error("Error fetching payments", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const groupedByTxnId = useMemo(() => {
    return payments.reduce((acc, payment) => {
      const txnId = payment.transactionId || "N/A";
      if (!acc[txnId]) {
        acc[txnId] = {
          payments: [],
          type: getPaymentTypeFromTxnId(txnId),
          mixed: false,
        };
      }
      acc[txnId].payments.push(payment);
      return acc;
    }, {});
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const search = searchTerm.toLowerCase();

      if (selectedTxnId && payment.transactionId !== selectedTxnId) {
        return false;
      }

      const txnType = getPaymentTypeFromTxnId(payment.transactionId);
      let typeMatch = true;
      if (filterType === "course") {
        typeMatch = txnType === "course";
      } else if (filterType === "meet") {
        typeMatch = txnType === "meet";
      }

      if (!typeMatch) return false;

      return (
        payment.username?.toLowerCase().includes(search) ||
        payment.studentRegisterNumber?.toLowerCase().includes(search) ||
        payment.email?.toLowerCase().includes(search) ||
        payment.mobile?.toLowerCase().includes(search) ||
        payment.courseName?.toLowerCase().includes(search) ||
        payment.meetTitle?.toLowerCase().includes(search) ||
        payment.transactionId?.toLowerCase().includes(search) ||
        payment.paymentStatus?.toLowerCase().includes(search) ||
        payment.paymentMethod?.toLowerCase().includes(search)
      );
    });
  }, [payments, searchTerm, selectedTxnId, filterType]);

  const currentFilteredTotal = filteredPayments.length;
  const currentTotalPages = Math.ceil(currentFilteredTotal / limit);
  const startIndex = (page - 1) * limit;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + limit);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedTxnId]);

  useEffect(() => {
    const tp = Math.ceil(currentFilteredTotal / limit);
    if (tp < 1) {
      if (page !== 1) setPage(1);
      return;
    }
    if (page > tp) setPage(tp);
  }, [currentFilteredTotal, limit, page]);

  const uniqueTxnIds = Object.keys(groupedByTxnId).filter((id) => id !== "N/A")
    .length;

  const courseTxnIds = Object.entries(groupedByTxnId).filter(
    ([id, g]) => g.type === "course" && id !== "N/A"
  ).length;
  const meetTxnIds = Object.entries(groupedByTxnId).filter(
    ([id, g]) => g.type === "meet" && id !== "N/A"
  ).length;

  // Calculate statistics based on transaction ID patterns
  const coursePaymentsCount = payments.filter(p => getPaymentTypeFromTxnId(p.transactionId) === 'course').length;
  const meetPaymentsCount = payments.filter(p => getPaymentTypeFromTxnId(p.transactionId) === 'meet').length;
  const courseAmount = payments.filter(p => getPaymentTypeFromTxnId(p.transactionId) === 'course').reduce((sum, p) => sum + (p.amount || 0), 0);
  const meetAmount = payments.filter(p => getPaymentTypeFromTxnId(p.transactionId) === 'meet').reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = {
    total: payments.length,
    course: coursePaymentsCount,
    meet: meetPaymentsCount,
    uniqueTransactions: uniqueTxnIds,
    courseTxns: courseTxnIds,
    meetTxns: meetTxnIds,
    totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    courseAmount: courseAmount,
    meetAmount: meetAmount,
  };

  if (loading) return <LoadingText>Loading payments...</LoadingText>;

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Back
      </BackButton>
      <HeaderSection>
        <Heading>Payment Records</Heading>
        <SearchContainer>
          <SearchIcon></SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search by name, email, mobile, course, transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
      </HeaderSection>

      <StatsContainer>
        <StatCard color="#6e8efb">
          <StatLabel>Total Payments</StatLabel>
          <StatValue>{stats.total}</StatValue>
        </StatCard>
        <StatCard color="#1565c0">
          <StatLabel>Course Payments</StatLabel>
          <StatValue>{stats.course}</StatValue>
        </StatCard>
        <StatCard color="#6a1b9a">
          <StatLabel>Meet Payments</StatLabel>
          <StatValue>{stats.meet}</StatValue>
        </StatCard>
        <StatCard color="#d32f2f">
          <StatLabel>Unique Transactions</StatLabel>
          <StatValue>{stats.uniqueTransactions}</StatValue>
        </StatCard>
        <StatCard color="#1565c0">
          <StatLabel>Course Transactions</StatLabel>
          <StatValue>{stats.courseTxns}</StatValue>
        </StatCard>
        <StatCard color="#6a1b9a">
          <StatLabel>Meet Transactions</StatLabel>
          <StatValue>{stats.meetTxns}</StatValue>
        </StatCard>
        <StatCard color="#2e7d32">
          <StatLabel>Total Revenue</StatLabel>
          <StatValue>₹{stats.totalAmount.toFixed(2)}</StatValue>
        </StatCard>
      </StatsContainer>

      <FilterContainer>
        <FilterButton 
          active={filterType === "course"} 
          onClick={() => {
            setFilterType("course");
            setSelectedTxnId(null);
            setPage(1);
          }}
        >
          Course Payments ({stats.course})
        </FilterButton>
        <FilterButton 
          active={filterType === "meet"} 
          onClick={() => {
            setFilterType("meet");
            setSelectedTxnId(null);
            setPage(1);
          }}
        >
          Meet Payments ({stats.meet})
        </FilterButton>
        {selectedTxnId && (
          <FilterButton 
            active={true}
            onClick={() => {
              setSelectedTxnId(null);
              setPage(1);
            }}
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}
          >
            Transaction: {selectedTxnId.substring(0, 15)}... ✕
          </FilterButton>
        )}
      </FilterContainer>

      <TableWrapper>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell style={{ width: '50px' }}>#</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Reg No</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Mobile</TableHeaderCell>
              <TableHeaderCell>{filterType === 'meet' ? 'Meet Title' : 'Course'}</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Method</TableHeaderCell>
              <TableHeaderCell>Txn ID</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
            </tr>
          </TableHeader>
          <tbody>
            {paginatedPayments.length > 0 ? (
              paginatedPayments.map((payment, index) => {
                const paymentType = getPaymentTypeFromTxnId(payment.transactionId);
                return (
                  <TableRow key={payment._id}>
                    <SerialNumberCell>{startIndex + index + 1}</SerialNumberCell>
                    <TableCell>
                      <PaymentTypeBadge type={paymentType}>
                        {paymentType}
                      </PaymentTypeBadge>
                    </TableCell>
                    <TableCell>{payment.username}</TableCell>
                    <TableCell>{payment.studentRegisterNumber}</TableCell>
                    <TableCell>{payment.email}</TableCell>
                    <TableCell>{payment.mobile}</TableCell>
                    <TableCell>{payment.courseName || payment.meetTitle || 'N/A'}</TableCell>
                    <AmountCell>₹{payment.amount.toFixed(2)}</AmountCell>
                    <TableCell>
                      <StatusBadge status={payment.paymentStatus?.toLowerCase()}>
                        {payment.paymentStatus}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <MethodBadge>{payment.paymentMethod}</MethodBadge>
                    </TableCell>
                    <TransactionCell>
                      <TransactionBadge
                        type={paymentType}
                        onClick={() => setSelectedTxnId(payment.transactionId)}
                        title={`Click to filter by ${payment.transactionId}\nPayment Type: ${paymentType.toUpperCase()}\nTransactions with this ID: ${groupedByTxnId[payment.transactionId]?.payments.length || 0}`}
                      >
                        {payment.transactionId}
                        {groupedByTxnId[payment.transactionId]?.payments.length > 1 && 
                          ` (${groupedByTxnId[payment.transactionId].payments.length})`
                        }
                      </TransactionBadge>
                      <TransactionTypeLabel type={paymentType}>
                        {paymentType === 'course' ? 'Course Payment' : 'Meet Payment'}
                      </TransactionTypeLabel>
                    </TransactionCell>
                    <DateCell>{formatDate(payment.createdAt)}</DateCell>
                  </TableRow>
                );
              })
            ) : (
              <tr>
                <td colSpan="12">
                  <NoResults>
                    {selectedTxnId 
                      ? `No payments found for transaction ID: ${selectedTxnId}` 
                      : 'No payments found matching your search criteria'
                    }
                  </NoResults>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {currentTotalPages > 1 && (
        <PaginationContainer>
          <PaginationButton
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </PaginationButton>
          <PageInfo>
            Page {page} of {currentTotalPages} ({currentFilteredTotal} {filterType} payments)
          </PageInfo>
          <PaginationButton
            onClick={() => setPage((prev) => Math.min(prev + 1, currentTotalPages))}
            disabled={page === currentTotalPages}
          >
            Next
          </PaginationButton>
        </PaginationContainer>
      )}
    </Container>
  );
};

export default PaymentRecordScreen;