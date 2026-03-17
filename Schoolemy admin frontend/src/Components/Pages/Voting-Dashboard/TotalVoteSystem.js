import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../Utils/api'; 

const TotalVoteSystem = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [polls, setPolls] = useState([]);
  const [activePolls, setActivePolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStatistics(),
        fetchPolls(),
        fetchActivePolls()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array for useCallback

  useEffect(() => {
    // Get user info from localStorage - checking both formats
    const userInfo = localStorage.getItem('userInfo');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const _id = localStorage.getItem('_id');
    
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (error) {
        console.error('Error parsing userInfo:', error);
      }
    } else if (role && name) {
      // Use individual localStorage keys
      setUser({
        role: role,
        name: name,
        _id: _id,
        id: _id
      });
    }
    
    fetchAllData();
  }, [fetchAllData]); // Include fetchAllData in dependency array

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        '/statistics',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchPolls = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        '/polls',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setPolls(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };

  const fetchActivePolls = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        '/active-polls',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setActivePolls(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching active polls:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      case 'draft': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'completed': return '✅';
      case 'draft': return '📝';
      case 'cancelled': return '❌';
      default: return '⚪';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const StatCard = ({ title, value, icon, color, description }) => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: `2px solid ${color}20`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: color
      }}></div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            margin: 0,
            lineHeight: 1
          }}>
            {value}
          </h3>
          <p style={{
            color: '#6b7280',
            margin: '0.25rem 0 0 0',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            {title}
          </p>
        </div>
        <div style={{
          fontSize: '2rem',
          color: color
        }}>
          {icon}
        </div>
      </div>
      
      {description && (
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          margin: 0,
          lineHeight: 1.4
        }}>
          {description}
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading system overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/schoolemy/vote')}
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            ← Back to Dashboard
          </button>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                Total Vote System
              </h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                Complete overview and management of the BOS voting system
              </p>
            </div>
            
            {user?.role === 'boscontroller' && (
              <button
                onClick={() => navigate('/schoolemy/create')}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'
                }}
              >
                🗳️ Create New Poll
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'active', label: '🟢 Active Polls', icon: '🟢' },
            { id: 'history', label: '📜 Poll History', icon: '📜' },
            { id: 'analytics', label: '📈 Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                background: selectedTab === tab.id ? '#3b82f6' : 'transparent',
                color: selectedTab === tab.id ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Statistics Cards */}
            {statistics && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                <StatCard
                  title="Total Polls"
                  value={statistics.total_polls}
                  icon="📊"
                  color="#3b82f6"
                  description="All polls created in the system"
                />
                <StatCard
                  title="Active Polls"
                  value={statistics.active_polls}
                  icon="🟢"
                  color="#10b981"
                  description="Currently accepting votes"
                />
                <StatCard
                  title="Completed Polls"
                  value={statistics.completed_polls}
                  icon="✅"
                  color="#6b7280"
                  description="Finished polls with results"
                />
                <StatCard
                  title="Your Active Votes"
                  value={activePolls.filter(poll => poll.can_vote).length}
                  icon="🗳️"
                  color="#8b5cf6"
                  description="Polls you can vote on now"
                />
              </div>
            )}

            {/* Quick Actions */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1.5rem'
              }}>
                🚀 Quick Actions
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                <button
                  onClick={() => navigate('/schoolemy/polling')}
                  style={{
                    padding: '1.5rem',
                    background: '#f0f9ff',
                    border: '2px solid #3b82f6',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                    View Polling System
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    See all polls and cast your votes
                  </div>
                </button>

                <button
                  onClick={() => navigate('/schoolemy/results')}
                  style={{
                    padding: '1.5rem',
                    background: '#f0fdf4',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                    View Results
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Check detailed voting results
                  </div>
                </button>

                {user?.role === 'boscontroller' && (
                  <button
                    onClick={() => navigate('/schoolemy/create')}
                    style={{
                      padding: '1.5rem',
                      background: '#fefce8',
                      border: '2px solid #f59e0b',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗳️</div>
                    <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                      Create New Poll
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Set up a new voting poll
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'active' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1.5rem'
            }}>
              🟢 Active Polls
            </h3>
            
            {activePolls.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗳️</div>
                <h4 style={{ marginBottom: '0.5rem' }}>No Active Polls</h4>
                <p>There are no active polls at the moment.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {activePolls.map((poll) => (
                  <div key={poll.poll_id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    background: '#f9fafb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          color: '#1e293b',
                          marginBottom: '0.5rem',
                          fontWeight: '600'
                        }}>
                          {poll.title}
                        </h4>
                        <p style={{
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem'
                        }}>
                          {poll.description?.substring(0, 100)}...
                        </p>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          Ends: {formatDate(poll.end_date)}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        alignItems: 'flex-end'
                      }}>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          background: poll.user_has_voted ? '#dcfce7' : '#fef3c7',
                          color: poll.user_has_voted ? '#166534' : '#92400e',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {poll.user_has_voted ? '✅ Voted' : '⏳ Pending'}
                        </div>
                        
                        {poll.can_vote && (
                          <button
                            onClick={() => navigate('/schoolemy/polling')}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.5rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            Vote Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'history' && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1.5rem'
            }}>
              📜 Poll History
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Poll</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Votes</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {polls.map((poll, index) => (
                    <tr key={poll.poll_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      background: index % 2 === 0 ? 'white' : '#f9fafb'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {poll.title}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {poll.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          background: `${getStatusColor(poll.status)}20`,
                          color: getStatusColor(poll.status)
                        }}>
                          {getStatusIcon(poll.status)} {poll.status}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {poll.total_votes || 0}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {formatDate(poll.start_date)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => navigate('/schoolemy/results', { state: { pollId: poll.poll_id } })}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && statistics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Status Breakdown */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1.5rem'
              }}>
                📈 System Analytics
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {statistics.status_breakdown?.map((status, index) => (
                  <div key={index} style={{
                    padding: '1.5rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: getStatusColor(status._id),
                      marginBottom: '0.5rem'
                    }}>
                      {status.count}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      textTransform: 'capitalize',
                      marginBottom: '0.25rem'
                    }}>
                      {status._id} Polls
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}>
                      {status.total_votes} total votes
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Participation Summary */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                👥 Your Participation
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem'
              }}>
                <div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#3b82f6'
                  }}>
                    {activePolls.filter(poll => poll.user_has_voted).length}
                  </div>
                  <div style={{ color: '#6b7280' }}>Polls You've Voted On</div>
                </div>
                
                <div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#f59e0b'
                  }}>
                    {activePolls.filter(poll => poll.can_vote).length}
                  </div>
                  <div style={{ color: '#6b7280' }}>Pending Votes</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TotalVoteSystem;
