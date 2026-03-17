import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../Utils/api';

// Define style constants
const colors = {
  primary: '#4F46E5', primaryDark: '#4338CA', textPrimary: '#1F2937',
  textSecondary: '#4B5563', textLight: '#6B7280', borderLight: '#E5E7EB',
  borderDefault: '#D1D5DB', bgRoot: 'linear-gradient(to bottom right, #F9FAFB, #F3F4F6)',
  bgLight: '#F9FAFB', bgLighter: '#F3F4F6', white: '#FFFFFF', black: '#000000',
  success: '#10B981', error: '#EF4444', deleteColor: '#DC2626', deleteDark: '#B91C1C',
  statusColors: {
    paid: '#10B981', // green
    pending: '#F59E0B', // amber
    cancelled: '#78716C', // stone
  },
};

const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  modal: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)',
};

const typography = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
};


// --- Reusable Fee Form Fields Component ---
const FeeFormFields = ({ formData, handleChange, errors }) => {
  const formStyles = {
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' },
    formLabel: { display: 'block', fontSize: '14px', fontWeight: '500', color: colors.textSecondary, marginBottom: '4px' },
    formInput: { width: '100%', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.borderDefault}`, fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' },
    formInputFocus: { borderColor: colors.primary, boxShadow: `0 0 0 1px ${colors.primary}` },
    formInputError: { borderColor: colors.error },
    formErrorText: { marginTop: '4px', fontSize: '12px', color: colors.error },
  };

  const handleFocus = (e) => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = formStyles.formInputFocus.boxShadow; }
  const handleBlur = (e) => {
    e.target.style.boxShadow = 'none';
    if (errors[e.target.name]) e.target.style.borderColor = colors.error;
    else e.target.style.borderColor = colors.borderDefault;
  };

  const statusOptions = ['paid', 'pending', 'cancelled'];
  const paymentMethodOptions = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Online Payment'];


  return (
    <div style={formStyles.formGrid}>
      <div>
        <label style={formStyles.formLabel}>Student ID *</label>
        <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={{ ...formStyles.formInput, ...(errors.studentId && formStyles.formInputError) }} placeholder="Enter Student ID" />
        {errors.studentId && <p style={formStyles.formErrorText}>{errors.studentId}</p>}
      </div>
      <div>
        <label style={formStyles.formLabel}>Amount *</label>
        <input type="number" name="amount" value={formData.amount} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={{ ...formStyles.formInput, ...(errors.amount && formStyles.formInputError) }} placeholder="e.g., 500" min="0" step="0.01" />
        {errors.amount && <p style={formStyles.formErrorText}>{errors.amount}</p>}
      </div>
      <div>
        <label style={formStyles.formLabel}>Payment Date *</label>
        <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={{ ...formStyles.formInput, ...(errors.paymentDate && formStyles.formInputError) }} />
        {errors.paymentDate && <p style={formStyles.formErrorText}>{errors.paymentDate}</p>}
      </div>
      <div>
        <label style={formStyles.formLabel}>Payment Method *</label>
        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={{ ...formStyles.formInput, ...(errors.paymentMethod && formStyles.formInputError) }}>
          <option value="">Select Method</option>
          {paymentMethodOptions.map(method => <option key={method} value={method}>{method}</option>)}
        </select>
        {errors.paymentMethod && <p style={formStyles.formErrorText}>{errors.paymentMethod}</p>}
      </div>
      <div style={{ gridColumn: 'span 2 / span 2' }}> {/* Status full width */}
        <label style={formStyles.formLabel}>Status *</label>
        <select name="status" value={formData.status} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={{ ...formStyles.formInput, ...(errors.status && formStyles.formInputError) }}>
          <option value="">Select Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        {errors.status && <p style={formStyles.formErrorText}>{errors.status}</p>}
      </div>
    </div>
  );
};


const MonthlyFeesManagementAUD = () => {
  const [feesData, setFeesData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '', amount: '', paymentDate: '', paymentMethod: '', status: 'pending'
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Hover states
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);
  const [isCreateModalButtonHovered, setIsCreateModalButtonHovered] = useState(false);
  const [isUpdateModalButtonHovered, setIsUpdateModalButtonHovered] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState(null);

  const limit = 10; // Records per page

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
  };

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit });
      const response = await axios.get(`/get-monthly-fees?${params.toString()}`);
      setFeesData(response.data.fees);
      setTotalPages(response.data.totalPages);
      setTotalRecords(response.data.totalRecords);
    } catch (error) {
      console.error('Failed to fetch fees:', error);
      setSuccessMessage(error.response?.data?.message || 'Error fetching fee records.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (formData.amount === '' || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment Date is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment Method is required';
    if (!formData.status) newErrors.status = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ studentId: '', amount: '', paymentDate: '', paymentMethod: '', status: 'pending' });
    setErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFee = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await axios.post('/post-monthly-fees', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setSuccessMessage('Monthly fee added successfully!');
      setShowCreateModal(false); resetForm(); fetchFees();
    } catch (error) {
      console.error('Failed to add fee:', error);
      setSuccessMessage(error.response?.data?.message || 'Failed to add fee.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const openEditModal = (fee) => {
    setSelectedFee(fee);
    setFormData({
      studentId: fee.studentId, // If studentId is an object from populate: fee.studentId._id or fee.studentId.studentId (depends on your backend)
                                // Assuming fee.studentId is the string ID as per model.
      amount: fee.amount.toString(),
      paymentDate: formatDateForInput(fee.paymentDate),
      paymentMethod: fee.paymentMethod,
      status: fee.status,
    });
    setShowEditModal(true);
  };

  const handleUpdateFee = async () => {
    if (!validateForm() || !selectedFee) return;
    setLoading(true);
    try {
      await axios.put(`/put-monthly-fees/${selectedFee._id}`, {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setSuccessMessage('Monthly fee updated successfully!');
      setShowEditModal(false); resetForm(); fetchFees();
    } catch (error) {
      console.error('Failed to update fee:', error);
      setSuccessMessage(error.response?.data?.message || 'Failed to update fee.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDeleteFee = async (feeId) => {
    if (window.confirm('Are you sure you want to delete this fee record?')) {
      setLoading(true);
      try {
        await axios.delete(`/delete-monthly-fees/${feeId}`);
        setSuccessMessage('Monthly fee deleted successfully!');
        fetchFees(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete fee:', error);
        setSuccessMessage(error.response?.data?.message || 'Failed to delete fee.');
      } finally {
        setLoading(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  // Styles (largely reused and adapted from previous component)
  const styles = {
    pageContainer: { minHeight: '100vh', background: colors.bgRoot, padding: '32px', fontFamily: typography.fontFamily },
    successMessage: { position: 'fixed', top: '16px', right: '16px', zIndex: 1050, padding: '12px 24px', borderRadius: '8px', boxShadow: shadows.lg, animation: 'bounce-custom 1s ease-in-out', color: colors.white },
    headerContainer: { maxWidth: '1400px', margin: '0 auto 32px auto' },
    headerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' },
    headerTitleGroup: { display: 'flex', alignItems: 'center', gap: '24px' },
    headerTitle: { fontSize: '28px', fontWeight: 'bold', color: colors.textPrimary },
    headerSubtitle: { color: colors.textSecondary, marginTop: '4px', fontSize: '15px' },
    headerActions: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
    button: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s ease-in-out', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px' },
    buttonPrimary: { backgroundColor: colors.primary, color: colors.white, boxShadow: shadows.md, },
    buttonPrimaryHover: { backgroundColor: colors.primaryDark, transform: 'translateY(-2px)' },
    buttonSecondary: { backgroundColor: colors.white, color: colors.textSecondary, border: `1px solid ${colors.borderDefault}`, boxShadow: shadows.sm },
    buttonSecondaryHover: { backgroundColor: colors.bgLighter, borderColor: colors.textLight, color: colors.textPrimary, transform: 'translateY(-1px)' },
    buttonDelete: { backgroundColor: colors.deleteColor, color: colors.white, boxShadow: shadows.sm },
    buttonDeleteHover: { backgroundColor: colors.deleteDark, transform: 'translateY(-1px)' },
    backButtonIcon: { width: '18px', height: '18px', strokeWidth: '2.5' },
    mainContentContainer: { maxWidth: '1400px', margin: '0 auto', backgroundColor: colors.white, borderRadius: '16px', boxShadow: shadows.xl, overflow: 'hidden' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '384px' },
    spinner: { borderRadius: '50%', height: '48px', width: '48px', borderTop: `3px solid ${colors.primary}`, borderRight: `3px solid ${colors.primary}`, borderBottom: `3px solid ${colors.primary}`, borderLeft: '3px solid transparent', animation: 'spin 1s linear infinite' },
    tableOverflow: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHead: { backgroundColor: colors.bgLight },
    tableTh: { padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${colors.borderLight}`, whiteSpace: 'nowrap' },
    tableTd: { padding: '14px 20px', fontSize: '14px', color: colors.textPrimary, borderBottom: `1px solid ${colors.borderLight}`, whiteSpace: 'nowrap' },
    actionButton: { cursor: 'pointer', background: 'none', border: 'none', fontWeight: '500', transition: 'all 0.2s', padding: '6px 10px', borderRadius: '6px', fontSize: '14px' },
    editButton: { color: colors.primary, marginRight: '10px' },
    editButtonHover: { color: colors.primaryDark, backgroundColor: colors.bgLighter },
    deleteButtonSmall: { color: colors.deleteColor },
    deleteButtonSmallHover: { color: colors.deleteDark, backgroundColor: colors.bgLighter },
    paginationContainer: { backgroundColor: colors.white, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${colors.borderLight}`, flexWrap: 'wrap', gap: '16px' },
    paginationInfo: { fontSize: '14px', color: colors.textSecondary },
    paginationNav: { display: 'inline-flex', borderRadius: '6px', boxShadow: shadows.sm, overflow: 'hidden' },
    paginationButton: { position: 'relative', display: 'inline-flex', alignItems: 'center', padding: '8px 16px', border: `1px solid ${colors.borderDefault}`, borderLeftWidth: '0', backgroundColor: colors.white, fontSize: '14px', fontWeight: '500', cursor: 'pointer', color: colors.textLight, transition: 'background-color 0.2s, color 0.2s' },
    paginationButtonFirst: { borderLeftWidth: '1px', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' },
    paginationButtonLast: { borderTopRightRadius: '6px', borderBottomRightRadius: '6px' },
    paginationButtonActive: { zIndex: 10, backgroundColor: colors.primary, borderColor: colors.primary, color: colors.white },
    paginationButtonDisabled: { color: colors.borderDefault, cursor: 'not-allowed', backgroundColor: colors.bgLight },
    paginationIcon: { height: '20px', width: '20px' },
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
    modalContent: { backgroundColor: colors.white, borderRadius: '16px', boxShadow: shadows.modal, width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
    modalInnerPadding: { padding: '24px' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.borderLight}`, paddingBottom: '12px', marginBottom: '24px' },
    modalTitle: { fontSize: '22px', fontWeight: 'bold', color: colors.textPrimary },
    modalCloseButton: { color: colors.textLight, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
    modalCloseButtonIcon: { height: '24px', width: '24px' },
    modalActions: { marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${colors.borderLight}` },
    badge: (status) => ({
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: '600',
        borderRadius: '16px',
        color: colors.white,
        backgroundColor: colors.statusColors[status] || colors.textLight,
        textTransform: 'caxiostalize',
        minWidth: '70px',
        textAlign: 'center',
        display: 'inline-block',
    }),
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce-custom { 0%, 100% { transform: translateY(-10%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); } }
      `}</style>
      <div style={styles.pageContainer}>
        {successMessage && (
          <div style={{...styles.successMessage, backgroundColor: successMessage.toLowerCase().includes('error') || successMessage.toLowerCase().includes('failed') || successMessage.toLowerCase().includes('unauthorized') ? colors.error : colors.success }}>
            {successMessage}
          </div>
        )}
        
        <div style={styles.headerContainer}>
          <div style={styles.headerFlex}>
            <div style={styles.headerTitleGroup}>
              <button onClick={() => window.history.back()} style={{ ...styles.button, ...styles.buttonSecondary, ...(isBackButtonHovered && styles.buttonSecondaryHover) }} onMouseEnter={() => setIsBackButtonHovered(true)} onMouseLeave={() => setIsBackButtonHovered(false)} disabled={loading}>
                <svg style={styles.backButtonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span>Back</span>
              </button>
              <div>
                <h1 style={styles.headerTitle}>Monthly Fees Management</h1>
                <p style={styles.headerSubtitle}>Track and manage student monthly fee payments.</p>
              </div>
            </div>
            {/* <div style={styles.headerActions}>
              <button onClick={() => setShowCreateModal(true)} style={{ ...styles.button, ...styles.buttonPrimary, ...(isAddButtonHovered && styles.buttonPrimaryHover) }} onMouseEnter={() => setIsAddButtonHovered(true)} onMouseLeave={() => setIsAddButtonHovered(false)} disabled={loading}>
                 <svg style={styles.backButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Add New Fee
              </button>
            </div> */}
          </div>
          {/* No filter bar in this version as backend doesn't support filtering for fees */}
        </div>

        <div style={styles.mainContentContainer}>
          {loading && !feesData.length ? (
            <div style={styles.loadingContainer}><div style={styles.spinner}></div></div>
          ) : (
            <>
              <div style={styles.tableOverflow}>
                <table style={styles.table}>
                  <thead style={styles.tableHead}>
                    <tr>
                      <th style={styles.tableTh}>Student ID</th>
                      <th style={styles.tableTh}>Amount</th>
                      <th style={styles.tableTh}>Payment Date</th>
                      <th style={styles.tableTh}>Payment Method</th>
                      <th style={styles.tableTh}>Status</th>
                      <th style={styles.tableTh}>Recorded On</th>
                      <th style={{...styles.tableTh, textAlign: 'right'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody >
                    {feesData.length === 0 && !loading ? (
                      <tr><td colSpan="7" style={{...styles.tableTd, textAlign: 'center', fontStyle: 'italic', color: colors.textLight }}>No fee records found.</td></tr>
                    ) : (
                      feesData.map((fee) => (
                        <tr key={fee._id} style={{...(hoveredRowId === fee._id && {backgroundColor: colors.bgLighter})}} onMouseEnter={() => setHoveredRowId(fee._id)} onMouseLeave={() => setHoveredRowId(null)}>
                          <td style={styles.tableTd}>{fee.studentId /* If populated: fee.studentId.name || fee.studentId */}</td>
                          <td style={styles.tableTd}>${fee.amount.toFixed(2)}</td>
                          <td style={styles.tableTd}>{new Date(fee.paymentDate).toLocaleDateString()}</td>
                          <td style={styles.tableTd}>{fee.paymentMethod}</td>
                          <td style={styles.tableTd}><span style={styles.badge(fee.status)}>{fee.status}</span></td>
                          <td style={styles.tableTd}>{new Date(fee.createdAt).toLocaleDateString()}</td>
                          <td style={{...styles.tableTd, textAlign: 'right'}}>
                            <button onClick={() => openEditModal(fee)} style={{...styles.actionButton, ...styles.editButton}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgLighter} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} disabled={loading}>Edit</button>
                            <button onClick={() => handleDeleteFee(fee._id)} style={{...styles.actionButton, ...styles.deleteButtonSmall}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgLighter} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} disabled={loading}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 0 && (
                <div style={styles.paginationContainer}>
                  <p style={styles.paginationInfo}>
                    Showing <span style={{fontWeight: '600'}}>{Math.min((currentPage - 1) * limit + 1, totalRecords)}</span> to{' '}
                    <span style={{fontWeight: '600'}}>{Math.min(currentPage * limit, totalRecords)}</span> of{' '}
                    <span style={{fontWeight: '600'}}>{totalRecords}</span> results
                  </p>
                  {totalPages > 1 && (
                    <nav style={styles.paginationNav} aria-label="Pagination">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} style={{ ...styles.paginationButton, ...styles.paginationButtonFirst, ...((currentPage === 1 || loading) && styles.paginationButtonDisabled) }}>
                        <svg style={styles.paginationIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button key={i + 1} onClick={() => setCurrentPage(i + 1)} disabled={loading} style={{ ...styles.paginationButton, ...((currentPage === i + 1) && styles.paginationButtonActive), ...(loading && styles.paginationButtonDisabled) }}>
                          {i + 1}
                        </button>
                      ))}
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading} style={{ ...styles.paginationButton, ...styles.paginationButtonLast, ...((currentPage === totalPages || loading) && styles.paginationButtonDisabled) }}>
                        <svg style={styles.paginationIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                      </button>
                    </nav>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Fee Modal */}
        {showCreateModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalInnerPadding}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Add New Monthly Fee</h3>
                  <button onClick={() => { if(!loading) {setShowCreateModal(false); resetForm();} }} style={styles.modalCloseButton} disabled={loading}>
                    <svg style={styles.modalCloseButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <FeeFormFields formData={formData} handleChange={handleFormChange} errors={errors} />
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => { if(!loading) {setShowCreateModal(false); resetForm(); }}} style={{...styles.button, ...styles.buttonSecondary, ...(loading && {opacity: 0.7, cursor: 'not-allowed'})}} disabled={loading}>Cancel</button>
                  <button type="button" onClick={handleAddFee} style={{...styles.button, ...styles.buttonPrimary, ...(isCreateModalButtonHovered && styles.buttonPrimaryHover), ...(loading && {backgroundColor: colors.primaryDark, cursor: 'not-allowed'})}} onMouseEnter={() => setIsCreateModalButtonHovered(true)} onMouseLeave={() => setIsCreateModalButtonHovered(false)} disabled={loading}>
                    {loading ? 'Adding...' : 'Add Fee'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Fee Modal */}
        {showEditModal && selectedFee && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalInnerPadding}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Edit Monthly Fee</h3>
                  <button onClick={() => { if(!loading) {setShowEditModal(false); resetForm();} }} style={styles.modalCloseButton} disabled={loading}>
                    <svg style={styles.modalCloseButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <FeeFormFields formData={formData} handleChange={handleFormChange} errors={errors} />
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => { if(!loading) {setShowEditModal(false); resetForm(); }}} style={{...styles.button, ...styles.buttonSecondary, ...(loading && {opacity: 0.7, cursor: 'not-allowed'})}} disabled={loading}>Cancel</button>
                  <button type="button" onClick={handleUpdateFee} style={{...styles.button, ...styles.buttonPrimary, ...(isUpdateModalButtonHovered && styles.buttonPrimaryHover), ...(loading && {backgroundColor: colors.primaryDark, cursor: 'not-allowed'})}} onMouseEnter={() => setIsUpdateModalButtonHovered(true)} onMouseLeave={() => setIsUpdateModalButtonHovered(false)} disabled={loading}>
                    {loading ? 'Updating...' : 'Update Fee'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MonthlyFeesManagementAUD;