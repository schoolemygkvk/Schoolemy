import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../Utils/api';
import { hasStoredSession } from '../../../../Utils/security';
import { FaArrowLeft } from 'react-icons/fa';

const TutorList = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTutors: 0,
    limit: 9,
  });

  const [filters, setFilters] = useState({
    subject: '',
    qualification: '',
    search: '',
    page: 1,
    limit: 9,
  });

  const fetchTutors = useCallback(async () => {
    if (!hasStoredSession()) {
      setError('Your session has expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.get('/all-tutors', {
        params: filters,
      });

      if (response.data?.success) {
        setTutors(response.data.data.tutors || []);
        setPagination(response.data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalTutors: 0,
          limit: 9,
        });
      } else {
        setTutors([]);
        setError('Failed to fetch tutors.');
      }
    } catch (err) {
      console.error('Error fetching tutors:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication failed. Please login again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch tutors. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({
      ...prev,
      limit: parseInt(newLimit, 10),
      page: 1,
    }));
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTutor(null);
  };

  const handleViewImage = (imageData, title = 'Image') => {
    setSelectedImage({ src: imageData, title });
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : 'N/A';

  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'active';
      case 'expired':
        return 'expired';
      case 'pending':
        return 'pending';
      default:
        return 'default';
    }
  };

  // Get image source from base64 or URL
  const getImageSrc = (imageData) => {
    if (!imageData) return null;
    if (imageData.startsWith('data:image')) {
      return imageData;
    }
    if (imageData.startsWith('http')) {
      return imageData;
    }
    return null;
  };

  // Download image
  const downloadImage = (imageData, fileName) => {
    if (!imageData) return;
    
    const link = document.createElement('a');
    link.href = imageData;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Styles
  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      margin: '0 0 5px 0',
      color: '#333',
      fontSize: '28px',
    },
    subtitle: {
      margin: 0,
      color: '#666',
      fontSize: '14px',
    },
    totalTutors: {
      backgroundColor: '#007bff',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    filtersSection: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      backgroundColor: 'white',
      padding: '15px',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    filterLabel: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#555',
    },
    filterSelect: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontSize: '14px',
      minWidth: '150px',
    },
    searchInput: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontSize: '14px',
      minWidth: '200px',
    },
    refreshBtn: {
      padding: '8px 16px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      marginTop: '18px',
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '12px',
      borderRadius: '5px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    retryBtn: {
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      padding: '5px 10px',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '12px',
    },
    tutorsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    tutorCard: {
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer',
    },
    cardHeader: {
      padding: '20px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    avatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: '#007bff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '20px',
      fontWeight: 'bold',
      overflow: 'hidden',
      cursor: 'pointer',
    },
    avatarImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    tutorInfo: {
      flex: 1,
    },
    tutorName: {
      margin: '0 0 5px 0',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333',
    },
    tutorId: {
      margin: 0,
      fontSize: '12px',
      color: '#666',
      fontFamily: 'monospace',
    },
    cardBody: {
      padding: '20px',
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px',
      fontSize: '14px',
    },
    infoLabel: {
      color: '#666',
      fontWeight: 'bold',
    },
    infoValue: {
      color: '#333',
    },
    qualification: {
      backgroundColor: '#e9ecef',
      padding: '4px 8px',
      borderRadius: '3px',
      fontSize: '12px',
      color: '#495057',
      marginBottom: '10px',
      display: 'inline-block',
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'capitalize',
    },
    statusActive: {
      backgroundColor: '#d4edda',
      color: '#155724',
    },
    statusExpired: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
    },
    statusPending: {
      backgroundColor: '#fff3cd',
      color: '#856404',
    },
    statusDefault: {
      backgroundColor: '#e2e3e5',
      color: '#383d41',
    },
    countBadge: {
      backgroundColor: '#007bff',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '12px',
      fontWeight: 'bold',
    },
    cardFooter: {
      padding: '15px 20px',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
    },
    actionBtn: {
      padding: '8px 12px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold',
      transition: 'background-color 0.2s ease',
    },
    viewBtn: {
      backgroundColor: '#17a2b8',
      color: 'white',
    },
    editBtn: {
      backgroundColor: '#ffc107',
      color: '#212529',
    },
    coursesBtn: {
      backgroundColor: '#28a745',
      color: 'white',
    },
    // Modal Styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '15px',
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    },
    modalHeader: {
      padding: '20px 30px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderTopLeftRadius: '15px',
      borderTopRightRadius: '15px',
    },
    modalTitle: {
      margin: 0,
      fontSize: '24px',
      color: '#333',
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#666',
      padding: '5px',
    },
    modalBody: {
      padding: '30px',
    },
    tutorProfile: {
      display: 'flex',
      gap: '30px',
      marginBottom: '30px',
    },
    profileImageSection: {
      flex: '0 0 200px',
      textAlign: 'center',
    },
    profileImage: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '5px solid #f8f9fa',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    },
    profileDefaultImage: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      backgroundColor: '#007bff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '60px',
      fontWeight: 'bold',
      border: '5px solid #f8f9fa',
    },
    profileDetails: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333',
      margin: '0 0 15px 0',
      paddingBottom: '10px',
      borderBottom: '2px solid #007bff',
    },
    detailsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px',
      marginBottom: '25px',
    },
    detailItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    detailLabel: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#666',
      textTransform: 'uppercase',
    },
    detailValue: {
      fontSize: '14px',
      color: '#333',
      fontWeight: '500',
    },
    addressSection: {
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '25px',
    },
    govtIdSection: {
      marginBottom: '25px',
    },
    govtIdGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
    },
    govtIdCard: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
    },
    documentImage: {
      width: '100%',
      height: '150px',
      objectFit: 'cover',
      borderRadius: '5px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    },
    downloadBtn: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '5px 10px',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '12px',
      marginTop: '5px',
      marginRight: '5px',
    },
    viewBtnSmall: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      padding: '5px 10px',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '12px',
      marginTop: '5px',
    },
    loginHistorySection: {
      marginBottom: '25px',
    },
    loginHistoryTable: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      backgroundColor: '#f8f9fa',
      borderBottom: '2px solid #dee2e6',
    },
    tableHeaderCell: {
      padding: '12px',
      textAlign: 'left',
      fontWeight: 'bold',
      color: '#333',
    },
    tableCell: {
      padding: '12px',
      borderBottom: '1px solid #dee2e6',
    },
    // Full Size Image Modal Styles
    imageModalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
    },
    imageModalContent: {
      position: 'relative',
      maxWidth: '90vw',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    fullSizeImage: {
      maxWidth: '100%',
      maxHeight: '80vh',
      objectFit: 'contain',
      borderRadius: '8px',
    },
    imageModalHeader: {
      position: 'absolute',
      top: '10px',
      left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      color: 'white',
    },
    imageTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: 'bold',
      color: 'white',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
    imageCloseBtn: {
      background: 'rgba(0,0,0,0.5)',
      border: 'none',
      color: 'white',
      fontSize: '30px',
      cursor: 'pointer',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageModalFooter: {
      marginTop: '15px',
      display: 'flex',
      gap: '10px',
    },
    zoomControls: {
      display: 'flex',
      gap: '10px',
      marginTop: '10px',
    },
    zoomBtn: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '30px',
      flexWrap: 'wrap',
    },
    paginationBtn: {
      padding: '8px 16px',
      border: '1px solid #ddd',
      backgroundColor: 'white',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    paginationBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    paginationInfo: {
      margin: '0 15px',
      color: '#666',
      fontSize: '14px',
    },
    pageNumbers: {
      display: 'flex',
      gap: '5px',
    },
    pageBtn: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      backgroundColor: 'white',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      minWidth: '40px',
    },
    pageBtnActive: {
      backgroundColor: '#007bff',
      color: 'white',
      borderColor: '#007bff',
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255,255,255,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    loadingSpinner: {
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #007bff',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite',
    },
    noData: {
      textAlign: 'center',
      padding: '40px',
      color: '#666',
      fontSize: '16px',
      gridColumn: '1 / -1',
    },
  };

  // Add CSS animation for spinner
  const spinnerStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={styles.container}>
      <style>{spinnerStyle}</style>
      
      {/* Back Button */}
      <button
        onClick={() => navigate('/schoolemy/tutor-data-management')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '20px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0056b3';
          e.currentTarget.style.transform = 'translateX(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#007bff';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <FaArrowLeft /> Back to Tutor Dashboard
      </button>
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Tutor Course Management</h1>
          <p style={styles.subtitle}>Manage and view all tutors in the system</p>
        </div>
        <div style={styles.totalTutors}>
          Total: {pagination.totalTutors} tutors
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Subject:</label>
          <input
            type="text"
            placeholder="Search by subject..."
            value={filters.subject}
            onChange={(e) => handleFilterChange('subject', e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Qualification:</label>
          <input
            type="text"
            placeholder="Search by qualification..."
            value={filters.qualification}
            onChange={(e) => handleFilterChange('qualification', e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Search:</label>
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Items per page:</label>
          <select
            value={filters.limit}
            onChange={(e) => handleLimitChange(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="9">9</option>
            <option value="12">12</option>
            <option value="18">18</option>
            <option value="24">24</option>
          </select>
        </div>

        <button onClick={fetchTutors} style={styles.refreshBtn} title="Refresh data">
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={styles.errorMessage}>
          <span>{error}</span>
          <button onClick={fetchTutors} style={styles.retryBtn}>
            Try Again
          </button>
        </div>
      )}

      {/* Tutors Grid */}
      <div style={styles.tutorsGrid}>
        {tutors.length === 0 ? (
          <div style={styles.noData}>
            {loading ? 'Loading tutors...' : 'No tutors found matching your criteria'}
          </div>
        ) : (
          tutors.map((tutor) => {
            const imageSrc = getImageSrc(tutor.profilePictureUpload);
            return (
              <div 
                key={tutor._id} 
                style={styles.tutorCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              >
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div 
                    style={styles.avatar}
                    onClick={() => imageSrc && handleViewImage(imageSrc, `${tutor.name}'s Profile Picture`)}
                  >
                    {imageSrc ? (
                      <img 
                        src={imageSrc} 
                        alt={tutor.name} 
                        style={styles.avatarImg}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{tutor.name?.charAt(0)?.toUpperCase() || 'T'}</span>
                    )}
                  </div>
                  <div style={styles.tutorInfo}>
                    <h3 style={styles.tutorName}>{tutor.name}</h3>
                    <p style={styles.tutorId}>ID: {tutor.tutorId}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Email:</span>
                    <a 
                      href={`mailto:${tutor.email}`} 
                      style={{...styles.infoValue, textDecoration: 'none', color: '#007bff'}}
                    >
                      {tutor.email}
                    </a>
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Mobile:</span>
                    <span style={styles.infoValue}>{tutor.mobilenumber || 'N/A'}</span>
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Subject:</span>
                    <span style={styles.infoValue}>{tutor.subject || 'N/A'}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div style={styles.cardFooter}>
                  <button 
                    style={{...styles.actionBtn, ...styles.coursesBtn}}
                    onClick={() => navigate(`/schoolemy/tutor-courses/${encodeURIComponent(tutor.name)}`)}
                    title="View Courses"
                  >
                    Courses
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tutor Details Modal */}
      {showModal && selectedTutor && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Tutor Details</h2>
              <button style={styles.closeBtn} onClick={closeModal}>
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={styles.modalBody}>
              {/* Profile Section */}
              <div style={styles.tutorProfile}>
                <div style={styles.profileImageSection}>
                  {getImageSrc(selectedTutor.profilePictureUpload) ? (
                    <img
                      src={getImageSrc(selectedTutor.profilePictureUpload)}
                      alt={selectedTutor.name}
                      style={styles.profileImage}
                      onClick={() => handleViewImage(
                        getImageSrc(selectedTutor.profilePictureUpload), 
                        `${selectedTutor.name}'s Profile Picture`
                      )}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                  ) : (
                    <div style={styles.profileDefaultImage}>
                      {selectedTutor.name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                  )}
                  <h3 style={{margin: '10px 0 5px 0', color: '#333'}}>
                    {selectedTutor.name}
                  </h3>
                  <p style={{margin: 0, color: '#666', fontSize: '14px'}}>
                    {selectedTutor.tutorId}
                  </p>
                </div>

                <div style={styles.profileDetails}>
                  <h3 style={styles.sectionTitle}>Personal Information</h3>
                  <div style={styles.detailsGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Email</span>
                      <span style={styles.detailValue}>{selectedTutor.email}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Mobile Number</span>
                      <span style={styles.detailValue}>{selectedTutor.mobilenumber}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Age</span>
                      <span style={styles.detailValue}>{selectedTutor.age || 'N/A'}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Gender</span>
                      <span style={styles.detailValue}>
                        {selectedTutor.gender ? selectedTutor.gender.charAt(0).toUpperCase() + selectedTutor.gender.slice(1) : 'N/A'}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Qualification</span>
                      <span style={styles.detailValue}>{selectedTutor.qualification || 'N/A'}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Subject</span>
                      <span style={styles.detailValue}>{selectedTutor.subject || 'N/A'}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Experience</span>
                      <span style={styles.detailValue}>{selectedTutor.experience || 'N/A'}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Subscription Status</span>
                      <span 
                        style={{
                          ...styles.statusBadge,
                          ...styles[`status${getStatusClass(selectedTutor.subscriptionStatus).charAt(0).toUpperCase() + getStatusClass(selectedTutor.subscriptionStatus).slice(1)}`]
                        }}
                      >
                        {selectedTutor.subscriptionStatus}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Subscription Expiry</span>
                      <span style={styles.detailValue}>
                        {selectedTutor.subscriptionExpiryDate ? formatDate(selectedTutor.subscriptionExpiryDate) : 'N/A'}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Total Courses</span>
                      <span style={styles.detailValue}>{selectedTutor.totalCoursesUploaded || 0}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Approval Status</span>
                      <span style={styles.detailValue}>
                        {selectedTutor.isApproved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </div>
                  </div>

                  {/* Address Section */}
                  {selectedTutor.address && (
                    <div style={styles.addressSection}>
                      <h3 style={styles.sectionTitle}>Address</h3>
                      <div style={styles.detailsGrid}>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Street</span>
                          <span style={styles.detailValue}>{selectedTutor.address.street || 'N/A'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>City</span>
                          <span style={styles.detailValue}>{selectedTutor.address.city || 'N/A'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>State</span>
                          <span style={styles.detailValue}>{selectedTutor.address.state || 'N/A'}</span>
                        </div>
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Zip Code</span>
                          <span style={styles.detailValue}>{selectedTutor.address.zipCode || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Government ID Proofs */}
                  {selectedTutor.govtIdProofs && selectedTutor.govtIdProofs.length > 0 && (
                    <div style={styles.govtIdSection}>
                      <h3 style={styles.sectionTitle}>Government ID Proofs</h3>
                      <div style={styles.govtIdGrid}>
                        {selectedTutor.govtIdProofs.map((idProof, index) => (
                          <div key={index} style={styles.govtIdCard}>
                            <div style={styles.detailItem}>
                              <span style={styles.detailLabel}>ID Type</span>
                              <span style={styles.detailValue}>{idProof.idType}</span>
                            </div>
                            <div style={styles.detailItem}>
                              <span style={styles.detailLabel}>ID Number</span>
                              <span style={styles.detailValue}>{idProof.idNumber}</span>
                            </div>
                            {idProof.documentImage && (
                              <>
                                <img
                                  src={getImageSrc(idProof.documentImage)}
                                  alt={`${idProof.idType} Document`}
                                  style={styles.documentImage}
                                  onClick={() => handleViewImage(
                                    getImageSrc(idProof.documentImage), 
                                    `${idProof.idType} - ${idProof.idNumber}`
                                  )}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                  }}
                                />
                                <div>
                                  <button
                                    style={styles.downloadBtn}
                                    onClick={() => downloadImage(getImageSrc(idProof.documentImage), `${idProof.idType}_${idProof.idNumber}`)}
                                  >
                                    Download
                                  </button>
                                  <button
                                    style={styles.viewBtnSmall}
                                    onClick={() => handleViewImage(
                                      getImageSrc(idProof.documentImage), 
                                      `${idProof.idType} - ${idProof.idNumber}`
                                    )}
                                  >
                                    View Full Size
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Login History */}
                  {selectedTutor.loginHistory && selectedTutor.loginHistory.length > 0 && (
                    <div style={styles.loginHistorySection}>
                      <h3 style={styles.sectionTitle}>Login History (Last 5 Sessions)</h3>
                      <table style={styles.loginHistoryTable}>
                        <thead style={styles.tableHeader}>
                          <tr>
                            <th style={styles.tableHeaderCell}>Login Time</th>
                            <th style={styles.tableHeaderCell}>IP Address</th>
                            <th style={styles.tableHeaderCell}>Logout Time</th>
                            <th style={styles.tableHeaderCell}>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTutor.loginHistory.slice(0, 5).map((login, index) => (
                            <tr key={index}>
                              <td style={styles.tableCell}>{formatDate(login.loginTime)}</td>
                              <td style={styles.tableCell}>{login.ipAddress || 'N/A'}</td>
                              <td style={styles.tableCell}>{login.logoutTime ? formatDate(login.logoutTime) : 'N/A'}</td>
                              <td style={styles.tableCell}>
                                {login.sessionDuration ? `${Math.round(login.sessionDuration / 60000)} mins` : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Size Image Modal */}
      {showImageModal && selectedImage && (
        <div style={styles.imageModalOverlay} onClick={closeImageModal}>
          <div style={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.imageModalHeader}>
              <h3 style={styles.imageTitle}>{selectedImage.title}</h3>
              <button style={styles.imageCloseBtn} onClick={closeImageModal}>
                ×
              </button>
            </div>
            <img
              src={selectedImage.src}
              alt={selectedImage.title}
              style={styles.fullSizeImage}
            />
            <div style={styles.imageModalFooter}>
              <button
                style={styles.downloadBtn}
                onClick={() => downloadImage(selectedImage.src, selectedImage.title)}
              >
                Download Image
              </button>
              <button
                style={styles.viewBtnSmall}
                onClick={() => window.open(selectedImage.src, '_blank', 'noopener,noreferrer')}
              >
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{
              ...styles.paginationBtn,
              ...(pagination.currentPage === 1 && styles.paginationBtnDisabled)
            }}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            ← Previous
          </button>

          <div style={styles.paginationInfo}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>

          <div style={styles.pageNumbers}>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  style={{
                    ...styles.pageBtn,
                    ...(pagination.currentPage === pageNum && styles.pageBtnActive)
                  }}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            style={{
              ...styles.paginationBtn,
              ...(pagination.currentPage === pagination.totalPages && styles.paginationBtnDisabled)
            }}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && tutors.length > 0 && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingSpinner}></div>
        </div>
      )}
    </div>
  );
};

export default TutorList;