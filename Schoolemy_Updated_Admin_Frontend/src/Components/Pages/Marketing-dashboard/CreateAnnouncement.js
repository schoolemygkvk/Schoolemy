import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_URL } from '../../../Utils/api';

const pageStyle = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: '1.5rem',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const containerStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
};

const backBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1.5rem',
  color: '#64748b',
  fontSize: '0.95rem',
  cursor: 'pointer',
  width: 'fit-content',
  padding: '0.5rem 0',
  borderRadius: '8px',
  transition: 'color 0.2s, background 0.2s',
};

const pageHeaderStyle = {
  marginBottom: '2rem',
};

const mainTitleStyle = {
  fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
  fontWeight: 800,
  color: '#1e293b',
  margin: '0 0 0.5rem 0',
  letterSpacing: '-0.02em',
};

const subtitleStyle = {
  fontSize: '1rem',
  color: '#64748b',
  margin: 0,
  maxWidth: '560px',
};

const gridLayout = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 380px)',
  gap: '2rem',
  alignItems: 'start',
};

const formCardStyle = {
  background: '#ffffff',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid #e2e8f0',
};

const sectionTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#1e293b',
  margin: '0 0 1.25rem 0',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.9rem',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '0.5rem',
};

const inputBase = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  outline: 'none',
};

const inputFocus = {
  borderColor: '#0ea5e9',
  boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)',
};

const textareaStyle = {
  ...inputBase,
  minHeight: '140px',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const dividerStyle = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '1.5rem 0',
};

const ctaSectionStyle = {
  marginTop: '1rem',
};

const twoColGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
};

const primaryBtnStyle = {
  width: '100%',
  padding: '0.875rem 1.25rem',
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  boxShadow: '0 2px 8px rgba(14, 165, 233, 0.35)',
  marginTop: '0.5rem',
};

const previewBoxStyle = {
  width: '100%',
  minHeight: 100,
  border: '2px dashed #cbd5e1',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f8fafc',
  marginBottom: '0.75rem',
  padding: '1rem',
};

const previewImgStyle = {
  maxWidth: '100%',
  maxHeight: 220,
  borderRadius: '10px',
  objectFit: 'cover',
  border: '1px solid #e2e8f0',
};

const removeImgBtnStyle = {
  marginTop: '0.75rem',
  padding: '0.5rem 1rem',
  background: 'transparent',
  border: '1px solid #ef4444',
  color: '#ef4444',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
};

const messageBoxStyle = {
  marginTop: '1rem',
  padding: '0.875rem 1rem',
  borderRadius: '10px',
  fontSize: '0.95rem',
  fontWeight: 600,
  textAlign: 'center',
};

const successMsgStyle = {
  ...messageBoxStyle,
  color: '#059669',
  backgroundColor: '#d1fae5',
  border: '1px solid #34d399',
};

const errorMsgStyle = {
  ...messageBoxStyle,
  color: '#dc2626',
  backgroundColor: '#fee2e2',
  border: '1px solid #f87171',
};

const historyCardStyle = {
  background: '#ffffff',
  borderRadius: '16px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid #e2e8f0',
  position: 'sticky',
  top: '1rem',
};

const historyTitleStyle = {
  fontSize: '1.15rem',
  fontWeight: 700,
  color: '#1e293b',
  margin: '0 0 1.25rem 0',
};

const historyListStyle = {
  maxHeight: 'calc(100vh - 12rem)',
  overflowY: 'auto',
  paddingRight: '0.5rem',
};

const announcementItemStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderLeft: '4px solid #0ea5e9',
  borderRadius: '12px',
  padding: '1rem',
  marginBottom: '1rem',
  transition: 'box-shadow 0.2s',
};

const itemTitleStyle = {
  margin: '0 0 0.5rem 0',
  fontSize: '1rem',
  fontWeight: 700,
  color: '#1e293b',
  lineHeight: 1.3,
};

const itemContentStyle = {
  margin: '0 0 0.75rem 0',
  fontSize: '0.9rem',
  color: '#475569',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const itemMetaStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginTop: '0.75rem',
  paddingTop: '0.75rem',
  borderTop: '1px solid #e2e8f0',
};

const itemDateStyle = {
  fontSize: '0.8rem',
  color: '#94a3b8',
  fontWeight: 500,
};

const deleteBtnStyle = {
  padding: '0.35rem 0.75rem',
  background: 'transparent',
  border: '1px solid #f87171',
  color: '#dc2626',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '2rem 1rem',
  color: '#94a3b8',
  fontSize: '0.95rem',
};

const fileInputStyle = {
  marginTop: '0.5rem',
  padding: '0.5rem',
  border: '1px dashed #cbd5e1',
  borderRadius: '8px',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '0.9rem',
  backgroundColor: '#f8fafc',
};

function getImageUrl(imagePath) {
  if (!imagePath) return '';
  // S3 or any full URL: use as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const base = (API_URL || '').replace(/\/$/, '');
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return base ? `${base}${path}` : path;
}

