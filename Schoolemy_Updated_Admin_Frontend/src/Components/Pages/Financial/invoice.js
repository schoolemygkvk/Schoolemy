// components/Invoice/InvoiceDetail.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { getInvoiceByNumber, downloadInvoice } from "../../../Utils/invoiceApi";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import logo from "../../../assets/Irai aram logo.png";

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

// Styled Components
const Container = styled.div`
  max-width: 900px;
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
  margin-bottom: 2rem;

  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
  }

  @media print {
    display: none;
  }
`;

const InvoiceContainer = styled.div`
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const InvoiceHeader = styled.div`
  background: #f2d4a1; /* light background */
  color: #1a202c;
  padding: 1rem 1.5rem; /* reduced height */
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  border-bottom: 2px solid #e2e8f0;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 0.75rem 1rem;
    gap: 1rem;
  }
`;

const LogoSection = styled.div`
  flex: 0 0 auto;
  padding: 0.25rem;
  border-radius: 8px;

  img {
    width: 220px; /* reduced from 400px */
    height: auto;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    img {
      width: 180px;
    }
  }
`;

const CompanyInfo = styled.div`
  flex: 1;
  text-align: right;
  color: #1a202c;

  h1 {
    font-size: 1.4rem; /* reduced */
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 0.25rem 0;
  }

