import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../Utils/api'; 
import { useAuth } from '../../Auth/AuthProvider';

const CreateVoteSystem = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    start_date: '',
    end_date: '',
    eligible_voters: ['boscontroller', 'bosmembers'],
    is_anonymous: false,
    allow_multiple_votes: false,
    settings: {
      require_comments: false,
      show_results_before_end: false,
      auto_close_on_end_date: true
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const handleSettingsChange = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/create-poll',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Voting poll created successfully!');
        navigate('/schoolemy/polling');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert(error.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  // Debug: Log user data before access check (from Auth context)
  console.log('CreateVoteSystem - auth user:', user);
  console.log('CreateVoteSystem - user role:', user?.role);
  console.log('CreateVoteSystem - is boscontroller?', user?.role === 'boscontroller');

  if (isLoading || !user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#f59e0b' }}>Loading...</h2>
        <p>Loading user information...</p>
        <div style={{
          width: '2rem',
          height: '2rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '1rem auto'
        }}></div>
      </div>
    );
  }

  const allowedCreatorRoles = ['boscontroller', 'superadmin'];
  const normalizedRole = user?.role?.toLowerCase();

  if (!allowedCreatorRoles.includes(normalizedRole)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>Access Denied</h2>
        <p>Only BOS Controllers and Super Admins can create voting polls.</p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Current role: {user?.role || 'No role found'}
        </p>
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Debug Info:
          </p>
          <pre style={{ fontSize: '0.75rem', textAlign: 'left', background: '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        <button 
          onClick={() => navigate('/schoolemy/vote')}
          style={{
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'red',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/schoolemy/vote')}
            style={{
              position: 'absolute',
              left: '2rem',
              top: '2rem',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back
          </button>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '0.5rem'
          }}>
            Create New Vote Poll
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
            Set up a new voting poll for BOS decisions
          </p>
        </div>

        {/* Form */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                color: '#1e293b'
              }}>
                📋 Basic Information
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Poll Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter poll title"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what this poll is about"
                  required
                  rows={4}
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
            </div>

            {/* Voting Options */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                color: '#1e293b'
              }}>
                ✅ Voting Options
              </h3>
              
              {formData.options.map((option, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    minWidth: '2rem',
                    height: '2rem',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      style={{
                        padding: '0.5rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addOption}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                + Add Option
              </button>
            </div>

            {/* Schedule */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                color: '#1e293b'
              }}>
                ⏰ Schedule
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                color: '#1e293b'
              }}>
                ⚙️ Settings
              </h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <input
                    type="checkbox"
                    name="is_anonymous"
                    checked={formData.is_anonymous}
                    onChange={handleInputChange}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <div>
                    <label style={{ fontWeight: '600', color: '#374151' }}>
                      Anonymous Voting
                    </label>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                      Hide voter identities in results
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <input
                    type="checkbox"
                    name="allow_multiple_votes"
                    checked={formData.allow_multiple_votes}
                    onChange={handleInputChange}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <div>
                    <label style={{ fontWeight: '600', color: '#374151' }}>
                      Allow Multiple Votes
                    </label>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                      Allow voters to change their vote
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.settings.show_results_before_end}
                    onChange={(e) => handleSettingsChange('show_results_before_end', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <div>
                    <label style={{ fontWeight: '600', color: '#374151' }}>
                      Show Results Before End
                    </label>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                      Display live results during voting
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                type="button"
                onClick={() => navigate('/schoolemy/vote')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: loading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateVoteSystem;
