// File: components/NotificationPanel.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from "../../service/api"; // Use centralized API instance

function isNotificationUnread(n) {
  if (n == null) return false;
  if (typeof n.is_read === 'boolean') return !n.is_read;
  if (typeof n.read === 'boolean') return !n.read;
  return false;
}

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
  left: auto;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(149, 157, 165, 0.2);
  border: 1px solid ${BORDER_COLOR};
  width: min(350px, calc(100vw - 32px));
  max-width: calc(100vw - 24px);
  z-index: 1000;
  max-height: min(400px, 70dvh);
  overflow-y: auto;
  font-family: 'Poppins', sans-serif;
  box-sizing: border-box;

  @media (max-width: 768px) {
    position: fixed;
    top: calc(64px + env(safe-area-inset-top, 0px) + 8px);
    left: 12px;
    right: 12px;
    width: auto;
    max-height: min(420px, calc(100dvh - 88px - env(safe-area-inset-bottom, 0px)));
  }

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
`;

const PopupHeader = styled.div`
  padding: 14px 16px;
  font-weight: 600;
  font-size: 1rem;
  color: ${TEXT_PRIMARY};
  border-bottom: 1px solid ${BORDER_COLOR};

  @media (min-width: 480px) {
    padding: 16px 20px;
  }
`;

const NotificationItem = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid ${BORDER_COLOR};
  border-left: 4px solid transparent;
  background: ${(p) => (p.$unread ? "#fffbeb" : "#ffffff")};
  border-left-color: ${(p) => (p.$unread ? "#d97706" : "transparent")};
  box-shadow: ${(p) =>
    p.$unread ? "inset 0 0 0 1px rgba(217, 119, 6, 0.12)" : "none"};

  &:last-child {
    border-bottom: none;
  }

  @media (min-width: 480px) {
    padding: 16px 20px;
  }
`;

const UnreadAlertRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #b45309;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
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
  flex-wrap: wrap;
  gap: 10px;
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
                const { data } = await api.get('/api/v1/bell-notifications');
                setNotifications(data);
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
        toast.info(`Join: ${courseName}`);
    };

    const renderContent = () => {
        if (loading) return <StatusText>Loading...</StatusText>;
        if (error) return <StatusText>{error}</StatusText>;
        if (notifications.length === 0) return <StatusText>You have no new notifications.</StatusText>;

        return notifications.map((notif) => {
            const unread = isNotificationUnread(notif);
            return (
            <NotificationItem key={notif._id} $unread={unread}>
                {unread && (
                    <UnreadAlertRow>
                        <FiAlertCircle size={14} aria-hidden />
                        Alert — unread
                    </UnreadAlertRow>
                )}
                <NotificationMessage>{notif.message}</NotificationMessage>
                <ButtonContainer>
                    <JoinButton
                        type="button"
                        onClick={() => handleJoin(notif.message)}
                    >
                        Join Us
                    </JoinButton>
                    <CloseButton type="button" onClick={() => handleClose(notif._id)}>
                        Close
                    </CloseButton>
                </ButtonContainer>
            </NotificationItem>
            );
        });
    };

    return (
        <NotificationPopup>
            <PopupHeader>Notifications</PopupHeader>
            {renderContent()}
        </NotificationPopup>
    );
};

export default NotificationPanel;