.gst {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
  display: inline-block;
}

  .address {
    font-size: 0.8rem;
    color: #4a5568;
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }

  .contact {
    font-size: 0.8rem;
    color: #4a5568;

    .phone,
    .email {
      display: inline-block;
      margin-right: 0.75rem;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
  }

  @media (max-width: 768px) {
    text-align: left;

    h1 {
      font-size: 1.2rem;
    }
  }
`;

const InvoiceBody = styled.div`
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const InfoSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e9ecef;
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const InfoBlock = styled.div`
  h3 {
    font-size: 0.9rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  p {
    font-size: 1rem;
    color: #1a202c;
    margin: 0.25rem 0;

    &.highlight {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
    }
  }
`;

const ItemsTable = styled.div`
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
  padding: 0.8rem 1rem;
  background: #f2d4a1; /* 👈 New background color */
  color: #1a202c; /* dark text for contrast */
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2b874;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 1rem;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;

    span {
      display: flex;
      justify-content: space-between;

      &:before {
        content: attr(data-label);
        font-weight: 600;
        color: #718096;
      }
    }
  }
`;

const TotalSection = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  font-size: 1rem;

  &.grand-total {
    border-top: 2px solid #cbd5e0;
    padding-top: 1rem;
    margin-top: 1rem;
    font-size: 1.5rem;
    font-weight: 700;

    .amount {
      color: #10b981;
    }
  }

  .label {
    color: #4a5568;
    font-weight: 600;
  }

  .amount {
    font-weight: 700;
    color: #1a202c;
  }
`;

const MetaSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MetaItem = styled.div`
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #dee2e6;

  .label {
    font-size: 0.65rem;
    color: #92400e;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.15rem;
  }

  .value {
    font-size: 0.8rem;
    color: #1a202c;
    font-weight: 600;
  }
`;
const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0 2rem 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 0 1rem 1rem;
  }

  @media print {
    display: none;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
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
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e2e8f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
const AmountInWords = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;   /* move to right side */
  padding: 0.25rem 1rem;
  margin-top: -0.75rem;    /* move slightly up */
  margin-bottom: 1rem;
  text-align: right;

  .label {
    font-size: 0.65rem;    /* smaller */
    font-weight: 600;
    color: #718096;
    text-transform: uppercase;
    margin-bottom: 0.1rem;
  }

  .words {
    font-size: 0.85rem;    /* smaller */
    font-weight: 600;
    color: #1a202c;
    text-transform: capitalize;
  }
`;

const PrintStyles = styled.div`
  @media print {
    button {
      display: none !important;
    }

    a {
      display: none !important;
    }
  }
`;

const FooterSection = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-top: 2px solid #e9ecef;
  margin-top: 1rem;

  .footer-text {
    font-size: 0.8rem;
    color: #495057;
    line-height: 1.6;
    text-align: center;
    margin: 0;

    strong {
      color: #dc3545;
      font-weight: 600;
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;

    .footer-text {
      font-size: 0.75rem;
    }
  }
`;

const InvoiceDetail = () => {
  const { invoiceNumber } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const invoiceRef = useRef(null);

  const fetchInvoiceDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      if (!invoiceNumber) {
        setError("Invoice number is required");
        setLoading(false);
        return;
      }
      
      const response = await getInvoiceByNumber(invoiceNumber);
      
      // Handle different possible response structures
      const invoice = response.data?.invoice || response.data?.data?.invoice || response.invoice;
      
      if (invoice) {
        setInvoice(invoice);
      } else {
        setError("Invoice not found");
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error.message);
      
      // Handle 404 specifically
      if (error.response?.status === 404) {
        setError(`Invoice "${invoiceNumber}" not found`);
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            "Failed to load invoice details";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceNumber]);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  const handleDownload = async () => {
    try {
      const element = invoiceRef.current;

      // Small delay to ensure images/fonts render
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate scale to fit ONE PAGE
      const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const finalWidth = imgWidth * scale;
      const finalHeight = imgHeight * scale;

      const x = (pdfWidth - finalWidth) / 2; // center horizontally
      const y = (pdfHeight - finalHeight) / 2; // center vertically

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  
  const getGstBreakdown = (invoice) => {
    const amount = parseFloat(invoice?.amount) || 0;

    // Course Value (base before GST & transaction fee)
    const courseValue = amount / 1.2; // 1 + 18% GST + 2% fee = 1.20
    const cgst = courseValue * 0.09;  // 9% CGST
    const sgst = courseValue * 0.09;  // 9% SGST
    const transactionFee = courseValue * 0.02; // 2% Transaction Fee

    return {
      courseValue,
      cgst,
      sgst,
      transactionFee,
      total: amount,
    };
  };

  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    if (num === 0) return "Zero";

    const convertLessThanThousand = (n) => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + convertLessThanThousand(n % 100) : "")
      );
    };

    if (num < 1000) return convertLessThanThousand(num);
    if (num < 100000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      return (
        convertLessThanThousand(thousands) +
        " Thousand" +
        (remainder !== 0 ? " " + convertLessThanThousand(remainder) : "")
      );
    }
    if (num < 10000000) {
      const lakhs = Math.floor(num / 100000);
      const remainder = num % 100000;
      const lakhsWord = convertLessThanThousand(lakhs) + " Lakh";
      if (remainder === 0) return lakhsWord;
      if (remainder < 1000)
        return lakhsWord + " " + convertLessThanThousand(remainder);
      return (
        lakhsWord +
        " " +
        convertLessThanThousand(Math.floor(remainder / 1000)) +
        " Thousand" +
        (remainder % 1000 !== 0
          ? " " + convertLessThanThousand(remainder % 1000)
          : "")
      );
    }
    return "Amount too large";
  };

  const amountInWords = (amount) => {
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    let words = numberToWords(rupees) + " Rupees";
    if (paise > 0) {
      words += " and " + numberToWords(paise) + " Paise";
    }
    return words + " Only";
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <div className="spinner" />
        </LoadingContainer>
      </Container>
    );
  }

  if (error || !invoice) {
    return (
      <Container>
        <BackButton
          onClick={() => navigate(-1)}
          data-html2canvas-ignore="true"
        >
          ← Back to Invoices
        </BackButton>

        <div style={{ textAlign: "center", padding: "3rem" }}>
          <h2>{error || "Invoice not found"}</h2>
        </div>
      </Container>
    );
  }

  return (
    <PrintStyles>
      <Container>
        <BackButton onClick={() => navigate(-1)}>
          ← Back to Invoices
        </BackButton>

        <InvoiceContainer ref={invoiceRef}>
          <InvoiceHeader>
            <LogoSection>
              <img
                src={logo}
                alt="Irai Aram Logo"
                crossOrigin="anonymous"
                onError={(e) => (e.target.style.display = "none")}
              />
            </LogoSection>
            <CompanyInfo>
              <h1>GURUKULA VIDHYA KENDRA</h1>
              <div className="gst">GST NO: 33GKWPS2228Q2Z3</div>
              <div className="address">
                No.07, First Floor, Sivaratninam Complex,
                <br />
                Near Register Office, Vellalore,
                <br />
                COIMBATORE - 641111
              </div>
              <div className="contact">
                <span className="phone">97894 85258</span>
                <span className="email">
                  irainiyathiarakattalai@gmail.com
                </span>
              </div>
            </CompanyInfo>
          </InvoiceHeader>

          <InvoiceBody>
            <InfoSection>
              <InfoBlock>
                <h3>Invoice Details</h3>
                <p className="highlight">{invoice.invoiceNumber}</p>
                <p>Date: {formatDate(invoice.paymentDate)}</p>
              </InfoBlock>

              <InfoBlock>
                <h3>Bill To</h3>
                <p>
                  <strong>{invoice.username}</strong>
                </p>
                <p>{invoice.email}</p>
                {invoice.mobile && <p>{invoice.mobile}</p>}
                {invoice.studentRegisterNumber && (
                  <p>Reg: {invoice.studentRegisterNumber}</p>
                )}
              </InfoBlock>
            </InfoSection>

            <MetaSection>
              <MetaItem>
                <div className="label">Transaction ID</div>
                <div className="value">{invoice.transactionId}</div>
              </MetaItem>
              <MetaItem>
                <div className="label">Payment Method</div>
                <div className="value">{invoice.paymentMethod || "Online"}</div>
              </MetaItem>
              <MetaItem>
                <div className="label">Financial Year</div>
                <div className="value">{invoice.financialYear}</div>
              </MetaItem>
            </MetaSection>

            <ItemsTable>
              <TableHeader>
                <div>Description</div>
                <div>Quantity</div>
                <div>Amount</div>
              </TableHeader>
              <TableRow>
                <span data-label="Description">{invoice.itemDescription}</span>
                <span data-label="Quantity">1</span>
                <span data-label="Amount">
                  {formatAmount(invoice.amount, invoice.currency)}
                </span>
              </TableRow>
            </ItemsTable>

            <TotalSection>
              {(() => {
                const gst = getGstBreakdown(invoice);
                return (
                  <>
                    <TotalRow>
                      <span className="label">Course Value</span>
                      <span className="amount">
                        {formatAmount(gst.courseValue, invoice.currency)}
                      </span>
                    </TotalRow>
                    <TotalRow>
                      <span className="label">CGST (9%)</span>
                      <span className="amount">
                        {formatAmount(gst.cgst, invoice.currency)}
                      </span>
                    </TotalRow>
                    <TotalRow>
                      <span className="label">SGST (9%)</span>
                      <span className="amount">
                        {formatAmount(gst.sgst, invoice.currency)}
                      </span>
                    </TotalRow>
                    <TotalRow>
                      <span className="label">Transaction Fee (2%)</span>
                      <span className="amount">
                        {formatAmount(gst.transactionFee, invoice.currency)}
                      </span>
                    </TotalRow>
                    <TotalRow className="grand-total">
                      <span className="label">Total Amount</span>
                      <span className="amount">
                        {formatAmount(gst.total, invoice.currency)}
                      </span>
                    </TotalRow>
                  </>
                );
              })()}
            </TotalSection>

            <AmountInWords>
              <div className="label">Total Amount in Words:</div>
              <div className="words">{amountInWords(invoice.amount)}</div>
            </AmountInWords>

            <FooterSection>
              <p className="footer-text">
                <strong>
                  All Disputes are subject to Coimbatore jurisdiction.
                </strong>{" "}
                Interest at 18% will be charged if the payment is not made
                within 15 days from the date of Invoice.
              </p>
            </FooterSection>
          </InvoiceBody>

          <ActionButtons data-html2canvas-ignore="true">
            <Button className="primary" onClick={handlePrint}>
              Print Invoice
            </Button>
            <Button className="secondary" onClick={handleDownload}>
              Download PDF
            </Button>
          </ActionButtons>
        </InvoiceContainer>
      </Container>
    </PrintStyles>
  );
};

export default InvoiceDetail;
