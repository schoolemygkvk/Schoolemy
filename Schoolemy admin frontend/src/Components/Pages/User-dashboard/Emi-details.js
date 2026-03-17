import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";

const ViewEMIPlans = () => {
  const navigate = useNavigate();
  const [emiPlans, setEmiPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    studentName: true,
    courseName: true,
    registerNumber: true,
    status: true
  });

  useEffect(() => {
    const fetchEMIPlans = async () => {
      try {
        const res = await axios.get("/emi-plans");
        const plans = res.data.data;
        
        // Calculate proper status for each EMI based on due date
        const updatedPlans = plans.map(plan => ({
          ...plan,
          emis: plan.emis.map(emi => {
            const currentDate = new Date();
            const dueDate = new Date(emi.dueDate);
            currentDate.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            
            // Check if overdue first (most important)
            const isOverdue = dueDate < currentDate && emi.status.toLowerCase() !== 'paid';
            
            // Determine proper status
            let actualStatus = emi.status.toLowerCase();
            if (actualStatus === 'paid') {
              actualStatus = 'paid';
            } else if (isOverdue) {
              actualStatus = 'overdue';
            } else if (actualStatus === 'pending' || actualStatus === 'due' || actualStatus === 'unpaid') {
              actualStatus = 'pending';
            } else {
              actualStatus = 'pending'; // Default to pending for unknown statuses
            }
            
            return {
              ...emi,
              actualStatus,
              isOverdue: isOverdue
            };
          })
        }));
        
        setEmiPlans(updatedPlans);
        setFilteredPlans(updatedPlans);
      } catch (error) {
        console.error("Error fetching EMI Plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEMIPlans();
  }, []);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredPlans(emiPlans);
      return;
    }

    const filtered = emiPlans.filter(plan => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      const matches = [];
      if (searchFilters.studentName) {
        matches.push(plan.username.toLowerCase().includes(lowerSearchTerm));
      }
      if (searchFilters.courseName) {
        matches.push(plan.coursename.toLowerCase().includes(lowerSearchTerm));
      }
      if (searchFilters.registerNumber) {
        matches.push(plan.studentRegisterNumber.toLowerCase().includes(lowerSearchTerm));
      }
      if (searchFilters.status) {
        matches.push(plan.status.toLowerCase().includes(lowerSearchTerm));
      }

      return matches.some(match => match);
    });

    setFilteredPlans(filtered);
  }, [searchTerm, emiPlans, searchFilters]);

  const togglePlanExpansion = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const toggleFilter = (filterName) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading EMI Plans...</p>
    </div>
  );

  // Calculate summary statistics
  const totalOverdue = filteredPlans.reduce((count, plan) => 
    count + plan.emis.filter(emi => emi.isOverdue).length, 0
  );
  const totalPending = filteredPlans.reduce((count, plan) => 
    count + plan.emis.filter(emi => emi.actualStatus === 'pending').length, 0
  );
  const totalPaid = filteredPlans.reduce((count, plan) => 
    count + plan.emis.filter(emi => emi.actualStatus === 'paid').length, 0
  );
  const overdueAmount = filteredPlans.reduce((sum, plan) => 
    sum + plan.emis.filter(emi => emi.isOverdue).reduce((s, emi) => s + emi.amount, 0), 0
  );

  return (
    <div style={styles.container}>
      <button 
        style={styles.backButton}
        onClick={() => navigate(-1)}
        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
      >
        ← Back to Dashboard
      </button>
      
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>EMI Payment Plans</h1>
          <p style={styles.subtitle}>View and manage all student installment plans</p>
        </div>
        <div style={styles.searchContainer}>
          <div style={styles.searchBox}>
            <svg style={styles.searchIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
            </svg>
            <input
              type="text"
              placeholder="Search EMI plans..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                style={styles.clearSearchButton}
                onClick={() => setSearchTerm("")}
              >
                <svg viewBox="0 0 24 24" style={styles.clearSearchIcon}>
                  <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </button>
            )}
          </div>
          <div style={styles.filterOptions}>
            <span style={styles.filterLabel}>Search in:</span>
            {Object.keys(searchFilters).map(filter => (
              <label key={filter} style={styles.filterCheckbox}>
                <input
                  type="checkbox"
                  checked={searchFilters[filter]}
                  onChange={() => toggleFilter(filter)}
                  style={styles.hiddenCheckbox}
                />
                <span style={styles.customCheckbox}>
                  {searchFilters[filter] && (
                    <svg viewBox="0 0 24 24" style={styles.checkboxIcon}>
                      <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                    </svg>
                  )}
                </span>
                {filter.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
            ))}
          </div>
        </div>
      </div>

      {totalOverdue > 0 && (
        <div style={styles.alertContainer}>
          <svg style={styles.alertIcon} viewBox="0 0 24 24">
            <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
          </svg>
          <div style={styles.alertContent}>
            <h4 style={styles.alertTitle}>⚠️ Overdue Payments Alert</h4>
            <p style={styles.alertText}>
              There are <strong>{totalOverdue}</strong> overdue EMI payment(s) totaling <strong>₹{overdueAmount.toLocaleString('en-IN')}</strong> that have crossed their due dates.
            </p>
          </div>
        </div>
      )}

      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon} className="overdue">
            <svg viewBox="0 0 24 24" style={styles.summaryIconSvg}>
              <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
          </div>
          <div style={styles.summaryInfo}>
            <div style={styles.summaryValue}>{totalOverdue}</div>
            <div style={styles.summaryLabel}>Overdue</div>
            <div style={styles.summaryAmount}>₹{overdueAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon} className="pending">
            <svg viewBox="0 0 24 24" style={styles.summaryIconSvg}>
              <path fill="currentColor" d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
            </svg>
          </div>
          <div style={styles.summaryInfo}>
            <div style={styles.summaryValue}>{totalPending}</div>
            <div style={styles.summaryLabel}>Pending</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon} className="paid">
            <svg viewBox="0 0 24 24" style={styles.summaryIconSvg}>
              <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
            </svg>
          </div>
          <div style={styles.summaryInfo}>
            <div style={styles.summaryValue}>{totalPaid}</div>
            <div style={styles.summaryLabel}>Paid</div>
          </div>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div style={styles.emptyState}>
          <svg style={styles.emptyIcon} viewBox="0 0 24 24">
            <path fill="currentColor" d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19M7,7H9V9H7V7M7,11H9V13H7V11M7,15H9V17H7V15M17,17H11V15H17V17M17,13H11V11H17V13M17,9H11V7H17V9Z" />
          </svg>
          <h3 style={styles.emptyTitle}>
            {searchTerm ? "No matching EMI plans found" : "No EMI plans found"}
          </h3>
          <p style={styles.emptyText}>
            {searchTerm 
              ? "Try adjusting your search or filters"
              : "There are currently no active EMI payment plans."}
          </p>
          {searchTerm && (
            <button 
              style={styles.resetSearchButton}
              onClick={() => {
                setSearchTerm("");
                setSearchFilters({
                  studentName: true,
                  courseName: true,
                  registerNumber: true,
                  status: true
                });
              }}
            >
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <div style={styles.plansContainer}>
          <div style={styles.resultsInfo}>
            Showing {filteredPlans.length} of {emiPlans.length} plans
            {searchTerm && (
              <span style={styles.searchQuery}>
                for "<strong>{searchTerm}</strong>"
              </span>
            )}
          </div>
          
          {filteredPlans.map((plan) => {
            const hasOverdue = plan.emis.some(emi => emi.isOverdue);
            
            return (
            <div 
              key={plan._id}
              style={{
                ...styles.planCard,
                borderLeft: `4px solid ${hasOverdue ? '#D32F2F' : getStatusColor(plan.status)}`,
                backgroundColor: hasOverdue ? '#FFF3E0' : '#fff'
              }}
            >
              <div 
                style={styles.planHeader}
                onClick={() => togglePlanExpansion(plan._id)}
              >
                <div style={styles.planTitle}>
                  <h3 style={{
                    ...styles.courseName,
                    color: hasOverdue ? '#D32F2F' : '#2c3e50',
                    fontWeight: hasOverdue ? '700' : '600',
                    textDecoration: hasOverdue ? 'underline' : 'none',
                    textDecorationColor: hasOverdue ? '#D32F2F' : 'transparent',
                    textDecorationThickness: '2px'
                  }}>
                    {hasOverdue && '⚠️ '}
                    {plan.coursename}
                  </h3>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: hasOverdue ? '#D32F2F' : getStatusColor(plan.status)
                  }}>
                    {hasOverdue ? 'HAS OVERDUE' : plan.status}
                  </span>
                </div>
                <div style={styles.studentInfo}>
                  <p style={styles.infoItem}>
                    <span style={styles.infoLabel}>Student:</span>
                    <span style={{
                      fontWeight: hasOverdue ? '700' : 'normal',
                      color: hasOverdue ? '#D32F2F' : 'inherit',
                      padding: hasOverdue ? '0.25rem 0.5rem' : '0',
                      backgroundColor: hasOverdue ? '#FFEBEE' : 'transparent',
                      borderRadius: hasOverdue ? '4px' : '0'
                    }}>
                      {plan.username}
                    </span> ({plan.studentRegisterNumber})
                  </p>
                  <p style={styles.infoItem}>
                    <span style={styles.infoLabel}>Amount:</span>
                    ₹{plan.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <svg 
                  style={{
                    ...styles.expandIcon,
                    transform: expandedPlan === plan._id ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} 
                  viewBox="0 0 24 24"
                >
                  <path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
                </svg>
              </div>

              {expandedPlan === plan._id && (
                <div style={styles.planDetails}>
                  <div style={styles.detailGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Email</span>
                      <span style={styles.detailValue}>{plan.email}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Mobile</span>
                      <span style={styles.detailValue}>{plan.mobile}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Start Date</span>
                      <span style={styles.detailValue}>
                        {new Date(plan.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <h4 style={styles.scheduleTitle}>Payment Schedule</h4>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr>
                          <th style={styles.tableHeaderCell}>Month</th>
                          <th style={styles.tableHeaderCell}>Due Date</th>
                          <th style={styles.tableHeaderCell}>Amount</th>
                          <th style={styles.tableHeaderCell}>Status</th>
                          <th style={styles.tableHeaderCell}>Paid On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.emis.map((emi, idx) => (
                          <tr key={idx} style={{
                            ...styles.tableRow,
                            backgroundColor: emi.isOverdue ? '#FFF3E0' : 'transparent'
                          }}>
                            <td style={styles.tableCell}>
                              {emi.isOverdue && (
                                <span style={styles.overdueIndicator} title="Payment Overdue!">
                                  ⚠️
                                </span>
                              )}
                              {emi.month}
                            </td>
                            <td style={{
                              ...styles.tableCell,
                              fontWeight: emi.isOverdue ? '700' : 'normal',
                              color: emi.isOverdue ? '#D32F2F' : '#34495e'
                            }}>
                              {new Date(emi.dueDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                              {emi.isOverdue && (
                                <span style={styles.overdueBadge}>
                                  🔴 OVERDUE
                                </span>
                              )}
                            </td>
                            <td style={styles.tableCell}>
                              ₹{emi.amount.toLocaleString('en-IN')}
                            </td>
                            <td style={styles.tableCell}>
                              <span style={{
                                ...styles.emiStatus,
                                backgroundColor: emi.isOverdue ? '#FFEBEE' : getEmiStatusColor(emi.actualStatus),
                                color: emi.isOverdue ? '#C62828' : '#333',
                                fontWeight: emi.isOverdue ? '700' : '500',
                                border: emi.isOverdue ? '2px solid #D32F2F' : 'none',
                                padding: emi.isOverdue ? '0.25rem 0.6rem' : '0.25rem 0.5rem'
                              }}>
                                {emi.isOverdue ? '⚠️ OVERDUE' : 
                                 emi.actualStatus === 'pending' ? 'Pending' : 'Paid'}
                              </span>
                            </td>
                            <td style={styles.tableCell}>
                              {emi.paymentDate ? 
                                new Date(emi.paymentDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 
                                '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper functions remain the same
const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'active': return '#4CAF50';
    case 'completed': return '#2196F3';
    case 'overdue': return '#FF9800';
    case 'defaulted': return '#F44336';
    default: return '#9E9E9E';
  }
};

const getEmiStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'paid': return '#E8F5E9';
    case 'overdue': return '#FFEBEE';
    case 'pending': return '#FFF8E1';
    case 'due': return '#FFF8E1';
    default: return '#F5F5F5';
  }
};

// Updated styles with search components
const styles = {
  container: {
    padding: '2rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
    color: '#333'
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6e8efb, #a777e3)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(110, 142, 251, 0.3)',
    marginBottom: '1.5rem'
  },
  header: {
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #eee',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    color: '#2c3e50'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#7f8c8d',
    margin: '0'
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  searchBox: {
    position: 'relative',
    maxWidth: '500px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    color: '#95a5a6',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 40px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#3498db',
      boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.1)'
    }
  },
  clearSearchButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: '#f0f0f0'
    }
  },
  clearSearchIcon: {
    width: '18px',
    height: '18px',
    color: '#95a5a6'
  },
  filterOptions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    fontSize: '0.85rem'
  },
  filterLabel: {
    color: '#7f8c8d',
    marginRight: '0.5rem'
  },
  filterCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    userSelect: 'none'
  },
  hiddenCheckbox: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0
  },
  customCheckbox: {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease, border-color 0.2s ease'
  },
  checkboxIcon: {
    width: '14px',
    height: '14px',
    color: '#3498db'
  },
  resultsInfo: {
    fontSize: '0.9rem',
    color: '#7f8c8d',
    marginBottom: '1rem',
    padding: '0.5rem 0',
    borderBottom: '1px solid #eee'
  },
  searchQuery: {
    marginLeft: '0.5rem'
  },
  resetSearchButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#2980b9'
    }
  },
  // ... (keep all other existing styles the same)
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    padding: '2rem'
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeftColor: '#3498db',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  loadingText: {
    fontSize: '1rem',
    color: '#7f8c8d'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px dashed #ddd'
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    color: '#bdc3c7',
    marginBottom: '1rem'
  },
  emptyTitle: {
    fontSize: '1.2rem',
    color: '#7f8c8d',
    margin: '0 0 0.5rem 0'
  },
  emptyText: {
    fontSize: '0.9rem',
    color: '#95a5a6',
    margin: '0'
  },
  plansContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1.5rem'
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease',
    border: '1px solid #eee'
  },
  planHeader: {
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  planTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  courseName: {
    margin: '0',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2c3e50'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  studentInfo: {
    display: 'flex',
    gap: '2rem'
  },
  infoItem: {
    margin: '0',
    fontSize: '0.9rem',
    color: '#7f8c8d'
  },
  infoLabel: {
    fontWeight: '600',
    color: '#34495e',
    marginRight: '0.5rem'
  },
  expandIcon: {
    width: '24px',
    height: '24px',
    color: '#95a5a6',
    transition: 'transform 0.2s ease'
  },
  planDetails: {
    padding: '0 1.5rem 1.5rem 1.5rem',
    borderTop: '1px solid #eee'
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  detailLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#7f8c8d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  detailValue: {
    fontSize: '0.9rem',
    color: '#2c3e50'
  },
  scheduleTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 1rem 0'
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '6px',
    border: '1px solid #eee'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa'
  },
  tableHeaderCell: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#7f8c8d',
    borderBottom: '1px solid #eee'
  },
  tableRow: {
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  tableCell: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #eee',
    color: '#34495e'
  },
  emiStatus: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'inline-block',
    color: '#333',
    whiteSpace: 'nowrap'
  },
  alertContainer: {
    backgroundColor: '#FFF3E0',
    border: '2px solid #FF9800',
    borderRadius: '8px',
    padding: '1rem 1.5rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    animation: 'slideIn 0.3s ease-out'
  },
  alertIcon: {
    width: '24px',
    height: '24px',
    color: '#F57C00',
    flexShrink: 0,
    marginTop: '2px'
  },
  alertContent: {
    flex: 1
  },
  alertTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#E65100'
  },
  alertText: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#E65100',
    lineHeight: '1.5'
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  summaryIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryIconSvg: {
    width: '28px',
    height: '28px',
    color: 'white'
  },
  summaryInfo: {
    flex: 1
  },
  summaryValue: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#2c3e50',
    lineHeight: 1
  },
  summaryLabel: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
    marginTop: '0.25rem'
  },
  summaryAmount: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#e74c3c',
    marginTop: '0.25rem'
  },
  overdueIndicator: {
    marginRight: '0.5rem',
    fontSize: '1rem',
    cursor: 'help'
  },
  overdueBadge: {
    marginLeft: '0.75rem',
    padding: '0.25rem 0.6rem',
    backgroundColor: '#D32F2F',
    color: 'white',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
    display: 'inline-block',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 4px rgba(211, 47, 47, 0.3)'
  }
};

// Add CSS for summary card colors and animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .overdue {
    background: linear-gradient(135deg, #FF6B6B, #EE5A6F);
  }
  
  .pending {
    background: linear-gradient(135deg, #FFA726, #FB8C00);
  }
  
  .paid {
    background: linear-gradient(135deg, #66BB6A, #43A047);
  }
`;
document.head.appendChild(styleSheet);

export default ViewEMIPlans;