import React from 'react';

const VotingSystemDemo = () => {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '2rem' }}>
          🗳️ BOS Voting System Demo
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Complete voting platform with live results tracking
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>✨ Features</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {[
            {
              title: '📊 Live Results Dashboard',
              description: 'Real-time bar chart visualization with auto-refresh every 5 seconds'
            },
            {
              title: '🔐 Role-based Access',
              description: 'Only BOS Controllers and Members can vote and view results'
            },
            {
              title: '📧 Email Notifications',
              description: 'Automatic emails when polls are created and votes are cast'
            },
            {
              title: '⏰ Time Management',
              description: 'Automatic poll activation and closure based on schedule'
            },
            {
              title: '👑 Winner Highlighting',
              description: 'Visual indicators for leading options with crown icons'
            },
            {
              title: '📱 Responsive Design',
              description: 'Works perfectly on desktop, tablet, and mobile devices'
            }
          ].map((feature, index) => (
            <div key={index} style={{
              padding: '1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: '#f8fafc'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#64748b',
                margin: 0
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>🚀 How to Use</h2>
        <div style={{ space: '1rem' }}>
          {[
            {
              step: '1',
              title: 'Create a Poll',
              description: 'BOS Controllers can create voting polls with multiple options and time limits'
            },
            {
              step: '2',
              title: 'Email Notifications',
              description: 'All BOS members receive email notifications when new polls are created'
            },
            {
              step: '3',
              title: 'Cast Votes',
              description: 'Eligible voters can cast their votes during the active voting period'
            },
            {
              step: '4',
              title: 'Live Results',
              description: 'Watch results update in real-time with beautiful bar chart visualization'
            },
            {
              step: '5',
              title: 'Automatic Closure',
              description: 'Polls automatically close when the end time is reached'
            }
          ].map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                flexShrink: 0
              }}>
                {item.step}
              </div>
              <div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#64748b',
                  margin: 0
                }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: '#f8fafc',
        borderRadius: '12px',
        marginTop: '2rem'
      }}>
        <h3 style={{ color: '#1e293b', marginBottom: '1rem' }}>
          🎯 Ready to Start Voting?
        </h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Access the complete voting system through the navigation menu
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <a
            href="/schoolemy/create"
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            Create Poll
          </a>
          <a
            href="/schoolemy/live-results"
            style={{
              background: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            Live Results
          </a>
          <a
            href="/schoolemy/polling"
            style={{
              background: '#f59e0b',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            Vote Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default VotingSystemDemo;
