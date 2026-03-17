import React, { useState, useEffect, useRef, useCallback } from 'react';
import { votingApi, handleApiError } from '../../../Utils/votingApi';

const LiveResultsDashboard = () => {
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [liveResults, setLiveResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const fetchLiveResults = useCallback(async () => {
    if (!selectedPoll) return;

    try {
      const response = await votingApi.getLiveResults(selectedPoll.poll_id);
      if (response.data.success) {
        setLiveResults(response.data.data);
        setError(''); // Clear any previous errors
      }
    } catch (error) {
      console.error('Error fetching live results:', error);
      if (error.response?.status === 404) {
        setError('Poll not found');
      } else if (error.response?.status === 403) {
        setError('Access denied to view results');
      } else {
        setError(handleApiError(error, 'Failed to fetch live results'));
      }
    }
  }, [selectedPoll]);

  useEffect(() => {
    fetchActivePolls();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedPoll) {
      fetchLiveResults();
      // Start polling for live updates every 5 seconds
      intervalRef.current = setInterval(fetchLiveResults, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedPoll, fetchLiveResults]);

  const fetchActivePolls = async () => {
    try {
      setLoading(true);
      const response = await votingApi.getAllPolls();
      if (response.data.success) {
        const activePolls = response.data.data.filter(poll => 
          poll.status === 'active' || poll.status === 'completed'
        );
        setPolls(activePolls);
      }
    } catch (error) {
      setError(handleApiError(error, 'Failed to fetch polls'));
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (timeMs) => {
    if (timeMs <= 0) return 'Voting has ended';
    
    const hours = Math.floor(timeMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s remaining`;
    } else {
      return `${seconds}s remaining`;
    }
  };

  const getBarColor = (index, isHighest) => {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F97316'  // Orange
    ];
    
    if (isHighest && liveResults?.total_votes > 0) {
      return '#059669'; // Highlight winning option
    }
    
    return colors[index % colors.length];
  };

  const maxVotes = liveResults?.results ? Math.max(...liveResults.results.map(r => r.vote_count)) : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '2rem 1rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0'
          }}>
            📊 Live Results Dashboard
          </h1>
          <p style={{
            fontSize: '1.1rem',
            opacity: 0.9,
            margin: 0
          }}>
            Real-time voting results with automatic updates
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedPoll ? '300px 1fr' : '1fr',
          gap: '2rem'
        }}>
          {/* Polls Sidebar */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            height: 'fit-content',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#1e293b'
            }}>
              Active Polls
            </h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e2e8f0',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
              </div>
            ) : polls.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center' }}>
                No active polls found
              </p>
            ) : (
              <div style={{ space: '0.5rem' }}>
                {polls.map((poll) => (
                  <div
                    key={poll.poll_id}
                    onClick={() => setSelectedPoll(poll)}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: selectedPoll?.poll_id === poll.poll_id ? 
                        '2px solid #3b82f6' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      marginBottom: '0.5rem',
                      background: selectedPoll?.poll_id === poll.poll_id ? 
                        '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem',
                      color: '#1e293b'
                    }}>
                      {poll.title}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      marginBottom: '0.5rem'
                    }}>
                      Created by: {poll.created_by.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        background: poll.status === 'active' ? '#dcfce7' : '#f3f4f6',
                        color: poll.status === 'active' ? '#166534' : '#374151'
                      }}>
                        {poll.status}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#64748b'
                      }}>
                        {poll.total_votes} votes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Results */}
          {selectedPoll && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {liveResults ? (
                <div>
                  {/* Poll Header */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        margin: 0
                      }}>
                        {liveResults.title}
                      </h2>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <button
                          onClick={fetchLiveResults}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          🔄 Refresh
                        </button>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: liveResults.is_active ? '#10b981' : '#ef4444'
                          }}></div>
                          <span style={{
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            color: liveResults.is_active ? '#10b981' : '#ef4444'
                          }}>
                            {liveResults.is_active ? 'LIVE' : 'ENDED'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p style={{
                      color: '#64748b',
                      marginBottom: '1rem'
                    }}>
                      {liveResults.description}
                    </p>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Votes</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                          {liveResults.total_votes}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b' }}>
                          {formatTimeRemaining(liveResults.voting_period.time_remaining)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Last Updated</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b' }}>
                          {new Date(liveResults.last_updated).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      marginBottom: '1.5rem',
                      color: '#1e293b'
                    }}>
                      Real-time Results
                    </h3>

                    {liveResults.results.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#64748b',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '2px dashed #cbd5e1'
                      }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>No votes cast yet</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Results will appear here as votes come in</p>
                      </div>
                    ) : (
                      <div style={{ space: '1rem' }}>
                        {liveResults.results.map((result, index) => {
                          const isWinning = result.vote_count === maxVotes && liveResults.total_votes > 0;
                          return (
                            <div key={result.option} style={{ 
                              marginBottom: '1.5rem',
                              padding: '1rem',
                              background: isWinning ? '#f0fdf4' : 'white',
                              borderRadius: '12px',
                              border: isWinning ? '2px solid #10b981' : '1px solid #e2e8f0',
                              boxShadow: isWinning ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                              transition: 'all 0.3s ease'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.75rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {isWinning && <span style={{ fontSize: '1.2rem' }}>👑</span>}
                                  <span style={{
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    fontSize: '1rem'
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
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    color: '#374151',
                                    background: '#f3f4f6',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '6px'
                                  }}>
                                    {result.vote_count} {result.vote_count === 1 ? 'vote' : 'votes'}
                                  </span>
                                  <span style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    color: getBarColor(index, isWinning),
                                    minWidth: '45px',
                                    textAlign: 'right'
                                  }}>
                                    {result.percentage}%
                                  </span>
                                </div>
                              </div>
                            
                            {/* Progress Bar */}
                            <div style={{
                              height: '16px',
                              background: '#e2e8f0',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              position: 'relative',
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${result.percentage}%`,
                                background: getBarColor(index, result.vote_count === maxVotes),
                                borderRadius: '8px',
                                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                              }}>
                                {result.percentage > 15 && (
                                  <div style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                  }}>
                                    {result.percentage}%
                                  </div>
                                )}
                              </div>
                            </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recent Votes */}
                  {liveResults.recent_votes && liveResults.recent_votes.length > 0 && (
                    <div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        color: '#1e293b'
                      }}>
                        Recent Votes
                      </h3>
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}>
                        {liveResults.recent_votes.map((vote, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0',
                            borderBottom: index < liveResults.recent_votes.length - 1 ? 
                              '1px solid #e2e8f0' : 'none'
                          }}>
                            <div>
                              <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                {vote.voter_name}
                              </span>
                              <span style={{ 
                                fontSize: '0.8rem', 
                                color: '#64748b',
                                marginLeft: '0.5rem'
                              }}>
                                ({vote.voter_role})
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '600', color: '#374151' }}>
                                {vote.option_selected}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {new Date(vote.voted_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                  }}></div>
                  <p style={{ color: '#64748b' }}>Loading live results...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LiveResultsDashboard;
