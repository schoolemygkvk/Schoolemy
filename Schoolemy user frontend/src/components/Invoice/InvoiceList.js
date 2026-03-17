// components/Invoice/InvoiceList.js
import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { getMyInvoices } from "../../service/invoiceApi";

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 2px solid #e2e8f0;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1.5rem;

  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
    transform: translateX(-2px);
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 1.1rem;
    color: #718096;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
    }
  }
`;

const FilterSection = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    gap: 0.5rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 0 0 180px;
  min-width: 100px;

  label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #4a5568;
  }

  select,
  input {
    padding: 0.6rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  @media (max-width: 768px) {
    flex: 1 1 100%;
    min-width: unset;
  }

  @media (max-width: 480px) {
    gap: 0.4rem;

    label {
      font-size: 0.85rem;
    }

    select,
    input {
      font-size: 0.85rem;
      padding: 0.5rem;
    }
  }
`;

const InvoiceGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const InvoiceCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border-left: 4px solid
    ${(props) => {
      switch (props.invoiceType) {
        case "payment":
          return "#10b981";
        case "emi":
          return "#3b82f6";
        case "meet":
          return "#f59e0b";
        case "tutor":
          return "#8b5cf6";
        default:
          return "#6b7280";
      }
    }};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 10px;

    &:hover {
      transform: translateY(-2px);
    }
  }
`;

const InvoiceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const InvoiceNumber = styled.h3`
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
`;

const InvoiceType = styled.div`
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  background: ${(props) => {
    switch (props.type) {
      case "payment":
        return "#d1fae5";
      case "emi":
        return "#dbeafe";
      case "meet":
        return "#fef3c7";
      case "tutor":
        return "#ede9fe";
      default:
        return "#e5e7eb";
    }
  }};
  color: ${(props) => {
    switch (props.type) {
      case "payment":
        return "#065f46";
      case "emi":
        return "#1e40af";
      case "meet":
        return "#92400e";
      case "tutor":
        return "#5b21b6";
      default:
        return "#374151";
    }
  }};
`;

const InvoiceDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  gap: 0.5rem;

  .label {
    color: #718096;
    font-weight: 500;
    flex-shrink: 0;
  }

  .value {
    color: #1a202c;
    font-weight: 600;
    text-align: right;
    word-break: break-word;
  }

  &.amount {
    padding-top: 0.75rem;
    border-top: 2px solid #e2e8f0;

    .value {
      font-size: 1.5rem;
      color: #10b981;
    }
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;

    .label {
      min-width: auto;
    }

    .value {
      text-align: left;
      width: 100%;
    }

    &.amount {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      .value {
        font-size: 1.25rem;
      }
    }
  }
`;

const InvoiceFooter = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &.secondary {
    background: #f7fafc;
    color: #4a5568;
    border: 2px solid #e2e8f0;

    &:hover {
      background: #edf2f7;
      border-color: #cbd5e0;
    }

    &:active {
      background: #e2e8f0;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 0.65rem;
    font-size: 0.85rem;
    gap: 0.4rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

const LoadingSkeleton = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 12px;
  height: 200px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h3 {
    font-size: 1.5rem;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }

  p {
    color: #718096;
  }

  @media (max-width: 768px) {
    padding: 2rem 1rem;

    .icon {
      font-size: 3rem;
    }

    h3 {
      font-size: 1.2rem;
    }

    p {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    padding: 1.5rem 1rem;

    .icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }

    h3 {
      font-size: 1.1rem;
    }

    p {
      font-size: 0.85rem;
    }
  }
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: #fee;
  border-radius: 12px;
  border: 2px solid #fcc;

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    color: #e53e3e;
  }

  h3 {
    font-size: 1.5rem;
    color: #e53e3e;
    margin-bottom: 0.5rem;
  }

  p {
    color: #c53030;
    margin-bottom: 1rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: #e53e3e;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #c53030;
    }

    &:active {
      background: #a01f1f;
    }
  }

  @media (max-width: 768px) {
    padding: 2rem 1rem;

    .icon {
      font-size: 3rem;
    }

    h3 {
      font-size: 1.2rem;
    }

    button {
      padding: 0.65rem 1.25rem;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    padding: 1.5rem 1rem;
    border-radius: 8px;

    .icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }

    h3 {
      font-size: 1.1rem;
    }

    p {
      font-size: 0.85rem;
    }

    button {
      width: 100%;
      padding: 0.6rem;
      font-size: 0.85rem;
    }
  }
