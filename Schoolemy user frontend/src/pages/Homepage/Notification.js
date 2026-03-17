// File: components/NotificationPanel.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from "../../service/api"; // Use centralized API instance

// மாற்றம்: உங்க Theme-க்கு ஏற்ற நிறங்களை இங்கே வரையறுத்துள்ளேன்
const THEME_ACCENT_COLOR = '#FBBF24'; // உங்கள் 'Welcome to Schoolemy' பட்டன் நிறம்
const THEME_ACCENT_HOVER = '#F59E0B'; // Hover செய்யும்போது கொஞ்சம் அடர்த்தியான நிறம்
const TEXT_PRIMARY = '#1F2937';       // கருப்புக்கு பதிலாக ஒரு அடர் சாம்பல் நிறம்
const TEXT_SECONDARY = '#6B7280';     // இரண்டாம் நிலை டெக்ஸ்ட் நிறம்
const BORDER_COLOR = '#E5E7EB';       // மென்மையான பார்டர் நிறம்
const BACKGROUND_LIGHT = '#F9FAFB';   // பட்டன்களுக்கு மென்மையான நிறம்

const NotificationPopup = styled.div`
  position: absolute;
  top: calc(100% + 15px);
  right: 0;
  background-color: #fff;
  border-radius: 12px; // மாற்றம்: இன்னும் மென்மையான வளைவுகள்
  box-shadow: 0 8px 24px rgba(149, 157, 165, 0.2); // மாற்றம்: நவீனமான, மென்மையான நிழல்
  border: 1px solid ${BORDER_COLOR};
  width: 350px;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Poppins', sans-serif; // மாற்றம்: உங்கள் தளத்தின் font-ஐ பயன்படுத்தலாம்
@media (max-width: 768px) {
    position: fixed; // மாற்றம்: absolute-லிருந்து fixed-ஆக மாற்றுங்கள்
    top: 75px;       // மாற்றம்: Header உயரத்திற்கு கீழே
    left: 15px;      // இடதுபுறம் 15px தள்ளி வை
    right: 15px;     // வலதுபுறம் 15px தள்ளி வை
    width: auto;     // அகலத்தை auto-வாக மாற்று
  }
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

`;

const PopupHeader = styled.div`
  padding: 16px 20px; // மாற்றம்: થોડુંક વધારે இடைவெளி
  font-weight: 600;
  font-size: 1rem; // மாற்றம்: எழுத்து அளவை சற்று பெரிதாக்கியுள்ளேன்
  color: ${TEXT_PRIMARY};
  border-bottom: 1px solid ${BORDER_COLOR};
`;

const NotificationItem = styled.div`
  padding: 16px 20px; // மாற்றம்: சீரான இடைவெளி
  border-bottom: 1px solid ${BORDER_COLOR};
  &:last-child { border-bottom: none; }
`;

const NotificationMessage = styled.p`
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${TEXT_PRIMARY}; // மாற்றம்: டெக்ஸ்ட் நிறத்தை கருமையாக்கியுள்ளேன்
  font-weight: 600;      // மாற்றம்: டெக்ஸ்டை Bold ஆக்கியுள்ளேன்
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px; // மாற்றம்: பட்டன்களுக்கு இடையே சற்று அதிக இடைவெளி
`;

// மாற்றம்: பொதுவான பட்டன் ஸ்டைல்களை மாற்றியுள்ளேன்
const ActionButton = styled.button`
  padding: 6px 14px;
  border-radius: 8px; // மாற்றம்: மென்மையான வளைவுகள்
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  border: 1px solid transparent;
  transition: all 0.2s ease-in-out;
`;

// மாற்றம்: Join பட்டன் உங்கள் theme நிறத்திற்கு மாற்றப்பட்டுள்ளது
const JoinButton = styled(ActionButton)`
  background-color: ${THEME_ACCENT_COLOR};
  color: ${TEXT_PRIMARY}; // மஞ்சள் மீது கருப்பு டெக்ஸ்ட் தெளிவாக தெரியும்
  border-color: ${THEME_ACCENT_COLOR};

  &:hover { 
    background-color: ${THEME_ACCENT_HOVER};
    border-color: ${THEME_ACCENT_HOVER};
    transform: translateY(-1px); // Hover-ல் சிறிய அனிமேஷன்
  }
`;

// மாற்றம்: Close பட்டன் ஒரு இரண்டாம் நிலை பட்டனாக மாற்றப்பட்டுள்ளது
const CloseButton = styled(ActionButton)`
  background-color: ${BACKGROUND_LIGHT};
  color: ${TEXT_SECONDARY};
  border: 1px solid ${BORDER_COLOR};

  &:hover { 
    background-color: #F3F4F6;
    border-color: #D1D5DB;
  }
`;

const StatusText = styled.div`
  padding: 2.5rem; // மாற்றம்: அதிக இடைவெளி
  text-align: center;
  color: #9CA3AF; // மாற்றம்: நிறத்தை மென்மையாக்கியுள்ளேன்
  font-size: 0.9rem;
`;
// --- Main Component ---
const NotificationPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const { data } = await api.get('/api/bell-notifications');
                    setNotifications(data);
                } else {
                    setError("Please login to see notifications.");
                }
            } catch (err) {
                const message = err.response?.data?.message || "Could not fetch notifications.";
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const handleClose = (notificationId) => {
        setNotifications(currentNotifications => 
            currentNotifications.filter(n => n._id !== notificationId)
        );
    };

    const handleJoin = (courseName) => {
        // TODO: Implement join functionality
        alert(`Joining: ${courseName}`);
    };

    const renderContent = () => {
        if (loading) return <StatusText>Loading...</StatusText>;
        if (error) return <StatusText>{error}</StatusText>;
        if (notifications.length === 0) return <StatusText>You have no new notifications.</StatusText>;

        return notifications.map(notif => (
            <NotificationItem key={notif._id}>
                <NotificationMessage>{notif.message}</NotificationMessage>
                <ButtonContainer>
                    <JoinButton 
                        onClick={() => handleJoin(notif.message)}
                    >
                        Join Us
                    </JoinButton>
                    <CloseButton onClick={() => handleClose(notif._id)}>
                        Close
                    </CloseButton>
                </ButtonContainer>
            </NotificationItem>
        ));
    };

    return (
        <NotificationPopup>
            <PopupHeader>Notifications</PopupHeader>
            {renderContent()}
        </NotificationPopup>
    );
};

export default NotificationPanel;