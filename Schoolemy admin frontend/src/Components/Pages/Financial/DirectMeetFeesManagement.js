import React, { useState, useEffect,useCallback } from 'react';
import axios from '../../../Utils/api'; 
import { useNavigate } from 'react-router-dom';

import { useSnackbar } from 'notistack';
import { format } from "date-fns";
import jsPDF from 'jspdf';

// --- SVG Icon Components for a cleaner look ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>;

const DirectMeetFeesManagementAUD = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [formData, setFormData] = useState({ studentID: '', name: '', gender: 'Male', amount: '', paymentType: 'Online', course: '' });
  const [editMode, setEditMode] = useState(false);
  const [currentFeeId, setCurrentFeeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

const fetchFees = useCallback(async (page = 1) => {
  setLoading(true);
  try {
    const response = await axios.get(`/get-direct-meet-fees?page=${page}&limit=${limit}&search=${searchTerm}`);
    setFees(response.data.fees);
    setTotalPages(response.data.totalPages);
    setCurrentPage(response.data.currentPage);
  } catch (error) {
    enqueueSnackbar('Failed to fetch records', { variant: 'error' });
  } finally {
    setLoading(false);
  }
}, [limit, searchTerm, enqueueSnackbar]);

useEffect(() => {
  const handler = setTimeout(() => {
    fetchFees();
  }, 300);
  return () => clearTimeout(handler);
}, [searchTerm, fetchFees]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || '' : value }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ studentID: '', name: '', gender: 'Male', amount: '', paymentType: 'Online', course: '' });
    setEditMode(false);
    setCurrentFeeId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = editMode ? `/put-direct-meet-fees/${currentFeeId}` : '/post-direct-meet-fees';
    const method = editMode ? 'put' : 'post';
    const successMessage = editMode ? 'Record updated successfully' : 'Record created successfully';

    try {
      await axios[method](endpoint, formData);
      enqueueSnackbar(successMessage, { variant: 'success' });
      fetchFees(currentPage);
      closeModal();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleEdit = (fee) => {
    setFormData({
      studentID: fee.studentID,
      name: fee.name,
      gender: fee.gender,
      amount: fee.amount,
      paymentType: fee.paymentType,
      course: fee.course
    });
    setEditMode(true);
    setCurrentFeeId(fee._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/delete-direct-meet-fees/${id}`);
        enqueueSnackbar('Record deleted successfully', { variant: 'success' });
        fetchFees(currentPage);
      } catch (error) {
        enqueueSnackbar('Failed to delete record', { variant: 'error' });
      }
    }
  };

  const handleDownloadBill = (fee) => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text('Direct Meet Fee Bill', 105, 20, { align: 'center' });
    
    // Add bill details
    doc.setFontSize(12);
    doc.text(`Student ID: ${fee.studentID}`, 20, 40);
    doc.text(`Name: ${fee.name}`, 20, 50);
    doc.text(`Gender: ${fee.gender}`, 20, 60);
    doc.text(`Course: ${fee.course}`, 20, 70);
    doc.text(`Amount: ₹${fee.amount}`, 20, 80);
    doc.text(`Payment Type: ${fee.paymentType}`, 20, 90);
    doc.text(`Date: ${format(new Date(fee.date || fee.createdAt), 'dd/MM/yyyy')}`, 20, 100);
    
    // Add footer
    doc.setFontSize(10);
    doc.text('Thank you for your payment!', 105, 120, { align: 'center' });
    
    // Save the PDF
    doc.save(`bill_${fee.studentID}_${format(new Date(fee.date || fee.createdAt), 'yyyyMMdd')}.pdf`);
  };

  const handlePrintBill = (fee) => {
    const billHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Direct Meet Fee Bill - ${fee.studentID}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20mm; }
          @page { size: A4; margin: 10mm; }
          .bill { max-width: 210mm; margin: 0 auto; }
          .bill h1 { font-size: 22px; text-align: center; margin-bottom: 25px; }
          .bill-content { font-size: 14px; line-height: 2; }
          .bill-footer { font-size: 12px; text-align: center; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="bill">
          <h1>Direct Meet Fee Bill</h1>
          <div class="bill-content">
            <p><strong>Student ID:</strong> ${fee.studentID}</p>
            <p><strong>Name:</strong> ${fee.name}</p>
            <p><strong>Gender:</strong> ${fee.gender}</p>
            <p><strong>Course:</strong> ${fee.course}</p>
            <p><strong>Amount:</strong> ₹${fee.amount}</p>
            <p><strong>Payment Type:</strong> ${fee.paymentType}</p>
            <p><strong>Date:</strong> ${format(new Date(fee.date || fee.createdAt), 'dd/MM/yyyy')}</p>
          </div>
          <div class="bill-footer">Thank you for your payment!</div>
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(billHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 250);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      fetchFees(newPage);
    }
  };

  return (
    <>
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            {/* <div style={styles.modalHeader}>
              <h2 style={styles.cardTitle}>{editMode ? 'Edit Fee Record' : 'Add New Fee Record'}</h2>
              <button onClick={closeModal} style={styles.closeButton}>×</button>
            </div> */}
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                 <div style={styles.formGroup}><label style={styles.label}>Student ID</label><input type="text" name="studentID" value={formData.studentID} onChange={handleInputChange} style={styles.input} required/></div>
                 <div style={styles.formGroup}><label style={styles.label}>Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} style={styles.input} required/></div>
                 <div style={styles.formGroup}><label style={styles.label}>Gender</label><select name="gender" value={formData.gender} onChange={handleInputChange} style={styles.select} required><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                 <div style={styles.formGroup}><label style={styles.label}>Amount</label><input type="number" name="amount" value={formData.amount} onChange={handleInputChange} style={styles.input} min="0" step="0.01" required/></div>
                 <div style={styles.formGroup}><label style={styles.label}>Payment Type</label><select name="paymentType" value={formData.paymentType} onChange={handleInputChange} style={styles.select} required><option value="Online">Online</option><option value="Offline">Offline</option></select></div>
                 <div style={styles.formGroup}><label style={styles.label}>Course</label><input type="text" name="course" value={formData.course} onChange={handleInputChange} style={styles.input} required/></div>
              </div>
              <div style={styles.buttonGroup}>
                <button type="button" onClick={closeModal} style={styles.cancelButton}>Cancel</button>
                <button type="submit" style={styles.submitButton}>{editMode ? 'Update Record' : 'Create Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.container}>
        <div style={styles.header}>
            <button onClick={() => navigate(-1)} style={styles.backButton}><BackIcon/> Back</button>
            <h1 style={styles.title}>Fees Management</h1>
        </div>

        <div style={styles.toolbar}>
            <div style={styles.searchContainer}>
                <span style={styles.searchIcon}><SearchIcon/></span>
                <input
                    type="text"
                    placeholder="Search by name or course..."
                    style={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {/* <button onClick={handleOpenModalForNew} style={styles.addButton}><AddIcon /> Add New Record</button> */}
        </div>

        <div style={styles.card}>
          {loading ? (
            <div style={styles.loading}><div style={styles.spinner}></div><p>Loading records...</p></div>
          ) : fees.length === 0 ? (
            <div style={styles.noRecords}><h3>No Records Found</h3><p>Try adjusting your search or add a new record.</p></div>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead><tr style={styles.tableHeaderRow}><th style={styles.tableHeader}>Student ID</th><th style={styles.tableHeader}>Name</th><th style={styles.tableHeader}>Gender</th><th style={styles.tableHeader}>Amount</th><th style={styles.tableHeader}>Payment</th><th style={styles.tableHeader}>Course</th><th style={styles.tableHeader}>Date</th><th style={styles.tableHeader}>Actions</th></tr></thead>
                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee._id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{fee.studentID}</td>
                        <td style={styles.tableCell}><span style={styles.tableName}>{fee.name}</span></td>
                        <td style={styles.tableCell}>{fee.gender}</td>
                        <td style={styles.tableCell}>₹{fee.amount.toFixed(2)}</td>
                        <td style={styles.tableCell}><span style={{...styles.paymentBadge, ...(fee.paymentType === 'Online' ? styles.onlineBadge : styles.offlineBadge)}}>{fee.paymentType}</span></td>
                        <td style={styles.tableCell}>{fee.course}</td>
                        <td style={styles.tableCell}>{format(new Date(fee.date), 'dd MMM, yyyy')}</td>
                        <td style={{...styles.tableCell, ...styles.actionCell}}>
                          <button onClick={() => handleEdit(fee)} style={{...styles.iconButton, ...styles.editButton}} title="Edit"><EditIcon/></button>
                          <button onClick={() => handlePrintBill(fee)} style={{...styles.iconButton, backgroundColor: '#6f42c1', color: 'white'}} title="Print Bill"><PrintIcon/></button>
                          <button onClick={() => handleDownloadBill(fee)} style={{...styles.iconButton, backgroundColor: '#17a2b8', color: 'white'}} title="Download Bill"><DownloadIcon/></button>
                          <button onClick={() => handleDelete(fee._id)} style={{...styles.iconButton, ...styles.deleteButton}} title="Delete"><DeleteIcon/></button>
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
  primary: '#007bff',
  primaryHover: '#0056b3',
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
  container: { maxWidth: '1200px', margin: "3rem auto", padding: '2rem', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", backgroundColor: colors.light, borderRadius: '12px' },
  header: { display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' },
  title: { fontSize: '1.75rem', fontWeight: 600, color: colors.dark, margin: '0', flexGrow: 1, textAlign: 'center' },
  backButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: colors.white, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'background-color 0.2s' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  searchContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: colors.textLight },
  searchInput: { width: '300px', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' },
  addButton: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '1rem', transition: 'background-color 0.2s' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: colors.white, borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', padding: '2rem', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, paddingBottom: '1rem', marginBottom: '1.5rem' },
  closeButton: { background: 'transparent', border: 'none', fontSize: '1.75rem', fontWeight: 'bold', color: colors.textLight, cursor: 'pointer' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: colors.text },
  input: { padding: '0.6rem', borderRadius: '4px', border: `1px solid ${colors.border}`, fontSize: '1rem' },
  select: { padding: '0.6rem', borderRadius: '4px', border: `1px solid ${colors.border}`, fontSize: '1rem', backgroundColor: colors.white },
  buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' },
  submitButton: { padding: '0.6rem 1.5rem', backgroundColor: colors.success, color: colors.white, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 },
  cancelButton: { padding: '0.6rem 1.5rem', backgroundColor: colors.white, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 },
  card: { backgroundColor: colors.white, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', padding: '2rem' },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem' },
  spinner: { border: '4px solid rgba(0, 0, 0, 0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: colors.primary, animation: 'spin 1s linear infinite' },
  noRecords: { textAlign: 'center', padding: '3rem', color: colors.textLight },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeaderRow: { borderBottom: `2px solid ${colors.border}` },
  tableHeader: { padding: '1rem', textAlign: 'left', fontWeight: 600, color: colors.text, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' },
  tableRow: { borderBottom: `1px solid ${colors.border}` },
  tableCell: { padding: '1rem', verticalAlign: 'middle', color: colors.text },
  tableName: { fontWeight: 500, color: colors.dark },
  paymentBadge: { display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500, color: colors.white },
  onlineBadge: { backgroundColor: colors.success },
  offlineBadge: { backgroundColor: '#fd7e14' },
  actionCell: { textAlign: 'right' },
  iconButton: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', transition: 'background-color 0.2s' },
  editButton: { color: colors.primary },
  deleteButton: { color: colors.danger },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' },
  paginationButton: { padding: '0.5rem 1rem', backgroundColor: colors.white, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 500 },
  pageInfo: { fontSize: '1rem', color: colors.textLight, fontWeight: 500 },
};

// Add hover effects and other dynamic styles using a style tag
const dynamicStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .styles-root button:disabled { background-color: #e9ecef !important; color: #6c757d !important; cursor: not-allowed; }
  .styles-root input:focus, .styles-root select:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25); }
  .styles-root tr:nth-of-type(even) { background-color: ${colors.light}; }
  .styles-root tr:hover { background-color: #e9ecef; }
  .styles-root .icon-button:hover { background-color: #e9ecef; }
  .styles-root .back-button:hover { background-color: #e9ecef; }
  .styles-root .add-button:hover { background-color: ${colors.primaryHover}; }
  .styles-root .submit-button:hover { background-color: ${colors.successHover}; }
  .styles-root .cancel-button:hover { background-color: #e9ecef; }
`;

// A simple component to inject dynamic styles into the head
const StyleInjector = ({ children }) => (
  <>
    <style>{dynamicStyles}</style>
    <div className="styles-root">{children}</div>
  </>
);

const WrappedDirectMeetFeesManagement = () => (
  <StyleInjector>
    <DirectMeetFeesManagementAUD />
  </StyleInjector>
);

export default WrappedDirectMeetFeesManagement;