function CreateAnnouncement() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pastAnnouncements, setPastAnnouncements] = useState([]);
  const [focusedInput, setFocusedInput] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/api/announcements/all');
      const sorted = (response.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPastAnnouncements(sorted);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setStatusMessage('Could not load announcement history.');
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage('Please select a valid image file (e.g. JPG, PNG).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStatusMessage('Image must be under 3MB.');
      return;
    }
    setImageFile(file);
    setStatusMessage('');
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreviewUrl(ev.target?.result || '');
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('Publishing...');
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('content', content);
      form.append('button_text', buttonText);
      form.append('button_url', buttonUrl);
      if (imageFile) form.append('image', imageFile);

      await api.post('/api/announcements/create', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatusMessage('Announcement published successfully.');
      setTitle('');
      setContent('');
      setButtonText('');
      setButtonUrl('');
      setImageFile(null);
      setImagePreviewUrl('');
      await fetchAnnouncements();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create announcement.';
      setStatusMessage(msg);
      console.error('Create announcement error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/announcements/${id}`);
      setPastAnnouncements((prev) => prev.filter((a) => a._id !== id));
      setStatusMessage('Announcement deleted.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Failed to delete.');
      console.error('Delete announcement error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={pageStyle}>
      <style>{`
        @media (max-width: 900px) {
          .create-announcement-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={containerStyle}>
        <div
          style={backBarStyle}
          onClick={() => navigate('/schoolemy/marketing-dashboard')}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0ea5e9';
            e.currentTarget.style.backgroundColor = '#f0f9ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/schoolemy/marketing-dashboard')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Marketing Dashboard
        </div>

        <header style={pageHeaderStyle}>
          <h1 style={mainTitleStyle}>Create Announcement</h1>
          <p style={subtitleStyle}>
            Broadcast important updates to your community. Add a title, content, optional button and image.
          </p>
        </header>

        <div className="create-announcement-grid" style={gridLayout}>
          <div style={formCardStyle}>
            <h2 style={sectionTitleStyle}>New announcement</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={() => setFocusedInput('title')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="e.g. System maintenance scheduled"
                  required
                  disabled={isLoading}
                  style={{
                    ...inputBase,
                    ...(focusedInput === 'title' ? inputFocus : {}),
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onFocus={() => setFocusedInput('content')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Type your announcement details..."
                  required
                  disabled={isLoading}
                  style={{
                    ...textareaStyle,
                    ...(focusedInput === 'content' ? inputFocus : {}),
                  }}
                />
              </div>

              <hr style={dividerStyle} />
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                Optional call-to-action button
              </p>
              <div style={twoColGrid}>
                <div>
                  <label style={labelStyle}>Button text</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    onFocus={() => setFocusedInput('btnText')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="e.g. View details"
                    disabled={isLoading}
                    style={{
                      ...inputBase,
                      ...(focusedInput === 'btnText' ? inputFocus : {}),
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Button URL (Optional)</label>
                  <input
                    type="url"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    onFocus={() => setFocusedInput('btnUrl')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="https://..."
                    disabled={isLoading}
                    style={{
                      ...inputBase,
                      ...(focusedInput === 'btnUrl' ? inputFocus : {}),
                    }}
                  />
                </div>
              </div>

              <div style={{ ...ctaSectionStyle, marginTop: '1.5rem' }}>
                <label style={labelStyle}>Optional image (max 3MB)</label>
                <div style={previewBoxStyle}>
                  {imagePreviewUrl ? (
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <img src={imagePreviewUrl} alt="Preview" style={previewImgStyle} />
                      <div>
                        <button
                          type="button"
                          onClick={clearImage}
                          style={removeImgBtnStyle}
                        >
                          Remove image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      No image selected
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isLoading}
                  style={fileInputStyle}
                />
              </div>

              <hr style={dividerStyle} />

              <button
                type="submit"
                disabled={isLoading}
                style={primaryBtnStyle}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.45)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.35)';
                }}
              >
                {isLoading ? 'Publishing…' : 'Publish announcement'}
              </button>
            </form>

            {statusMessage && (
              <div
                style={
                  statusMessage.includes('successfully') || statusMessage.includes('deleted')
                    ? successMsgStyle
                    : errorMsgStyle
                }
              >
                {statusMessage}
              </div>
            )}
          </div>

          <aside style={historyCardStyle}>
            <h2 style={historyTitleStyle}>Announcement history</h2>
            <div style={historyListStyle}>
              {pastAnnouncements.length > 0 ? (
                pastAnnouncements.map((ann) => (
                  <div key={ann._id} style={announcementItemStyle}>
                    <h3 style={itemTitleStyle}>{ann.title}</h3>
                    <p style={itemContentStyle}>{ann.content}</p>
                    {ann.image_path && (
                      <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                        <img
                          src={getImageUrl(ann.image_path)}
                          alt={ann.title}
                          style={previewImgStyle}
                        />
                      </div>
                    )}
                    {(ann.button_text || ann.button_url) && (
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                        Button: {ann.button_text || '—'} → {ann.button_url ? 'Link' : '—'}
                      </p>
                    )}
                    <div style={itemMetaStyle}>
                      <span style={itemDateStyle}>
                        {new Date(ann.createdAt).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(ann._id)}
                        disabled={deletingId === ann._id}
                        style={deleteBtnStyle}
                      >
                        {deletingId === ann._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyStateStyle}>
                  No announcements yet. Publish one above.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CreateAnnouncement;