`;

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    invoiceType: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📄 Fetching invoices with filters:", filters);
      const response = await getMyInvoices(filters);

      console.log("📄 Invoice API Response:", response);

      if (response.success) {
        setInvoices(response.invoices || []);
        console.log(`✅ Loaded ${response.invoices?.length || 0} invoices`);
      } else {
        console.warn("⚠️ Invoice fetch returned success: false");
        setError(response.message || "Failed to fetch invoices");
      }
    } catch (error) {
      console.error("❌ Error fetching invoices:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        setError("Please log in to view your invoices");
      } else if (error.response?.status === 404) {
        setError("Invoice service not available");
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to load invoices. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDownload = (invoiceNumber) => {
    // Open invoice detail page with autoDownload flag; that page
    // uses the existing HTML invoice format + html2canvas/jsPDF
    window.open(`/user/invoice/${invoiceNumber}?autoDownload=1`, "_blank");
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (loading && invoices.length === 0) {
    return (
      <Container>
        <BackButton onClick={() => navigate("/dashboard")}>← Back</BackButton>
        <Header>
          <h1>📄 My Invoices</h1>
          <p>View and manage all your payment invoices</p>
        </Header>
        <InvoiceGrid>
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </InvoiceGrid>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate("/dashboard")}>← Back</BackButton>
      <Header>
        <h1>📄 My Invoices</h1>
        <p>View and manage all your payment invoices</p>
      </Header>

      {error && (
        <ErrorState>
          <div className="icon">⚠️</div>
          <h3>Error Loading Invoices</h3>
          <p>{error}</p>
          <button onClick={() => fetchInvoices()}>Try Again</button>
        </ErrorState>
      )}

      {!error && (
        <>
          <FilterSection>
            <FilterGroup>
              <label>Invoice Type</label>
              <select
                value={filters.invoiceType}
                onChange={(e) =>
                  handleFilterChange("invoiceType", e.target.value)
                }
              >
                <option value="">All Types</option>
                <option value="payment">Payment</option>
                <option value="emi">EMI</option>
                <option value="meet">Meet</option>
                <option value="tutor">Tutor</option>
              </select>
            </FilterGroup>

            {/* <FilterGroup>
              <label>Status</label>
              <select 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="issued">Issued</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </FilterGroup> */}

            {/* <FilterGroup>
              <label>Start Date</label>
              <input 
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </FilterGroup>

            <FilterGroup>
              <label>End Date</label>
              <input 
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </FilterGroup> */}
          </FilterSection>

          {invoices.length === 0 && !loading ? (
            <EmptyState>
              <div className="icon">📭</div>
              <h3>No Invoices Found</h3>
              <p>
                You don't have any invoices yet. Make a purchase to see your
                invoices here.
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  marginTop: "1rem",
                  color: "#718096",
                }}
              >
                💡 Tip: Complete a course payment or meet registration to
                generate your first invoice.
              </p>
            </EmptyState>
          ) : (
            <InvoiceGrid>
              {invoices.map((invoice) => (
                <InvoiceCard
                  key={invoice._id}
                  invoiceType={invoice.invoiceType}
                >
                  <InvoiceHeader>
                    <InvoiceNumber>{invoice.invoiceNumber}</InvoiceNumber>
                    <InvoiceType type={invoice.invoiceType}>
                      {invoice.invoiceType}
                    </InvoiceType>
                  </InvoiceHeader>

                  <InvoiceDetails>
                    <DetailRow>
                      <span className="label">Item</span>
                      <span className="value">{invoice.itemDescription}</span>
                    </DetailRow>
                    <DetailRow>
                      <span className="label">Date</span>
                      <span className="value">
                        {formatDate(invoice.paymentDate)}
                      </span>
                    </DetailRow>
                    <DetailRow>
                      <span className="label">Payment Method</span>
                      <span className="value">
                        {invoice.paymentMethod || "N/A"}
                      </span>
                    </DetailRow>
                    <DetailRow>
                      <span className="label">Course Value</span>
                      <span className="value">
                        {formatAmount(
                          invoice.breakdown?.courseValue ||
                            Math.round(invoice.amount / 1.2),
                          invoice.currency,
                        )}
                      </span>
                    </DetailRow>
                    <DetailRow>
                      <span className="label">GST (18%)</span>
                      <span className="value">
                        {formatAmount(
                          invoice.breakdown?.gstTotal ||
                            Math.round(
                              (invoice.breakdown?.courseValue ||
                                Math.round(invoice.amount / 1.2)) * 0.18,
                            ),
                          invoice.currency,
                        )}
                      </span>
                    </DetailRow>
                    <DetailRow className="amount">
                      <span className="label">Total Amount</span>
                      <span className="value">
                        {formatAmount(invoice.amount, invoice.currency)}
                      </span>
                    </DetailRow>
                  </InvoiceDetails>

                  <InvoiceFooter>
                    <Button
                      className="primary"
                      onClick={() =>
                        (window.location.href = `/user/invoice/${invoice.invoiceNumber}`)
                      }
                    >
                      📋 View Details
                    </Button>
                    <Button
                      className="secondary"
                      onClick={() => handleDownload(invoice.invoiceNumber)}
                    >
                      ⬇️ Download
                    </Button>
                  </InvoiceFooter>
                </InvoiceCard>
              ))}
            </InvoiceGrid>
          )}
        </>
      )}
    </Container>
  );
};

export default InvoiceList;
