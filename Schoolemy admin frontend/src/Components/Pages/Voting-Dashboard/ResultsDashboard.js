import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../../Utils/api'; 

const ResultsDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [pollResults, setPollResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);

  const fetchPolls = useCallback(async () => {
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
        
        // If no specific poll was requested, select the first completed poll
        if (!location.state?.pollId && response.data.data.length > 0) {
          const completedPoll = response.data.data.find(p => p.status === 'completed');
          if (completedPoll) {
            fetchPollResults(completedPoll.poll_id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  }, [location.state]);

  useEffect(() => {
    fetchPolls();
    
    // If pollId is passed via navigation state, auto-select that poll
    if (location.state?.pollId) {
      fetchPollResults(location.state.pollId);
    }
  }, [fetchPolls, location.state]);

  const fetchPollResults = async (pollId) => {
    setResultsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/poll/${pollId}/results`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setPollResults(response.data.data);
        setSelectedPoll(pollId);
      }
    } catch (error) {
      console.error('Error fetching poll results:', error);
      if (error.response?.status === 403) {
        alert('Results are not available yet. Voting is still in progress.');
      }
    } finally {
      setResultsLoading(false);
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
    return new Date(dateString).toLocaleString();
  };

  const getWinningOption = () => {
    if (!pollResults?.results) return null;
    return pollResults.results.reduce((max, option) => 
      option.vote_count > max.vote_count ? option : max
    );
  };

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
          <p style={{ color: '#6b7280' }}>Loading results...</p>
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
          
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '0.5rem'
          }}>
            Results Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
            View detailed voting results and analytics
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '2rem'
        }}>
          {/* Polls List */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            height: 'fit-content'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              📊 Select Poll
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {polls.map((poll) => (
                <button
                  key={poll.poll_id}
                  onClick={() => fetchPollResults(poll.poll_id)}
                  style={{
                    padding: '1rem',
                    background: selectedPoll === poll.poll_id ? '#dbeafe' : 'white',
                    border: selectedPoll === poll.poll_id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    {poll.title}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      color: getStatusColor(poll.status)
                    }}>
                      {getStatusIcon(poll.status)} {poll.status}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      {poll.total_votes || 0} votes
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Results Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {resultsLoading ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                <p style={{ color: '#6b7280' }}>Loading results...</p>
              </div>
            ) : pollResults ? (
              <>
                {/* Poll Information */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        marginBottom: '0.5rem'
                      }}>
                        {pollResults.title}
                      </h2>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        background: `${getStatusColor(pollResults.status)}20`,
                        color: getStatusColor(pollResults.status)
                      }}>
                        {getStatusIcon(pollResults.status)} {pollResults.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div style={{
                      background: '#f3f4f6',
                      borderRadius: '12px',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#1e293b'
                      }}>
                        {pollResults.total_votes}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        Total Votes
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    <div>
                      📅 <strong>Started:</strong> {formatDate(pollResults.voting_period.start_date)}
                    </div>
                    <div>
                      🏁 <strong>Ended:</strong> {formatDate(pollResults.voting_period.end_date)}
                    </div>
                    <div>
                      👤 <strong>Created by:</strong> {pollResults.created_by.name}
                    </div>
                    <div>
                      🎯 <strong>Role:</strong> {pollResults.created_by.role}
                    </div>
                  </div>
                </div>

                {/* Results Visualization */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    marginBottom: '1.5rem'
                  }}>
                    📈 Voting Results
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pollResults.results?.map((result, index) => {
                      const isWinner = getWinningOption()?.option === result.option;
                      return (
                        <div key={index} style={{
                          border: isWinner ? '2px solid #10b981' : '1px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          background: isWinner ? '#f0fdf4' : '#f9fafb'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              {isWinner && <span style={{ fontSize: '1.25rem' }}>🏆</span>}
                              <span style={{
                                fontWeight: '600',
                                color: '#1e293b',
                                fontSize: '1.1rem'
                              }}>
                                {result.option}
                              </span>
                            </div>
                            
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem'
                            }}>
                              <span style={{
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                color: '#1e293b'
                              }}>
                                {result.vote_count} votes
                              </span>
                              <span style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: isWinner ? '#10b981' : '#6b7280'
                              }}>
                                {result.percentage}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div style={{
                            background: '#e5e7eb',
                            borderRadius: '8px',
                            height: '12px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              background: isWinner ? '#10b981' : '#3b82f6',
                              height: '100%',
                              width: `${result.percentage}%`,
                              transition: 'width 0.5s ease',
                              borderRadius: '8px'
                            }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Votes (if not anonymous) */}
                {pollResults.votes && pollResults.votes.length > 0 && (
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      marginBottom: '1.5rem'
                    }}>
                      👥 Individual Votes
                    </h3>
                    
                    <div style={{
                      display: 'grid',
                      gap: '0.75rem'
                    }}>
                      {pollResults.votes.map((vote, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div>
                            <div style={{
                              fontWeight: '600',
                              color: '#1e293b'
                            }}>
                              {vote.voter_name}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#6b7280'
                            }}>
                              {vote.voter_role} • {formatDate(vote.voted_at)}
                            </div>
                            {vote.comment && (
                              <div style={{
                                fontSize: '0.875rem',
                                color: '#374151',
                                marginTop: '0.25rem',
                                fontStyle: 'italic'
                              }}>
                                "{vote.comment}"
                              </div>
                            )}
                          </div>
                          
                          <div style={{
                            padding: '0.5rem 1rem',
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            {vote.option_selected}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ 
                  color: '#1e293b', 
                  marginBottom: '0.5rem' 
                }}>
                  Select a Poll
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Choose a poll from the left sidebar to view its results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
