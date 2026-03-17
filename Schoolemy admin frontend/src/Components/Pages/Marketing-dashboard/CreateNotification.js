import React, { useState } from 'react';
import axios from '../../../Utils/api';

// --- WORLD-CLASS MODERN STYLES (No styled-components) ---
const pageWrapperStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)',
    padding: '3rem 1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const formContainerStyle = {
    padding: '2.5rem',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    width: '100%',
    maxWidth: '700px',
};

const formTitleStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    letterSpacing: '-0.5px',
};

const formGroupStyle = {
    marginBottom: '1.75rem',
};

const labelStyle = {
    display: 'block',
    marginBottom: '0.75rem',
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '0.95rem',
    letterSpacing: '0.3px',
};

const inputBaseStyle = {
    width: '100%',
    padding: '0.875rem 1.125rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8fafc',
    outline: 'none',
};

const inputFocusStyle = {
    border: '2px solid #0ea5e9',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 0 4px rgba(14, 165, 233, 0.1)',
};

const textAreaStyle = {
    ...inputBaseStyle,
    resize: 'vertical',
    minHeight: '120px',
    fontFamily: 'inherit',
};

const submitButtonStyle = {
    width: '100%',
    padding: '1rem 1.5rem',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
};

const buttonHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(14, 165, 233, 0.6)',
};

const buttonDisabledStyle = {
    background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
    cursor: 'not-allowed',
    transform: 'none',
};

const statusMessageStyle = (type) => ({
    marginTop: '1.5rem',
    padding: '1rem',
    textAlign: 'center',
    borderRadius: '12px',
    color: type === 'success' ? '#059669' : '#dc2626',
    fontWeight: '600',
    backgroundColor: type === 'success' ? '#d1fae5' : '#fee2e2',
    border: `2px solid ${type === 'success' ? '#34d399' : '#f87171'}`,
});

const iconStyle = {
    fontSize: '1.5rem',
};

const CreateNotification = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [courseName, setCourseName] = useState('');
    const [buttonName, setButtonName] = useState('');
    const [status, setStatus] = useState({ visible: false, type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ visible: false, type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setStatus({ visible: true, type: 'error', text: 'Authorization failed. Please log in again.' });
                setLoading(false);
                return;
            }

            await axios.post(
                '/api/bell-notifications/create',
                { title, message, courseName, buttonName, joinLink: '#joinForm' },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setStatus({ visible: true, type: 'success', text: 'Notification sent successfully!' });
            setTitle('');
            setMessage('');
            setCourseName('');
            setButtonName('');

        } catch (error) {
            const errorMsg = error.response?.data?.message || 'An error occurred. Please try again.';
            setStatus({ visible: true, type: 'error', text: `Failed to send: ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={pageWrapperStyle}>
            <div style={formContainerStyle}>
                <h2 style={formTitleStyle}>
                    <span style={iconStyle}>🔔</span>
                    Create Bell Notification
                </h2>
                
                <form onSubmit={handleSubmit}>
                    <div style={formGroupStyle}>
                        <label htmlFor="notification-title" style={labelStyle}>📝 Notification Title</label>
                        <input
                            id="notification-title"
                            type="text"
                            style={{
                                ...inputBaseStyle,
                                ...(focusedInput === 'title' && inputFocusStyle)
                            }}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onFocus={() => setFocusedInput('title')}
                            onBlur={() => setFocusedInput(null)}
                            placeholder="e.g., Special Live Class Today!"
                            required
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label htmlFor="course-name" style={labelStyle}>📚 Course Name</label>
                        <input
                            id="course-name"
                            type="text"
                            style={{
                                ...inputBaseStyle,
                                ...(focusedInput === 'course' && inputFocusStyle)
                            }}
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            onFocus={() => setFocusedInput('course')}
                            onBlur={() => setFocusedInput(null)}
                            placeholder="e.g., Siddha Practice Session"
                            required
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label htmlFor="notification-message" style={labelStyle}>✍️ Message Content</label>
                        <textarea
                            id="notification-message"
                            style={{
                                ...textAreaStyle,
                                ...(focusedInput === 'message' && inputFocusStyle)
                            }}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onFocus={() => setFocusedInput('message')}
                            onBlur={() => setFocusedInput(null)}
                            placeholder="e.g., A session on React Hooks is starting now. Don't miss out!"
                            required
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label htmlFor="button-name" style={labelStyle}>🔘 Button Text (Optional)</label>
                        <input
                            id="button-name"
                            type="text"
                            style={{
                                ...inputBaseStyle,
                                ...(focusedInput === 'button' && inputFocusStyle)
                            }}
                            value={buttonName}
                            onChange={(e) => setButtonName(e.target.value)}
                            onFocus={() => setFocusedInput('button')}
                            onBlur={() => setFocusedInput(null)}
                            placeholder="e.g., Join Now, Register Here, Learn More"
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...submitButtonStyle,
                            ...(loading && buttonDisabledStyle)
                        }}
                        disabled={loading}
                        onMouseEnter={(e) => !loading && Object.assign(e.target.style, buttonHoverStyle)}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                            }
                        }}
                    >
                        {loading ? '📤 Sending...' : (
                            <>
                                <span style={iconStyle}>✈️</span>
                                Send Notification
                            </>
                        )}
                    </button>
                </form>

                {status.visible && (
                    <div style={statusMessageStyle(status.type)}>
                        {status.type === 'success' ? '✅ ' : '❌ '}{status.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateNotification;