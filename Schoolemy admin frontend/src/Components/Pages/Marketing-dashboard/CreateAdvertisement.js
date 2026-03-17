import React, { useState, useEffect } from 'react';
import axios from '../../../Utils/api';

const API_BASE = axios.defaults.baseURL || '';

function getAdImageSrc(ad) {
    if (!ad) return '';
    if (ad.image_path) {
        if (ad.image_path.startsWith('http://') || ad.image_path.startsWith('https://')) return ad.image_path;
        return `${API_BASE.replace(/\/$/, '')}${ad.image_path.startsWith('/') ? ad.image_path : '/' + ad.image_path}`;
    }
    if (ad.image_base64) return ad.image_base64;
    return '';
}

// --- WORLD-CLASS MODERN STYLES ---
const styles = {
    pageWrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)',
        padding: '3rem 1.5rem',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    container: {
        maxWidth: '1000px',
        margin: '0 auto',
    },
    card: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        marginBottom: '2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    headerSection: {
        textAlign: 'center',
        marginBottom: '2.5rem',
    },
    mainTitle: {
        fontSize: '2.5rem',
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: '0.5rem',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        fontSize: '1rem',
        color: '#64748b',
        fontWeight: '500',
        lineHeight: '1.6',
    },
    formGroup: {
        marginBottom: '1.75rem',
    },
    label: {
        display: 'block',
        fontWeight: '600',
        marginBottom: '0.75rem',
        color: '#1e293b',
        fontSize: '0.95rem',
        letterSpacing: '0.3px',
    },
    input: {
        width: '100%',
        padding: '0.875rem 1.125rem',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: '1rem',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        backgroundColor: '#f8fafc',
        outline: 'none',
    },
    inputFocus: {
        border: '2px solid #0ea5e9',
        backgroundColor: '#ffffff',
        boxShadow: '0 0 0 4px rgba(14, 165, 233, 0.1)',
    },
    inputFile: {
        width: '100%',
        padding: '1rem',
        border: '2px dashed #cbd5e1',
        borderRadius: '12px',
        fontSize: '1rem',
        boxSizing: 'border-box',
        backgroundColor: '#f8fafc',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    imagePreview: {
        marginBottom: '1.75rem',
        textAlign: 'center',
        padding: '1.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        border: '2px solid #e2e8f0',
    },
    previewLabel: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#64748b',
        marginBottom: '1rem',
        display: 'block',
    },
    previewImage: {
        maxWidth: '100%',
        maxHeight: '300px',
        border: '3px solid #ffffff',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        objectFit: 'cover',
    },
    button: {
        width: '100%',
        padding: '1rem 1.5rem',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1.1rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    },
    buttonHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(14, 165, 233, 0.6)',
    },
    successMessage: {
        color: '#059669',
        textAlign: 'center',
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#d1fae5',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '1rem',
        border: '2px solid #34d399',
    },
    errorMessage: {
        color: '#dc2626',
        textAlign: 'center',
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#fee2e2',
        borderRadius: '12px',
        fontWeight: '600',
        fontSize: '1rem',
        border: '2px solid #f87171',
    },
    historyHeader: {
        fontSize: '1.75rem',
        fontWeight: '700',
        color: '#1e293b',
        borderBottom: '3px solid #e2e8f0',
        paddingBottom: '1rem',
        marginBottom: '2rem',
        textAlign: 'center',
    },
    historyItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1.5rem',
        border: '2px solid #e2e8f0',
        borderRadius: '16px',
        marginBottom: '1.5rem',
        backgroundColor: '#ffffff',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
    },
    historyItemHover: {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        borderColor: '#cbd5e1',
    },
    activeHistoryItem: {
        borderColor: '#0ea5e9',
        backgroundColor: '#e0f2fe',
        boxShadow: '0 8px 24px rgba(14, 165, 233, 0.2)',
    },
    historyImage: {
        width: '140px',
        height: '100px',
        borderRadius: '12px',
        objectFit: 'cover',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    adInfo: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    adInfoTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#1e293b',
    },
    adInfoLink: {
        margin: '0',
        fontSize: '0.9rem',
        color: '#64748b',
        wordBreak: 'break-all',
    },
    adInfoLinkAnchor: {
        color: '#0ea5e9',
        textDecoration: 'none',
        fontWeight: '600',
    },
    adInfoDate: {
        fontSize: '0.85rem',
        color: '#94a3b8',
    },
    activeBadge: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: '0.4rem 1rem',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '700',
        width: 'fit-content',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
        letterSpacing: '0.5px',
    },
    emptyState: {
        textAlign: 'center',
        padding: '3rem',
        color: '#94a3b8',
        fontSize: '1.1rem',
        fontWeight: '500',
    },
    actionBtn: {
        padding: '0.5rem 1rem',
        borderRadius: '10px',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s ease',
    },
    editBtn: {
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        color: 'white',
    },
    deleteBtn: {
        background: 'transparent',
        color: '#dc2626',
        border: '2px solid #f87171',
    },
    setActiveBtn: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
    },
    actionGroup: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginTop: '0.75rem',
    },
    cancelBtn: {
        padding: '0.75rem 1.25rem',
        background: '#e2e8f0',
        color: '#475569',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginRight: '0.5rem',
    },
};
// --- END WORLD-CLASS STYLES ---

