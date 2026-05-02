import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { format } from "date-fns";
import { listInvoices, getInvoiceByNumber } from '../../../Utils/invoiceApi';
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import logo from "../../../assets/Irai aram logo.png";

// --- SVG Icon Components ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const ViewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;

const InvoiceListAuditor = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    invoiceType: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    invoiceNumber: '', // invoice id based filter
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeInvoiceTab, setActiveInvoiceTab] = useState('all'); // all | tutor | meet | course-inv5

  const fetchInvoices = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchTerm,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await listInvoices(params);
      const rows = response.data?.data;
      setInvoices(Array.isArray(rows) ? rows : []);
      const pag = response.data?.pagination;
      const pagesRaw = Number(pag?.pages);
      const pageRaw = Number(pag?.page);
      const safePages =
        Number.isFinite(pagesRaw) && pagesRaw >= 1 ? pagesRaw : 1;
      const safePage =
        Number.isFinite(pageRaw) && pageRaw >= 1
          ? Math.min(pageRaw, safePages)
          : 1;
      setTotalPages(safePages);
      setCurrentPage(safePage);
    } catch (error) {
      enqueueSnackbar('Failed to fetch invoices', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [limit, searchTerm, filters, enqueueSnackbar]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, filters, fetchInvoices]);

  const selectInvoiceTab = useCallback(
    (tab) => {
      setActiveInvoiceTab(tab);
      fetchInvoices(1);
    },
    [fetchInvoices]
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      invoiceType: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
      invoiceNumber: '',
    });
    setSearchTerm('');
  };

  const handleView = (invoiceNumber) => {
    navigate(`/schoolemy/auditor/invoice/${invoiceNumber}`);
  };

  const handleDownload = async (invoiceNumber) => {
    // Create a temporary container for the invoice
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '40px';

    try {
      enqueueSnackbar('Preparing invoice for download...', { variant: 'info' });

      // Fetch invoice data
      const response = await getInvoiceByNumber(invoiceNumber);
      const invoice = response.data.invoice;

      document.body.appendChild(tempContainer);

      // HTML escape helper to prevent XSS
      const escHtml = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');

      // Build invoice HTML
      tempContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #1a202c;">
          <div style="background: #f2d4a1; padding: 20px; border-radius: 8px 8px 0 0; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
            <div style="flex: 0 0 auto;">
              <img src="${logo}" alt="Irai Aram Logo" style="width: 140px; height: auto; object-fit: contain;" crossorigin="anonymous" />
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
                <p style="margin: 5px 0; font-size: 12px;">Date: ${format(new Date(invoice.paymentDate), 'dd MMM yyyy')}</p>
              </div>
              <div style="text-align: right;">
                <h3 style="margin: 0 0 10px 0; color: #718096; font-size: 11px;">BILL TO</h3>
                <p style="margin: 5px 0; font-size: 13px; font-weight: bold;">${escHtml(invoice.username)}</p>
                <p style="margin: 5px 0; font-size: 12px;">${escHtml(invoice.email)}</p>
                ${invoice.mobile ? `<p style="margin: 5px 0; font-size: 12px;">📞 ${escHtml(invoice.mobile)}</p>` : ''}
                ${invoice.studentRegisterNumber ? `<p style="margin: 5px 0; font-size: 12px;">Reg: ${escHtml(invoice.studentRegisterNumber)}</p>` : ''}
              </div>
            </div>

            <div style="margin-bottom: 20px; padding: 10px; background: #fff3cd; border-radius: 8px; display: flex; justify-content: space-between;">
              <div><strong style="font-size: 10px; color: #92400e;">Transaction ID:</strong><br/><span style="font-size: 11px;">${escHtml(invoice.transactionId)}</span></div>
              <div><strong style="font-size: 10px; color: #92400e;">Payment Method:</strong><br/><span style="font-size: 11px;">${escHtml(invoice.paymentMethod)}</span></div>
              <div><strong style="font-size: 10px; color: #92400e;">Financial Year:</strong><br/><span style="font-size: 11px;">${escHtml(invoice.financialYear)}</span></div>
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
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${escHtml(invoice.itemDescription)}</td>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">1</td>
                  <td style="padding: 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 12px;">₹${invoice.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              ${(() => {
                const amt = parseFloat(invoice.amount) || 0;
                const courseValue = amt / 1.2;   // 1 + 18% GST + 2% fee
                const cgst = courseValue * 0.09;
                const sgst = courseValue * 0.09;
                const transactionFee = courseValue * 0.02;
                return `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="font-size: 12px; font-weight: 600;">Course Value:</span>
                  <span style="font-size: 12px; font-weight: 700;">₹${courseValue.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="font-size: 12px; font-weight: 600;">CGST (9%):</span>
                  <span style="font-size: 12px; font-weight: 700;">₹${cgst.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="font-size: 12px; font-weight: 600;">SGST (9%):</span>
                  <span style="font-size: 12px; font-weight: 700;">₹${sgst.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="font-size: 12px; font-weight: 600;">Transaction Fee (2%):</span>
                  <span style="font-size: 12px; font-weight: 700;">₹${transactionFee.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #cbd5e0;">
                  <span style="font-size: 16px; font-weight: 700;">Total Amount:</span>
                  <span style="font-size: 16px; font-weight: 700; color: #10b981;">₹${amt.toFixed(2)}</span>
                </div>
              `;
              })()}
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

      enqueueSnackbar('Invoice downloaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      enqueueSnackbar('Failed to download invoice', { variant: 'error' });
    } finally {
      // Remove temp container regardless of success or error
      if (tempContainer.parentNode) {
        document.body.removeChild(tempContainer);
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      fetchInvoices(newPage);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      issued: '#6c757d',
      sent: '#17a2b8',
      viewed: '#ffc107',
      paid: '#28a745',
      cancelled: '#dc3545',
      refunded: '#fd7e14',
    };
    return colors[status] || '#6c757d';
  };

  const getInvoicesForActiveTab = () => {
    let result = invoices;

    // Type based tabs
    if (activeInvoiceTab === 'course') {
      // Show course invoices: either invoiceType is 'course' OR invoiceNumber starts with INV-GKVK-2025-2026-
      result = result.filter(
        (inv) =>
          inv.invoiceType?.toLowerCase() === 'course' ||
          inv.invoiceNumber?.startsWith('INV-GKVK-2025-2026-')
      );
    } else if (activeInvoiceTab === 'tutor') {
      result = result.filter((inv) => inv.invoiceType?.toLowerCase() === 'tutor');
    } else if (activeInvoiceTab === 'meet') {
      result = result.filter((inv) => inv.invoiceType?.toLowerCase() === 'meet');
    }

    // Invoice ID based client-side filter (prefix match)
    if (filters.invoiceNumber) {
      const q = filters.invoiceNumber.toLowerCase().trim();
      result = result.filter((inv) =>
        inv.invoiceNumber?.toLowerCase().startsWith(q)
      );
    }

    return result;
  };

  const displayedInvoices = getInvoicesForActiveTab();

  return (
    <>
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backButton}><BackIcon /> Back</button>
          <h1 style={styles.title}>Invoice Management</h1>
          <button onClick={() => setShowFilters(!showFilters)} style={styles.filterButton}>
            <FilterIcon /> {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {showFilters && (
          <div style={styles.filterContainer}>
            <div style={styles.filterGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} style={styles.select}>
                  <option value="">All Statuses</option>
                  <option value="issued">Issued</option>
                  <option value="sent">Sent</option>
                  <option value="viewed">Viewed</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Invoice Type</label>
                <select name="invoiceType" value={filters.invoiceType} onChange={handleFilterChange} style={styles.select}>
                  <option value="">All Types</option>
                  <option value="emi">EMI</option>
                  <option value="full">Full Payment</option>
                  <option value="course">Course</option>
                  <option value="tutor">Tutor</option>
                  <option value="meet">Meet</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Invoice ID</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={filters.invoiceNumber}
                  onChange={handleFilterChange}
                  style={styles.input}
                  placeholder="e.g. INV-GKVK-2025-2026-00005"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Payment Method</label>
                <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange} style={styles.select}>
                  <option value="">All Methods</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="UPI">UPI</option>
                  <option value="WALLET">Wallet</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date</label>
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>End Date</label>
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <button onClick={handleClearFilters} style={styles.clearButton}>Clear Filters</button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.toolbar}>
          <div style={styles.searchContainer}>
            <span style={styles.searchIcon}><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search by name, email, invoice number..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.card}>
          {/* Invoice Type Tabs */}
          <div style={styles.invoiceTabs}>
            <button
              type="button"
              style={{
                ...styles.invoiceTabButton,
                ...(activeInvoiceTab === 'all' ? styles.invoiceTabButtonActive : {}),
              }}
              onClick={() => selectInvoiceTab('all')}
            >
              All Invoices
            </button>
            <button
              type="button"
              style={{
                ...styles.invoiceTabButton,
                ...(activeInvoiceTab === 'course' ? styles.invoiceTabButtonActive : {}),
              }}
              onClick={() => selectInvoiceTab('course')}
            >
              Course Invoices
            </button>
            <button
              type="button"
              style={{
                ...styles.invoiceTabButton,
                ...(activeInvoiceTab === 'tutor' ? styles.invoiceTabButtonActive : {}),
              }}
              onClick={() => selectInvoiceTab('tutor')}
            >
              Tutor Invoices
            </button>
            <button
              type="button"
              style={{
                ...styles.invoiceTabButton,
                ...(activeInvoiceTab === 'meet' ? styles.invoiceTabButtonActive : {}),
              }}
              onClick={() => selectInvoiceTab('meet')}
            >
              Meet Invoices
            </button>
          </div>
          {loading ? (
            <div style={styles.loading}><div style={styles.spinner}></div><p>Loading invoices...</p></div>
          ) : displayedInvoices.length === 0 ? (
            <div style={styles.noRecords}><h3>No Invoices Found</h3><p>Try adjusting your search or filters.</p></div>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.tableHeader}>Invoice #</th>
                      <th style={styles.tableHeader}>Student Name</th>
                      <th style={styles.tableHeader}>Email</th>
                      <th style={styles.tableHeader}>Amount</th>
                      <th style={styles.tableHeader}>Type</th>
                      <th style={styles.tableHeader}>Payment Method</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInvoices.map((invoice) => (
                      <tr key={invoice._id} style={styles.tableRow}>
                        <td style={styles.tableCell}><span style={styles.invoiceNumber}>{invoice.invoiceNumber}</span></td>
                        <td style={styles.tableCell}><span style={styles.tableName}>{invoice.username}</span></td>
                        <td style={styles.tableCell}>{invoice.email}</td>
                        <td style={styles.tableCell}><strong>₹{invoice.amount.toFixed(2)}</strong></td>
                        <td style={styles.tableCell}><span style={styles.typeBadge}>{invoice.invoiceType.toUpperCase()}</span></td>
                        <td style={styles.tableCell}>{invoice.paymentMethod}</td>
                        <td style={styles.tableCell}>{format(new Date(invoice.paymentDate), 'dd MMM, yyyy')}</td>
                        <td style={styles.tableCell}>
                          <span style={{ ...styles.statusBadge, backgroundColor: getStatusBadgeColor(invoice.status) }}>
                            {invoice.status}
                          </span>
                        </td>
                        <td style={{ ...styles.tableCell, ...styles.actionCell }}>
                          <button onClick={() => handleView(invoice.invoiceNumber)} style={{ ...styles.iconButton, backgroundColor: '#667eea', color: 'white' }} title="View Invoice"><ViewIcon /></button>
                          <button onClick={() => handleDownload(invoice.invoiceNumber)} style={{ ...styles.iconButton, backgroundColor: '#17a2b8', color: 'white' }} title="Download Invoice"><DownloadIcon /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={styles.pagination}>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={styles.paginationButton}>Previous</button>
                <span style={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} style={styles.paginationButton}>Next</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// --- STYLES ---
const colors = {
  primary: '#667eea',
  primaryHover: '#5568d3',
  success: '#28a745',
  successHover: '#218838',
  danger: '#dc3545',
  dangerHover: '#c82333',
  light: '#f8f9fa',
  dark: '#343a40',
  text: '#495057',
  textLight: '#6c757d',
  border: '#dee2e6',
  white: '#ffffff',
};

const styles = {
  container: { maxWidth: '1400px', margin: "3rem auto", padding: '2rem', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", backgroundColor: colors.light, borderRadius: '12px' },
  header: { display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' },
  title: { fontSize: '1.75rem', fontWeight: 600, color: colors.dark, margin: '0', flexGrow: 1, textAlign: 'center' },
  backButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: colors.white, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'background-color 0.2s' },
  filterButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'background-color 0.2s' },
  filterContainer: { backgroundColor: colors.white, borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: colors.text },
  input: { padding: '0.6rem', borderRadius: '4px', border: `1px solid ${colors.border}`, fontSize: '1rem' },
  select: { padding: '0.6rem', borderRadius: '4px', border: `1px solid ${colors.border}`, fontSize: '1rem', backgroundColor: colors.white },
  clearButton: { marginTop: 'auto', padding: '0.6rem 1rem', backgroundColor: colors.danger, color: colors.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  searchContainer: { position: 'relative', display: 'flex', alignItems: 'center', flexGrow: 1 },
  searchIcon: { position: 'absolute', left: '12px', color: colors.textLight },
  searchInput: { width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' },
  card: { backgroundColor: colors.white, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', padding: '2rem' },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem' },
  spinner: { border: '4px solid rgba(0, 0, 0, 0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: colors.primary, animation: 'spin 1s linear infinite' },
  noRecords: { textAlign: 'center', padding: '3rem', color: colors.textLight },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeaderRow: { borderBottom: `2px solid ${colors.border}` },
  tableHeader: { padding: '1rem', textAlign: 'left', fontWeight: 600, color: colors.text, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' },
  tableRow: { borderBottom: `1px solid ${colors.border}` },
  tableCell: { padding: '1rem', verticalAlign: 'middle', color: colors.text, fontSize: '0.9rem' },
  tableName: { fontWeight: 500, color: colors.dark },
  invoiceNumber: { fontFamily: 'monospace', fontWeight: 600, color: colors.primary },
  statusBadge: { display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500, color: colors.white, textTransform: 'uppercase' },
  typeBadge: { display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500, color: colors.white, backgroundColor: '#17a2b8' },
  actionCell: { textAlign: 'right', whiteSpace: 'nowrap' },
  iconButton: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px', transition: 'background-color 0.2s', marginLeft: '0.5rem' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' },
  paginationButton: { padding: '0.5rem 1rem', backgroundColor: colors.white, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 500 },
  pageInfo: { fontSize: '1rem', color: colors.textLight, fontWeight: 500 },
  invoiceTabs: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `2px solid ${colors.border}` },
  invoiceTabButton: { padding: '0.5rem 1rem', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.white, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: colors.textLight, transition: 'all 0.2s' },
  invoiceTabButtonActive: { backgroundColor: colors.primary, color: colors.white, borderColor: colors.primary },
};

// Add hover effects
const dynamicStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .styles-root button:disabled { background-color: #e9ecef !important; color: #6c757d !important; cursor: not-allowed; }
  .styles-root input:focus, .styles-root select:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.25); }
  .styles-root tr:nth-of-type(even) { background-color: ${colors.light}; }
  .styles-root tr:hover { background-color: #e9ecef; }
  .styles-root .icon-button:hover { opacity: 0.8; }
  .styles-root .back-button:hover, .styles-root .filter-button:hover { background-color: #e9ecef; }
`;

const StyleInjector = ({ children }) => (
  <>
    <style>{dynamicStyles}</style>
    <div className="styles-root">{children}</div>
  </>
);

const WrappedInvoiceListAuditor = () => (
  <StyleInjector>
    <InvoiceListAuditor />
  </StyleInjector>
);

export default WrappedInvoiceListAuditor;
