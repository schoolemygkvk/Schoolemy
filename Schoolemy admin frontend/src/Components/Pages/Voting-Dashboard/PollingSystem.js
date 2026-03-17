import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../Utils/api'; 

const PollingSystem = () => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [activePolls, setActivePolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [voteData, setVoteData] = useState({
    option_selected: '',
    comment: ''
  });
  const [voting, setVoting] = useState(false);

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
    
    fetchPolls();
    fetchActivePolls();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!voteData.option_selected) {
      alert('Please select an option');
      return;
    }

    setVoting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/poll/${selectedPoll.poll_id}/vote`,
        voteData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Vote cast successfully!');
        setSelectedPoll(null);
        setVoteData({ option_selected: '', comment: '' });
        fetchActivePolls(); // Refresh active polls
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      alert(error.response?.data?.message || 'Failed to cast vote');
    } finally {
      setVoting(false);
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

  const isEligibleToVote = (poll) => {
    return poll.eligible_voters?.includes(user?.role) || false;
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
          <p style={{ color: '#6b7280' }}>Loading polls...</p>
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            Polling System
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
            View and participate in active voting polls
          </p>
        </div>

        {/* Active Polls for Voting */}
        {activePolls.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🗳️ Active Polls - Ready to Vote
            </h2>
            
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {activePolls.filter(poll => isEligibleToVote(poll) && poll.can_vote).map((poll) => (
                <div key={poll.poll_id} style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '2px solid #10b981'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        marginBottom: '0.5rem'
                      }}>
                        {poll.title}
                      </h3>
                      <p style={{
                        color: '#6b7280',
                        marginBottom: '1rem',
                        lineHeight: 1.5
                      }}>
                        {poll.description}
                      </p>
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        <span>📅 Ends: {formatDate(poll.end_date)}</span>
                        <span>👥 Total Votes: {poll.total_votes || 0}</span>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#dcfce7',
                      color: '#166534',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      🟢 ACTIVE
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedPoll(poll)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    Cast Your Vote
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Polls Overview */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b'
            }}>
              📊 All Polls Overview
            </h2>
            
            {user?.role === 'boscontroller' && (
              <button
                onClick={() => navigate('/schoolemy/create')}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                + Create New Poll
              </button>
            )}
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {polls.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ marginBottom: '0.5rem' }}>No polls found</h3>
                <p>No voting polls have been created yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Poll
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Status
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Votes
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Period
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Created By
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Actions
                      </th>
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
                              {poll.description?.substring(0, 80)}...
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
                            {getStatusIcon(poll.status)} {poll.status.toUpperCase()}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: '#374151' }}>
                          {poll.total_votes || 0}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <div>Start: {formatDate(poll.start_date)}</div>
                          <div>End: {formatDate(poll.end_date)}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#374151' }}>
                          {poll.created_by?.name}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            onClick={() => navigate(`/schoolemy/results`, { state: { pollId: poll.poll_id } })}
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
                            View Details
                          </button>
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

      {/* Voting Modal */}
      {selectedPoll && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              Cast Your Vote
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#374151', marginBottom: '0.5rem' }}>
                {selectedPoll.title}
              </h4>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                {selectedPoll.description}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Select your option:
              </label>
              
              {selectedPoll.options?.map((option, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  background: voteData.option_selected === option ? '#dbeafe' : 'white'
                }}>
                  <input
                    type="radio"
                    name="vote_option"
                    value={option}
                    checked={voteData.option_selected === option}
                    onChange={(e) => setVoteData(prev => ({
                      ...prev,
                      option_selected: e.target.value
                    }))}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <label style={{ cursor: 'pointer', flex: 1 }}>
                    {option}
                  </label>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Comment (optional):
              </label>
              <textarea
                value={voteData.comment}
                onChange={(e) => setVoteData(prev => ({
                  ...prev,
                  comment: e.target.value
                }))}
                placeholder="Add your thoughts or reasoning..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setSelectedPoll(null);
                  setVoteData({ option_selected: '', comment: '' });
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={voting || !voteData.option_selected}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: voting || !voteData.option_selected ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: voting || !voteData.option_selected ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {voting ? 'Voting...' : 'Submit Vote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollingSystem;
