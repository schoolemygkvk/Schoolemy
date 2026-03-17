import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./FinancialStyles.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { secureStorage } from "../../../Utils/security";
import logo from "../../../assets/Irai aram logo.png";
import {
  listDonations,
  getDonationStatistics,
  deleteDonation,
  verifyDonation,
} from "../../../Utils/donationApi";
import {
  listExpenses,
  getExpenseStatistics,
  deleteExpense,
  approveExpense,
  markExpenseAsPaid,
  rejectExpense,
} from "../../../Utils/expenseApi";
import {
  listInvoices,
  getInvoiceStatistics,
  getInvoiceByNumber,
} from "../../../Utils/invoiceApi";
import invoiceLogo from "../../../assets/Irai aram logo.png";

const FinancialAuditingScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [donationStats, setDonationStats] = useState(null);
  const [expenseStats, setExpenseStats] = useState(null);
  const [invoiceStats, setInvoiceStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get user role for access control
  const currentUserRole = (secureStorage.getItem("role") || "").toLowerCase().trim();
  const canEditDelete = currentUserRole === "admin" || currentUserRole === "superadmin";

  // Filters
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    category: "",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");

  // Pagination
  const [donationPage, setDonationPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const [donationPagination, setDonationPagination] = useState(null);
  const [expensePagination, setExpensePagination] = useState(null);
  const [invoicePagination, setInvoicePagination] = useState(null);
  const [invoiceTypeTab, setInvoiceTypeTab] = useState("all"); // all | course | tutor | meet
  const [invoiceIdFilter, setInvoiceIdFilter] = useState("");

  const fetchStatistics = useCallback(async () => {
    try {
      const [donationRes, expenseRes, invoiceRes] = await Promise.all([
        getDonationStatistics({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
        getExpenseStatistics({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
        getInvoiceStatistics({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      ]);
      setDonationStats(donationRes.data.data);
      setExpenseStats(expenseRes.data.data);
      setInvoiceStats(invoiceRes.data.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, [filters.startDate, filters.endDate]);

  const fetchDonations = useCallback(async () => {
    try {
      const response = await listDonations({
        page: donationPage,
        limit: 10,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
        category: filters.category || undefined,
      });
      setDonations(response.data.data || []);
      setDonationPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  }, [donationPage, filters.search, filters.startDate, filters.endDate, filters.status, filters.category]);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await listExpenses({
        page: expensePage,
        limit: 10,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
        category: filters.category || undefined,
      });
      setExpenses(response.data.data || []);
      setExpensePagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  }, [expensePage, filters.search, filters.startDate, filters.endDate, filters.status, filters.category]);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await listInvoices({
        page: invoicePage,
        limit: 10,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setInvoices(response.data.data || []);
      setInvoicePagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  }, [invoicePage, filters.search, filters.startDate, filters.endDate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        await Promise.all([fetchStatistics(), fetchDonations(), fetchExpenses(), fetchInvoices()]);
      } else if (activeTab === "donations") {
        await fetchDonations();
      } else if (activeTab === "expenses") {
        await fetchExpenses();
      } else if (activeTab === "invoices") {
        await fetchInvoices();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchStatistics, fetchDonations, fetchExpenses, fetchInvoices]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page numbers when filters change
  useEffect(() => {
    setDonationPage(1);
    setExpensePage(1);
    setInvoicePage(1);
  }, [filters.search, filters.startDate, filters.endDate, filters.status, filters.category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteDonation = async (id) => {
    if (window.confirm("Are you sure you want to delete this donation?")) {
      try {
        await deleteDonation(id);
        fetchDonations();
      } catch (error) {
        alert("Failed to delete donation");
      }
    }
  };

  const handleVerifyDonation = async (id) => {
    try {
      await verifyDonation(id);
      fetchDonations();
      fetchStatistics();
    } catch (error) {
      alert("Failed to verify donation");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(id);
        fetchExpenses();
      } catch (error) {
        alert("Failed to delete expense");
      }
    }
  };

  const handleApproveExpense = async (id) => {
    try {
      await approveExpense(id);
      fetchExpenses();
      fetchStatistics();
    } catch (error) {
      alert("Failed to approve expense");
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await markExpenseAsPaid(id);
      fetchExpenses();
      fetchStatistics();
    } catch (error) {
      alert("Failed to mark as paid");
    }
  };

  const handleRejectExpense = async (id) => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      try {
        await rejectExpense(id, reason);
        fetchExpenses();
        fetchStatistics();
      } catch (error) {
        alert("Failed to reject expense");
      }
    }
  };

  const downloadInvoicePDF = async (invoiceNumber) => {
    try {
      // Fetch invoice data
      const response = await getInvoiceByNumber(invoiceNumber);
      const invoice = response.data.invoice;

      // Create a temporary container for the invoice
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '40px';
      document.body.appendChild(tempContainer);

      // Build invoice HTML
      tempContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #1a202c;">
          <div style="background: #f2d4a1; padding: 20px; border-radius: 8px 8px 0 0; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
            <div style="flex: 0 0 auto;">
              <img src="${invoiceLogo}" alt="Irai Aram Logo" style="width: 140px; height: auto; object-fit: contain;" crossorigin="anonymous" />
            </div>
            <div style="flex: 1; text-align: right;">
              <h1 style="margin: 0; font-size: 24px;">GURUKULA VIDHYA KENDRA</h1>
              <p style="margin: 5px 0; font-size: 12px;">GST NO: 33GKWPS2228Q2Z3</p>
              <p style="margin: 5px 0; font-size: 11px;">No.07, First Floor, Sivaratninam Complex, Near Register Office, Vellalore, COIMBATORE - 641111</p>
              <p style="margin: 5px 0; font-size: 11px;">📞 97894 85258 | ✉️ irainiyathiarakattalai@gmail.com</p>
            </div>
          </div>
          
          <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
              <div>
                <h3 style="margin: 0 0 10px 0; color: #718096; font-size: 11px;">INVOICE DETAILS</h3>
                <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #667eea;">${invoice.invoiceNumber}</p>
                <p style="margin: 5px 0; font-size: 12px;">Date: ${formatSimpleDate(invoice.paymentDate)}</p>
              </div>
              <div style="text-align: right;">
                <h3 style="margin: 0 0 10px 0; color: #718096; font-size: 11px;">BILL TO</h3>
                <p style="margin: 5px 0; font-size: 13px; font-weight: bold;">${invoice.username}</p>
                <p style="margin: 5px 0; font-size: 12px;">${invoice.email}</p>
                ${invoice.mobile ? `<p style="margin: 5px 0; font-size: 12px;">📞 ${invoice.mobile}</p>` : ''}
                ${invoice.studentRegisterNumber ? `<p style="margin: 5px 0; font-size: 12px;">Reg: ${invoice.studentRegisterNumber}</p>` : ''}
              </div>
            </div>

            <div style="margin-bottom: 20px; padding: 10px; background: #fff3cd; border-radius: 8px; display: flex; justify-content: space-between;">
              <div><strong style="font-size: 10px; color: #92400e;">Transaction ID:</strong><br/><span style="font-size: 11px;">${invoice.transactionId}</span></div>
              <div><strong style="font-size: 10px; color: #92400e;">Payment Method:</strong><br/><span style="font-size: 11px;">${invoice.paymentMethod}</span></div>
              <div><strong style="font-size: 10px; color: #92400e;">Financial Year:</strong><br/><span style="font-size: 11px;">${invoice.financialYear}</span></div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #dee2e6;">
              <thead>
                <tr style="background: #f2d4a1;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2b874; font-size: 11px;">DESCRIPTION</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2b874; font-size: 11px;">QTY</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2b874; font-size: 11px;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${invoice.itemDescription}</td>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">1</td>
                  <td style="padding: 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 12px;">₹${invoice.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-size: 12px; font-weight: 600;">Subtotal:</span>
                <span style="font-size: 12px; font-weight: 700;">₹${(invoice.amount - (invoice.taxAmount || 0)).toFixed(2)}</span>
              </div>
              ${invoice.taxAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="font-size: 12px; font-weight: 600;">CGST (9%):</span>
                  <span style="font-size: 12px; font-weight: 700;">₹${(invoice.taxAmount / 2).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="font-size: 12px; font-weight: 600;">SGST (9%):</span>
                  <span style="font-size: 12px; font-weight: 700;">₹${(invoice.taxAmount / 2).toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #cbd5e0;">
                <span style="font-size: 16px; font-weight: 700;">Total Amount:</span>
                <span style="font-size: 16px; font-weight: 700; color: #10b981;">₹${invoice.amount.toFixed(2)}</span>
              </div>
            </div>

            <div style="text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 11px; color: #495057; line-height: 1.6;">
              <strong style="color: #dc3545;">All Disputes are subject to Coimbatore jurisdiction.</strong> Interest at 18% will be charged if the payment is not made within 15 days from the date of Invoice.
            </div>
          </div>
        </div>
      `;

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 300));

      // Convert to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Remove temp container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * scale;
      const finalHeight = imgHeight * scale;
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download invoice');
    }
  };

  const formatSimpleDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const downloadDonationBill = async (donation) => {
    try {
      // Create a temporary div with donation voucher for PDF generation
      const billContent = document.createElement('div');
      billContent.id = 'donation-bill-temp';
      billContent.style.cssText = `
        width: 750px;
        max-width: 750px;
        background: white;
        margin: 0 auto;
        position: absolute;
        left: -9999px;
        top: 0;
      `;

      // Create image element for logo
      const logoImg = document.createElement('img');
      logoImg.src = logo;
      logoImg.style.cssText = 'width: 140px; height: 140px; object-fit: contain; background-color: transparent; border: 2px solid #343A61; border-radius: 8px; padding: 5px;';

      billContent.innerHTML = `
        <div style="width: 750px; max-width: 750px; background: #fff; border: 2px solid #343A61; font-family: Arial, sans-serif; margin: 0 auto; box-sizing: border-box;">
          <!-- Header Section -->
          <div style="display: flex; align-items: center; border-bottom: 2px solid #343A61; padding: 15px; gap: 15px;">
            <div id="logo-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 150px; max-width: 150px;">
            </div>
            
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; padding-left: 10px;">
              <div style="font-size: 10px; color: #666;">பதிவு எண் : R/Signallur/Book-4/246/2021</div>
              <div style="font-size: 10px; color: #666;">DOCUMENT UNIQUE ID : TN/2023/0362924</div>
              <div style="font-size: 20px; font-weight: bold; color: #343A61; margin-top: 5px;">இறை நியதி அறக்கட்டளை</div>
              <div style="font-size: 24px; font-weight: bold; color: #343A61; letter-spacing: 1px;">IRAI NIYATHI ARAKATTALAI</div>
              <div style="font-size: 11px; color: #343A61;">No.07, First Floor, Sivarathiinam Complex, Near Register Office,</div>
              <div style="font-size: 11px; color: #343A61;">Vellalore, COIMBATORE - 641111.</div>
              <div style="font-size: 11px; color: #343A61; margin-top: 3px;">📞 97894 85258     ✉ irainiyathiarakattalai@gmail.com</div>
            </div>
            
            <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center; min-width: 120px; gap: 6px;">
              <div style="background: #343A61; color: #fff; padding: 5px 12px; font-size: 13px; font-weight: bold; text-align: center; width: 100%;">VOUCHER</div>
              <div style="background: #e2e8f0; padding: 5px 8px; font-size: 11px; font-weight: bold; width: 100%; text-align: center;">No. : ${donation.receiptNumber}</div>
              <div style="background: #e2e8f0; padding: 5px 8px; font-size: 11px; font-weight: bold; width: 100%; text-align: center;">Date : ${formatSimpleDate(donation.date)}</div>
            </div>
          </div>

          <!-- Body Section -->
          <div style="padding: 25px 30px;">
            <div style="margin-bottom: 18px;">
              <span style="font-size: 14px; font-style: italic; color: #4a5568; font-weight: 600; display: block; margin-bottom: 8px;">Receiver</span>
              <div style="font-size: 16px; color: #000; border-bottom: 1px dotted #343A61; padding-bottom: 10px; min-height: 26px; font-weight: 500; display: block;">
                ${donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}
              </div>
            </div>
            
            <div style="margin-bottom: 18px;">
              <span style="font-size: 14px; font-style: italic; color: #4a5568; font-weight: 600; display: block; margin-bottom: 8px;">Amount</span>
              <div style="font-size: 16px; color: #000; border-bottom: 1px dotted #343A61; padding-bottom: 10px; min-height: 26px; font-weight: 500; display: block;">
                ${formatCurrency(donation.amount)}
              </div>
            </div>
            
            <div style="margin-bottom: 18px;">
              <span style="font-size: 14px; font-style: italic; color: #4a5568; font-weight: 600; display: block; margin-bottom: 8px;">Details</span>
              <div style="font-size: 16px; color: #000; border-bottom: 1px dotted #343A61; padding-bottom: 10px; min-height: 26px; font-weight: 500; display: block;">
                ${donation.description || `Donation - ${donation.category} (${donation.donationType})${donation.purpose ? ` - ${donation.purpose}` : ''}`}
              </div>
            </div>

            ${donation.transactionId ? `
            <div style="margin-bottom: 18px;">
              <span style="font-size: 14px; font-style: italic; color: #4a5568; font-weight: 600; display: block; margin-bottom: 8px;">Transaction ID</span>
              <div style="font-size: 16px; color: #000; border-bottom: 1px dotted #343A61; padding-bottom: 10px; min-height: 26px; font-weight: 500; display: block;">
                ${donation.transactionId}
              </div>
            </div>
            ` : ''}

            <div style="border-top: 1px dotted #343A61; margin: 20px 0;"></div>
            
            <div style="margin-bottom: 18px;">
              <span style="font-size: 14px; font-style: italic; color: #4a5568; font-weight: 600; display: block; margin-bottom: 8px;">Cheque / DD / Cash / UPI ID</span>
              <div style="font-size: 16px; color: #000; border-bottom: 1px dotted #343A61; padding-bottom: 10px; min-height: 26px; font-weight: 500; display: block;">
                ${donation.paymentMethod || 'Cash'}
              </div>
            </div>

            <!-- Footer Section -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; gap: 20px;">
              <div style="flex: 1;">
                <div style="background: #343A61; color: #fff; padding: 15px 20px; font-size: 20px; font-weight: bold; display: inline-block; margin-bottom: 10px;">
                  Rs. ${donation.amount}
                </div>
                <div style="font-size: 10px; color: #666; font-style: italic;">*Cheque Subject to realisation</div>
              </div>
              <div style="text-align: center; min-width: 150px;">
                <div style="font-size: 12px; font-weight: 600; color: #343A61;">Passed by</div>
              </div>
              <div style="text-align: center; min-width: 150px;">
                <div style="width: 120px; height: 60px; border: 2px solid #343A61; margin-bottom: 5px;"></div>
                <div style="font-size: 12px; font-weight: 600; color: #343A61;">Receiver's Signature</div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(billContent);
      
      // Insert logo
      const logoContainer = billContent.querySelector('#logo-container');
      if (logoContainer) {
        logoContainer.appendChild(logoImg.cloneNode(true));
      }

      // Wait for rendering and image load
      await new Promise(resolve => setTimeout(resolve, 400));

      const canvas = await html2canvas(billContent, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: billContent.scrollWidth,
        height: billContent.scrollHeight,
        windowWidth: billContent.scrollWidth,
        windowHeight: billContent.scrollHeight
      });

      document.body.removeChild(billContent);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate proper dimensions to fit the voucher
      const margin = 10;
      const availableWidth = pdfWidth - (2 * margin);
      const availableHeight = pdfHeight - (2 * margin);
      
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center vertically if there's extra space
      const yPosition = imgHeight < availableHeight ? (pdfHeight - imgHeight) / 2 : margin;

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      pdf.save(`Donation_Voucher_${donation.receiptNumber || donation._id}.pdf`);
    } catch (error) {
      console.error('Error generating donation PDF:', error);
      alert('Failed to download donation voucher. Please try again.');
    }
  };

  const downloadExpenseBill = async (expense) => {
    try {
      // Create a temporary div for invoice PDF generation
      const invoiceContent = document.createElement('div');
      invoiceContent.id = 'expense-invoice-temp';
      invoiceContent.style.cssText = `
        width: 800px;
        max-width: 800px;
        background: white;
        margin: 0 auto;
        position: absolute;
        left: -9999px;
        top: 0;
        padding: 20px;
        font-family: Arial, sans-serif;
      `;

      // Create image element for logo with proper attributes
      const logoImg = document.createElement('img');
      logoImg.src = logo;
      logoImg.crossOrigin = 'anonymous';
      logoImg.style.cssText = 'width: 220px; height: 180px; object-fit: contain; display: block;';
      logoImg.alt = 'Irai Aram Logo';

      // Calculate amounts
      const subTotal = expense.amount || 0;
      const cgstRate = expense.cgstRate || 9;
      const sgstRate = expense.sgstRate || 9;
      const igstRate = expense.igstRate || 0;
      
      const cgstAmount = (subTotal * cgstRate) / 100;
      const sgstAmount = (subTotal * sgstRate) / 100;
      const igstAmount = (subTotal * igstRate) / 100;
      const shippingCharges = expense.shippingCharges || 0;
      const adjustment = expense.adjustment || 0;
      const grandTotal = subTotal + cgstAmount + sgstAmount + igstAmount + shippingCharges + adjustment;

      // Convert number to words
      const numberToWords = (num) => {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

        if (num === 0) return 'zero';
        
        const convert = (n) => {
          if (n < 10) return ones[n];
          if (n < 20) return teens[n - 10];
          if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
          if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
          if (n < 100000) return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
          if (n < 10000000) return convert(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
          return convert(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
        };
        
        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);
        
        let words = convert(rupees).trim();
        words = words.charAt(0).toUpperCase() + words.slice(1);
        
        if (paise > 0) {
          words += ' and ' + convert(paise) + ' paise';
        }
        words += ' only';
        
        return words;
      };

      invoiceContent.innerHTML = `
        <div style="background: white; padding: 30px; font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <!-- Header Section -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
            <div id="logo-container" style="flex: 0 0 auto; padding: 10px; background: white; border-radius: 8px;">
            </div>
            
            <div style="flex: 1; text-align: right; color: #1a202c;">
              <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #1a202c;">IRAI NIYATHI ARAKATTALAI</div>
              <div style="font-size: 11px; line-height: 1.6; color: #4a5568;">
                No.07, First Floor, Sivarathiinam Complex,<br/>
                Near Register Office, Vellalore,<br/>
                COIMBATORE - 641111<br/>
                Phone No: 97894 85258<br/>
                GSTIN: ${expense.gstin || '33AAICB5046L1ZL'}
              </div>
            </div>
          </div>

          <!-- Invoice Title -->
          <div style="text-align: center; padding: 20px 0; margin-bottom: 25px;">
            <div style="font-size: 22px; font-weight: bold; color: #1a202c; text-transform: uppercase;">Expense Bill</div>
            <div style="font-size: 14px; color: #718096; margin-top: 5px;">Invoice No: ${expense.invoiceNumber || 'N/A'}</div>
          </div>

          <!-- Invoice Details Section -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e9ecef;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 15px;">
              <div>
                <table style="width: 100%; font-size: 12px; color: #333;">
                  <tr>
                    <td style="padding: 6px 0; width: 40%; font-weight: 600; color: #4a5568;">Invoice Date:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${formatSimpleDate(expense.date)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #4a5568;">Payment Mode:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.paymentMethod || 'Cash'}</td>
                  </tr>
                  ${expense.transactionId ? `
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #4a5568;">Transaction ID:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.transactionId}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <div>
                <table style="width: 100%; font-size: 12px; color: #333;">
                  <tr>
                    <td style="padding: 6px 0; width: 40%; font-weight: 600; color: #4a5568;">Category:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.category || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #4a5568;">Sub Category:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.subCategory || 'N/A'}</td>
                  </tr>
                  ${expense.department ? `
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #4a5568;">Department:</td>
                    <td style="padding: 6px 0; color: #1a202c;">${expense.department}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </div>
            
            ${expense.vendorName ? `
            <div style="padding-top: 15px; border-top: 1px solid #dee2e6;">
              <div style="font-size: 12px; font-weight: 600; color: #4a5568; margin-bottom: 8px;">Vendor Details:</div>
              <div style="font-size: 12px; color: #1a202c; line-height: 1.6;">
                ${expense.vendorName}<br/>
                ${expense.vendorContact ? `Contact: ${expense.vendorContact}` : ''}
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 25px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f2d4a1; color: #1a202c;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6;">Description</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #dee2e6;">Unit Price</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #dee2e6;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px; color: #1a202c; border-bottom: 1px solid #e9ecef;">${expense.title || expense.description || 'N/A'}</td>
                  <td style="padding: 12px; text-align: center; color: #1a202c; border-bottom: 1px solid #e9ecef;">${expense.quantity || 1}</td>
                  <td style="padding: 12px; text-align: right; color: #1a202c; border-bottom: 1px solid #e9ecef;">₹ ${(subTotal / (expense.quantity || 1)).toFixed(2)}</td>
                  <td style="padding: 12px; text-align: right; font-weight: 600; color: #1a202c; border-bottom: 1px solid #e9ecef;">₹ ${subTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totals Section -->
          <div style="display: flex; gap: 20px; margin-bottom: 25px;">
            <!-- Bank Details -->
            ${expense.accountNumber ? `
            <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <div style="font-size: 13px; font-weight: 600; color: #1a202c; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #f2d4a1;">Bank Details</div>
              <div style="font-size: 12px; color: #1a202c; line-height: 1.8;">
                <strong>IRAI NIYATHI ARAKATTALAI</strong><br/>
                <strong>Account Number:</strong> ${expense.accountNumber}<br/>
                ${expense.ifscCode ? `<strong>IFSC:</strong> ${expense.ifscCode}<br/>` : ''}
                ${expense.branchName ? `<strong>Branch:</strong> ${expense.branchName}<br/>` : ''}
                ${expense.accountType ? `<strong>Account Type:</strong> ${expense.accountType}` : ''}
              </div>
            </div>
            ` : ''}

            <!-- Summary Box -->
            <div style="width: 300px; background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <table style="width: 100%; font-size: 12px;">
                <tr>
                  <td style="padding: 12px 0; font-weight: bold; font-size: 16px; color: #1a202c;">Total Amount:</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #1a202c;">₹ ${grandTotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Total in Words -->
          <div style="background: #f8f9fa; padding: 15px 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
            <div style="font-size: 12px; color: #4a5568; margin-bottom: 5px; font-weight: 600;">Total amount in words:</div>
            <div style="font-size: 13px; color: #1a202c; font-weight: 600;">${numberToWords(grandTotal)}</div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 11px; color: #718096;">
            This is a computer-generated expense bill. No signature required.
          </div>

        </div>
      `;

      document.body.appendChild(invoiceContent);
      
      // Insert logo
      const logoContainer = invoiceContent.querySelector('#logo-container');
      if (logoContainer) {
        logoContainer.appendChild(logoImg);
      }

      // Wait for logo to load before generating PDF
      await new Promise((resolve) => {
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
          resolve();
        } else {
          logoImg.onload = () => {
            setTimeout(resolve, 100); // Small delay to ensure rendering
          };
          logoImg.onerror = () => {
            console.warn('Logo failed to load, continuing without it');
            resolve(); // Continue even if logo fails to load
          };
          // Timeout after 3 seconds
          setTimeout(() => {
            resolve();
          }, 3000);
        }
      });

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(invoiceContent, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: invoiceContent.scrollWidth,
        height: invoiceContent.scrollHeight,
        windowWidth: invoiceContent.scrollWidth,
        windowHeight: invoiceContent.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure logo is visible in cloned document
          const clonedLogo = clonedDoc.querySelector('#logo-container img');
          if (clonedLogo) {
            clonedLogo.style.display = 'block';
            clonedLogo.style.visibility = 'visible';
          }
        }
      });

      document.body.removeChild(invoiceContent);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 5;
      const availableWidth = pdfWidth - (2 * margin);
      const availableHeight = pdfHeight - (2 * margin);
      
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= availableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= availableHeight;
      }

      pdf.save(`Expense_Invoice_${expense.invoiceNumber || expense._id}.pdf`);
    } catch (error) {
      console.error('Error generating expense PDF:', error);
      alert('Failed to download expense bill. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      Completed: "#10b981",
      Verified: "#3b82f6",
      Pending: "#f59e0b",
      Cancelled: "#ef4444",
      Approved: "#8b5cf6",
      Paid: "#10b981",
      Rejected: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Financial Auditing & Management</h1>
        <div style={styles.buttonGroup}>
          {/* <button
            style={styles.createButton}
            onClick={() => navigate("/schoolemy/donation/new")}
          >
            + Add Donation
          </button>
          <button
            style={styles.createButton}
            onClick={() => navigate("/schoolemy/expense/new")}
          >
            + Add Expense
          </button> */}
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterSection}>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          style={styles.filterInput}
          placeholder="Start Date"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          style={styles.filterInput}
          placeholder="End Date"
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={styles.filterInput}
          placeholder="Search..."
        />

        <div style={styles.filterActions}>
          <button
            style={styles.resetButton}
            onClick={() => {
              setFilters({
                startDate: "",
                endDate: "",
                status: "",
                category: "",
                search: "",
              });
              setSearchInput("");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        {[
          { key: "overview", label: "Overview" },
          { key: "donations", label: "Donations" },
          { key: "expenses", label: "Expenses" },
          { key: "invoices", label: "Invoices" },
          // { key: "payment-record", label: "Payment Record", route: "/schoolemy/payment-records-AUD" },
        ].map((tab) => (
          <button
            key={tab.key}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.activeTab : {}),
            }}
            onClick={() => {
              if (tab.route) {
                navigate(tab.route);
              } else {
                setActiveTab(tab.key);
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div style={styles.loading}>Loading...</div>}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div style={styles.overviewContainer}>
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
              <h3 style={styles.statLabel}>Total Donations</h3>
              <p style={styles.statValue}>
                {formatCurrency(donationStats?.overall?.totalAmount)}
              </p>
              <p style={styles.statSubtext}>
                {donationStats?.overall?.totalDonations || 0} transactions
              </p>
            </div>

            <div style={{ ...styles.statCard, borderLeft: "4px solid #ef4444" }}>
              <h3 style={styles.statLabel}>Total Expenses</h3>
              <p style={styles.statValue}>
                {formatCurrency(expenseStats?.overall?.totalAmount)}
              </p>
              <p style={styles.statSubtext}>
                {expenseStats?.overall?.totalExpenses || 0} transactions
              </p>
            </div>

            {/* <div
              style={{
                ...styles.statCard,
                borderLeft: `4px solid ${
                  calculateBalance() >= 0 ? "#10b981" : "#ef4444"
                }`,
              }}
            >
              <h3 style={styles.statLabel}>Net Balance <span style={styles.currencyNote}>(INR)</span></h3>
              <p
                style={{
                  ...styles.statValue,
                  color: calculateBalance() >= 0 ? "#10b981" : "#ef4444",
                }}
              >
                {formatCurrency(calculateBalance())}
              </p>
              <p style={styles.statSubtext}>
                {calculateBalance() >= 0 ? "Surplus" : "Deficit"} ({formatCurrency(Math.abs(calculateBalance()))})
              </p>
            </div> */}

            <div style={{ ...styles.statCard, borderLeft: "4px solid #667eea" }}>
              <h3 style={styles.statLabel}>Total Invoices</h3>
              <p style={styles.statValue}>
                {formatCurrency(invoiceStats?.overall?.totalAmount)}
              </p>
              <p style={styles.statSubtext}>
                {invoiceStats?.overall?.totalInvoices || 0} invoices
              </p>
            </div>

            <div style={{ ...styles.statCard, borderLeft: "4px solid #3b82f6" }}>
              <h3 style={styles.statLabel}>Average Donation</h3>
              <p style={styles.statValue}>
                {formatCurrency(donationStats?.overall?.avgDonation)}
              </p>
              <p style={styles.statSubtext}>Per transaction</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div style={styles.chartsGrid}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Donations by Category</h3>
              <div style={styles.categoryList}>
                {donationStats?.byCategory?.map((cat, idx) => (
                  <div key={idx} style={styles.categoryItem}>
                    <span style={styles.categoryName}>{cat._id}</span>
                    <span style={styles.categoryAmount}>
                      {formatCurrency(cat.totalAmount)}
                    </span>
                    <span style={styles.categoryCount}>({cat.count})</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Expenses by Category</h3>
              <div style={styles.categoryList}>
                {expenseStats?.byCategory?.map((cat, idx) => (
                  <div key={idx} style={styles.categoryItem}>
                    <span style={styles.categoryName}>{cat._id}</span>
                    <span style={styles.categoryAmount}>
                      {formatCurrency(cat.totalAmount)}
                    </span>
                    <span style={styles.categoryCount}>({cat.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div style={styles.recentSection}>
            <h3 style={styles.sectionTitle}>Recent Donations</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Receipt No</th>
                    <th style={styles.th}>Donor</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.slice(0, 5).map((donation) => (
                    <tr key={donation._id} style={styles.tr}>
                      <td style={styles.td}>{donation.receiptNumber}</td>
                      <td style={styles.td}>
                        {donation.isAnonymous ? "Anonymous" : donation.donorName}
                      </td>
                      <td style={styles.td}>{formatCurrency(donation.amount)}</td>
                      <td style={styles.td}>{donation.category}</td>
                      <td style={styles.td}>{formatDate(donation.date)}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusColor(donation.status),
                          }}
                        >
                          {donation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.recentSection}>
            <h3 style={styles.sectionTitle}>Recent Expenses</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Invoice No</th>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 5).map((expense) => (
                    <tr key={expense._id} style={styles.tr}>
                      <td style={styles.td}>{expense.invoiceNumber}</td>
                      <td style={styles.td}>{expense.title}</td>
                      <td style={styles.td}>{formatCurrency(expense.amount)}</td>
                      <td style={styles.td}>{expense.category}</td>
                      <td style={styles.td}>{formatDate(expense.date)}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusColor(expense.status),
                          }}
                        >
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Donations Tab */}
      {activeTab === "donations" && (
        <div style={styles.contentContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Receipt No</th>
                  <th style={styles.th}>Donor Name</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation._id} style={styles.tr}>
                    <td style={styles.td}>{donation.receiptNumber}</td>
                    <td style={styles.td}>
                      {donation.isAnonymous ? "Anonymous" : donation.donorName}
                    </td>
                    <td style={styles.td}>{formatCurrency(donation.amount)}</td>
                    <td style={styles.td}>{donation.donationType}</td>
                    <td style={styles.td}>{donation.category}</td>
                    <td style={styles.td}>{formatDate(donation.date)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(donation.status),
                        }}
                      >
                        {donation.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => navigate(`/schoolemy/donation/${donation._id}`)}
                        >
                          View
                        </button>
                        <button
                          style={{ ...styles.actionBtn, backgroundColor: "#17a2b8" }}
                          onClick={() => downloadDonationBill(donation)}
                        >
                          📄 Download
                        </button>
                        {donation.status !== "Verified" && (
                          <button
                            style={{ ...styles.actionBtn, backgroundColor: "#10b981" }}
                            onClick={() => handleVerifyDonation(donation._id)}
                          >
                            Verify
                          </button>
                        )}
                        {canEditDelete && (
                          <>
                            <button
                              style={styles.editBtn}
                              onClick={() => navigate(`/schoolemy/donation/edit/${donation._id}`)}
                            >
                              Edit
                            </button>
                            <button
                              style={styles.deleteBtn}
                              onClick={() => handleDeleteDonation(donation._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {donationPagination && (
            <div style={styles.pagination}>
              <button
                style={styles.pageBtn}
                disabled={donationPage === 1}
                onClick={() => setDonationPage(donationPage - 1)}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {donationPage} of {donationPagination.pages}
              </span>
              <button
                style={styles.pageBtn}
                disabled={donationPage === donationPagination.pages}
                onClick={() => setDonationPage(donationPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <div style={styles.contentContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Invoice No</th>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Vendor</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id} style={styles.tr}>
                    <td style={styles.td}>{expense.invoiceNumber}</td>
                    <td style={styles.td}>{expense.title}</td>
                    <td style={styles.td}>{formatCurrency(expense.amount)}</td>
                    <td style={styles.td}>{expense.category}</td>
                    <td style={styles.td}>{expense.vendorName || "N/A"}</td>
                    <td style={styles.td}>{formatDate(expense.date)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(expense.status),
                        }}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => navigate(`/schoolemy/expense/${expense._id}`)}
                        >
                          View
                        </button>
                        <button
                          style={{ ...styles.actionBtn, backgroundColor: "#17a2b8" }}
                          onClick={() => downloadExpenseBill(expense)}
                        >
                          📄 Download
                        </button>
                        {expense.status === "Pending" && (
                          <>
                            <button
                              style={{
                                ...styles.actionBtn,
                                backgroundColor: "#10b981",
                              }}
                              onClick={() => handleApproveExpense(expense._id)}
                            >
                              Approve
                            </button>
                            <button
                              style={{
                                ...styles.actionBtn,
                                backgroundColor: "#ef4444",
                              }}
                              onClick={() => handleRejectExpense(expense._id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {expense.status === "Approved" && (
                          <button
                            style={{
                              ...styles.actionBtn,
                              backgroundColor: "#3b82f6",
                            }}
                            onClick={() => handleMarkAsPaid(expense._id)}
                          >
                            Mark Paid
                          </button>
                        )}
                        {canEditDelete && (
                          <>
                            <button
                              style={styles.editBtn}
                              onClick={() => navigate(`/schoolemy/expense/edit/${expense._id}`)}
                            >
                              Edit
                            </button>
                            <button
                              style={styles.deleteBtn}
                              onClick={() => handleDeleteExpense(expense._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {expensePagination && (
            <div style={styles.pagination}>
              <button
                style={styles.pageBtn}
                disabled={expensePage === 1}
                onClick={() => setExpensePage(expensePage - 1)}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {expensePage} of {expensePagination.pages}
              </span>
              <button
                style={styles.pageBtn}
                disabled={expensePage === expensePagination.pages}
                onClick={() => setExpensePage(expensePage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div style={styles.contentContainer}>
          {/* Invoice type & ID filters */}
          <div style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                style={{
                  ...styles.pageBtn,
                  padding: "6px 12px",
                  background: invoiceTypeTab === "all" ? "#0ea5e9" : "#fff",
                  color: invoiceTypeTab === "all" ? "#fff" : "#4b5563",
                }}
                onClick={() => setInvoiceTypeTab("all")}
              >
                All
              </button>
              <button
                style={{
                  ...styles.pageBtn,
                  padding: "6px 12px",
                  background: invoiceTypeTab === "course" ? "#0ea5e9" : "#fff",
                  color: invoiceTypeTab === "course" ? "#fff" : "#4b5563",
                }}
                onClick={() => setInvoiceTypeTab("course")}
              >
                Course
              </button>
              <button
                style={{
                  ...styles.pageBtn,
                  padding: "6px 12px",
                  background: invoiceTypeTab === "tutor" ? "#0ea5e9" : "#fff",
                  color: invoiceTypeTab === "tutor" ? "#fff" : "#4b5563",
                }}
                onClick={() => setInvoiceTypeTab("tutor")}
              >
                Tutor
              </button>
              <button
                style={{
                  ...styles.pageBtn,
                  padding: "6px 12px",
                  background: invoiceTypeTab === "meet" ? "#0ea5e9" : "#fff",
                  color: invoiceTypeTab === "meet" ? "#fff" : "#4b5563",
                }}
                onClick={() => setInvoiceTypeTab("meet")}
              >
                Meet
              </button>
            </div>
            <div style={{ marginLeft: "auto", minWidth: "220px" }}>
              <input
                type="text"
                value={invoiceIdFilter}
                onChange={(e) => setInvoiceIdFilter(e.target.value)}
                placeholder="Filter by Invoice ID..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Invoice #</th>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Payment Method</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter((invoice) => {
                    // Type-based tab filter
                    if (invoiceTypeTab !== "all") {
                      if (invoiceTypeTab === "course") {
                        // For course tab: show if invoiceType is 'course' OR invoiceNumber starts with INV-GKVK-2025-2026-
                        const isCourseType = invoice.invoiceType?.toLowerCase() === "course";
                        const isCoursePrefix = invoice.invoiceNumber?.startsWith("INV-GKVK-2025-2026-");
                        if (!isCourseType && !isCoursePrefix) {
                          return false;
                        }
                      } else {
                        // For tutor/meet tabs: match invoiceType exactly
                        if (invoice.invoiceType?.toLowerCase() !== invoiceTypeTab) {
                          return false;
                        }
                      }
                    }

                    // Invoice ID prefix filter
                    if (invoiceIdFilter.trim()) {
                      return invoice.invoiceNumber
                        ?.toLowerCase()
                        .startsWith(invoiceIdFilter.trim().toLowerCase());
                    }

                    return true;
                  })
                  .map((invoice) => (
                  <tr key={invoice._id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#667eea' }}>
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td style={styles.td}>{invoice.username}</td>
                    <td style={styles.td}>{invoice.email}</td>
                    <td style={styles.td}>{formatCurrency(invoice.amount)}</td>
                    <td style={styles.td}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: '#17a2b8', 
                        color: 'white', 
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'uppercase'
                      }}>
                        {invoice.invoiceType}
                      </span>
                    </td>
                    <td style={styles.td}>{invoice.paymentMethod}</td>
                    <td style={styles.td}>{formatDate(invoice.paymentDate)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(invoice.status),
                        }}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => navigate(`/schoolemy/auditor/invoice/${invoice.invoiceNumber}`)}
                        >
                          👁️ View
                        </button>
                        <button
                          style={{ ...styles.actionBtn, backgroundColor: "#17a2b8" }}
                          onClick={() => downloadInvoicePDF(invoice.invoiceNumber)}
                        >
                          📄 Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {invoicePagination && (
            <div style={styles.pagination}>
              <button
                style={styles.pageBtn}
                disabled={invoicePage === 1}
                onClick={() => setInvoicePage(invoicePage - 1)}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {invoicePage} of {invoicePagination.pages}
              </span>
              <button
                style={styles.pageBtn}
                disabled={invoicePage === invoicePagination.pages}
                onClick={() => setInvoicePage(invoicePage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "32px",
    backgroundColor: "#f5f7fa",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    paddingBottom: "20px",
    borderBottom: "2px solid #e5e7eb",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#1f2937",
    letterSpacing: "-0.5px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
  },
  createButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(14, 165, 233, 0.25)",
    transform: "translateY(0)",
  },
  filterSection: {
    display: "flex",
    gap: "14px",
    marginBottom: "28px",
    flexWrap: "wrap",
    padding: "12px 20px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterInput: {
    padding: "10px 14px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    minWidth: "160px",
    height: "44px",
    transition: "all 0.3s ease",
    outline: "none",
    fontWeight: "500",
  },
  filterActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  resetButton: {
    height: "44px",
    padding: "0 18px",
    background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(107, 114, 128, 0.2)",
  },
  tabContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "28px",
    backgroundColor: "#fff",
    padding: "8px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  },
  tab: {
    padding: "12px 24px",
    minHeight: "44px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#6b7280",
    cursor: "pointer",
    transition: "all 0.3s ease",
    position: "relative",
  },
  activeTab: {
    color: "#0ea5e9",
    backgroundColor: "#f3f4f6",
    boxShadow: "0 2px 8px rgba(14, 165, 233, 0.15)",
  },
  loading: {
    textAlign: "center",
    padding: "60px",
    fontSize: "18px",
    color: "#6b7280",
    fontWeight: "500",
  },
  overviewContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  statCard: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: "8px",
    letterSpacing: "-1px",
  },
  statSubtext: {
    fontSize: "13px",
    color: "#9ca3af",
    fontWeight: "500",
  },
  currencyNote: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#6b7280",
    marginLeft: "8px",
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  chartCard: {
    backgroundColor: "#fff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
  },
  chartTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#1f2937",
    letterSpacing: "-0.3px",
  },
  categoryList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  categoryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    border: "2px solid transparent",
  },
  categoryName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  categoryAmount: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0ea5e9",
  },
  categoryCount: {
    fontSize: "13px",
    color: "#6b7280",
    marginLeft: "12px",
    fontWeight: "500",
  },
  recentSection: {
    backgroundColor: "#fff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#1f2937",
    letterSpacing: "-0.3px",
  },
  contentContainer: {
    backgroundColor: "#fff",
    padding: "28px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "12px",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
  },
  th: {
    textAlign: "left",
    padding: "16px",
    background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
    transition: "all 0.2s ease",
  },
  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#4b5563",
    fontWeight: "500",
    backgroundColor: "#fff",
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#fff",
    display: "inline-block",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  actionBtn: {
    padding: "8px 16px",
    backgroundColor: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 6px rgba(14, 165, 233, 0.3)",
    textTransform: "capitalize",
  },
  editBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)",
  },
  deleteBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "28px",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  },
  pageBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(14, 165, 233, 0.3)",
  },
  pageInfo: {
    fontSize: "15px",
    color: "#4b5563",
    fontWeight: "600",
  },
};

export default FinancialAuditingScreen;