const CreateAdvertisement = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [allAds, setAllAds] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [focusedInput, setFocusedInput] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = React.useRef(null);
    const previewBlobUrlRef = React.useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (previewBlobUrlRef.current) {
                URL.revokeObjectURL(previewBlobUrlRef.current);
                previewBlobUrlRef.current = null;
            }
            const url = URL.createObjectURL(selectedFile);
            previewBlobUrlRef.current = url;
            setFile(selectedFile);
            setPreview(url);
        }
    };

    // Clear preview when file is cleared (e.g. cancel edit) and not editing
    useEffect(() => {
        if (!file && !editingId) {
            if (previewBlobUrlRef.current) {
                URL.revokeObjectURL(previewBlobUrlRef.current);
                previewBlobUrlRef.current = null;
            }
            setPreview(null);
        }
    }, [file, editingId]);

    const handleEdit = (ad) => {
        setEditingId(ad._id);
        setTitle(ad.title || '');
        setTargetUrl(ad.target_url || '');
        setFile(null);
        setPreview(getAdImageSrc(ad) || null);
        setMessage('');
        setError('');
    };

    const handleCancelEdit = () => {
        if (previewBlobUrlRef.current) {
            URL.revokeObjectURL(previewBlobUrlRef.current);
            previewBlobUrlRef.current = null;
        }
        setEditingId(null);
        setTitle('');
        setTargetUrl('');
        setFile(null);
        setPreview(null);
        setMessage('');
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this advertisement?')) return;
        setDeletingId(id);
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/advertisements/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage('Advertisement deleted.');
            setTimeout(() => setMessage(''), 3000);
            setAllAds((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete.');
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetActive = async (id) => {
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/advertisements/${id}/set-active`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage('Advertisement set as active.');
            setTimeout(() => setMessage(''), 3000);
            fetchAllAds();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to set active.');
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const isEdit = Boolean(editingId);
        if (!targetUrl) {
            setError('Target URL is required.');
            return;
        }
        if (!isEdit && !file) {
            setError('Please provide an image and a target URL.');
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('targetUrl', targetUrl);
        if (file) formData.append('adImage', file);

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (isEdit) {
                await axios.put(`/api/advertisements/${editingId}`, formData, config);
                setMessage('Advertisement updated successfully!');
            } else {
                await axios.post('/api/advertisements/create', formData, config);
                setMessage('Advertisement activated successfully!');
            }

            if (previewBlobUrlRef.current) {
                URL.revokeObjectURL(previewBlobUrlRef.current);
                previewBlobUrlRef.current = null;
            }
            setEditingId(null);
            setFile(null);
            setTitle('');
            setTargetUrl('');
            setPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            e.target.reset();
            fetchAllAds();
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || (isEdit ? 'Update failed.' : 'Upload failed.'));
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };
    
    const fetchAllAds = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/advertisements/all', {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            setAllAds(res.data);
        } catch (error) {
            console.error("Could not fetch advertisements history", error);
        }
    }

    useEffect(() => {
        fetchAllAds();
    }, []);

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.headerSection}>
                        <h2 style={styles.mainTitle}>{editingId ? '✏️ Edit Advertisement' : '✨ Advertisement Manager'}</h2>
                        <p style={styles.subtitle}>
                            {editingId ? 'Update title, link, or replace the image below.' : 'Create stunning advertisements that captivate your audience. Each new upload automatically becomes the active ad.'}
                        </p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label htmlFor="title" style={styles.label}>📝 Advertisement Title</label>
                            <input
                                type="text"
                                id="title"
                                style={{
                                    ...styles.input,
                                    ...(focusedInput === 'title' && styles.inputFocus)
                                }}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onFocus={() => setFocusedInput('title')}
                                onBlur={() => setFocusedInput(null)}
                                placeholder="e.g., Summer Sale - 50% Off All Courses!"
                            />
                        </div>
                        
                        <div style={styles.formGroup}>
                            <label htmlFor="targetUrl" style={styles.label}>🔗 Target URL (Destination Link)</label>
                            <input
                                type="url"
                                id="targetUrl"
                                style={{
                                    ...styles.input,
                                    ...(focusedInput === 'targetUrl' && styles.inputFocus)
                                }}
                                value={targetUrl}
                                onChange={(e) => setTargetUrl(e.target.value)}
                                onFocus={() => setFocusedInput('targetUrl')}
                                onBlur={() => setFocusedInput(null)}
                                placeholder="https://www.your-website.com/sale"
                                required
                            />
                        </div>
                        
                        <div style={styles.formGroup}>
                            <label htmlFor="adImage" style={styles.label}>🖼️ Advertisement Image {editingId && '(optional – leave empty to keep current)'}</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="adImage"
                                style={styles.inputFile}
                                accept="image/png, image/jpeg, image/gif, image/webp"
                                onChange={handleFileChange}
                                required={!editingId}
                            />
                        </div>

                        {preview && editingId && (
                            <div style={styles.imagePreview}>
                                <span style={styles.previewLabel}>Preview Your Advertisement</span>
                                <img src={preview} alt="Advertisement Preview" style={styles.previewImage} />
                            </div>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                        {editingId && (
                            <button type="button" style={styles.cancelBtn} onClick={handleCancelEdit} disabled={submitting}>
                                Cancel
                            </button>
                        )}
                        <button 
                            type="submit" 
                            style={styles.button}
                            disabled={submitting}
                            onMouseEnter={(e) => !submitting && Object.assign(e.target.style, styles.buttonHover)}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                            }}
                        >
                            {submitting ? 'Saving…' : editingId ? '💾 Update Advertisement' : '🚀 Upload & Activate'}
                        </button>
                    </div>
                    </form>
                    
                    {message && <div style={styles.successMessage}>✅ {message}</div>}
                    {error && <div style={styles.errorMessage}>❌ {error}</div>}
                </div>

                <div style={styles.card}>
                    <h3 style={styles.historyHeader}>📚 Advertisement History</h3>
                    <div>
                        {allAds.length > 0 ? allAds.map(ad => (
                            <div 
                                key={ad._id} 
                                style={{
                                    ...styles.historyItem,
                                    ...(ad.is_active && styles.activeHistoryItem),
                                    ...(hoveredItem === ad._id && !ad.is_active && styles.historyItemHover)
                                }}
                                onMouseEnter={() => setHoveredItem(ad._id)}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                {getAdImageSrc(ad) ? (
                                    <img 
                                        src={getAdImageSrc(ad)} 
                                        alt={ad.title || 'Advertisement'} 
                                        style={styles.historyImage} 
                                    />
                                ) : (
                                    <div style={{ ...styles.historyImage, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#64748b' }}>No image</div>
                                )}
                                <div style={styles.adInfo}>
                                    <strong style={styles.adInfoTitle}>{ad.title || 'Untitled Advertisement'}</strong>
                                    <p style={styles.adInfoLink}>
                                        🔗 Link: <a href={ad.target_url} target="_blank" rel="noopener noreferrer" style={styles.adInfoLinkAnchor}>{ad.target_url}</a>
                                    </p>
                                    <small style={styles.adInfoDate}>📅 Uploaded: {new Date(ad.createdAt).toLocaleString()}</small>
                                    {ad.is_active && <span style={styles.activeBadge}>⚡ CURRENTLY ACTIVE</span>}
                                    <div style={styles.actionGroup}>
                                        <button
                                            type="button"
                                            style={{ ...styles.actionBtn, ...styles.editBtn }}
                                            onClick={(ev) => { ev.stopPropagation(); handleEdit(ad); }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        {!ad.is_active && (
                                            <button
                                                type="button"
                                                style={{ ...styles.actionBtn, ...styles.setActiveBtn }}
                                                onClick={(ev) => { ev.stopPropagation(); handleSetActive(ad._id); }}
                                            >
                                                ⚡ Set active
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                                            onClick={(ev) => { ev.stopPropagation(); handleDelete(ad._id); }}
                                            disabled={deletingId === ad._id}
                                        >
                                            {deletingId === ad._id ? 'Deleting…' : '🗑️ Delete'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div style={styles.emptyState}>
                                <p>📭 No advertisements found yet. Create your first one!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateAdvertisement;