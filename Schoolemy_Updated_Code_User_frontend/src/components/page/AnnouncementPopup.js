import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaBell, FaTimes, FaSync } from 'react-icons/fa';

// Modern Smooth Animations
const fadeIn = keyframes`
  from { 
    opacity: 0;
  }
  to { 
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from { 
    transform: translateY(30px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Clean Modern Backdrop
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.3s ease-out;
  padding: 20px;
  box-sizing: border-box;
`;

// Modern Card Style Popup (desktop + mobile)
const PopupContainer = styled.div`
  position: relative;
  background: #ffffff;
  padding: 1.75rem 1.5rem 1.5rem;
  border-radius: 16px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 360px;
  width: 100%;
  text-align: center;
  animation: ${slideUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 48px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    max-width: 92%;
    padding: 1.5rem 1.25rem 1.25rem;
    margin-top: 40px;
  }

  @media (max-width: 480px) {
    max-width: 94%;
    padding: 1.25rem 1rem 1rem;
    border-radius: 14px;
    margin-top: 32px;
  }
`;

// Simple Close Button (larger & touch-friendly)
const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #f3f4f6;
  border: none;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #374151;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 480px) {
    width: 34px;
    height: 34px;
    font-size: 1rem;
  }
`;

// Refresh Button
const RefreshButton = styled.button`
  position: absolute;
  top: 12px;
  right: 48px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(245, 158, 11, 0.2);
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    animation: ${props => props.loading ? `${spin} 1s linear infinite` : 'none'};
  }
`;

// Hero Image Wrapper
const ImageWrapper = styled.div`
  position: relative;
  margin: -1.5rem -1.5rem 1.25rem;
  border-radius: 16px 16px 12px 12px;
  overflow: hidden;
  background: radial-gradient(circle at top left, #fef3c7, #f9fafb);
  max-height: 220px;

  @media (max-width: 768px) {
    margin: -1.25rem -1.25rem 1rem;
    max-height: 200px;
  }

  @media (max-width: 480px) {
    margin: -1rem -1rem 0.75rem;
    max-height: 180px;
  }
`;

const AnnouncementImage = styled.img`
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;

  @media (max-width: 768px) {
    height: 200px;
  }

  @media (max-width: 480px) {
    height: 180px;
  }
`;

// Modern Icon Badge (fallback when no image)
const IconBadge = styled.div`
  background: linear-gradient(135deg, #f59e0b, #eab308);
  color: #ffffff;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.25rem;
  box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3);
  animation: ${pulse} 2s ease-in-out infinite;

  @media (max-width: 480px) {
    width: 56px;
    height: 56px;
    font-size: 1.75rem;
  }
`;

// Clean Title
const Title = styled.h2`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
  line-height: 1.3;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

// Simple Content
const Content = styled.p`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.95rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

// Modern Primary Button
const PrimaryButton = styled.a`
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(135deg, #f59e0b, #eab308);
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
    background: linear-gradient(135deg, #eab308, #f59e0b);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    display: block;
    width: 100%;
    text-align: center;
  }
`;

// Simple Text Button
const TextButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 8px;

  &:hover {
    color: #6b7280;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AnnouncementPopup = ({ announcement, onClose, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const handleRefresh = async () => {
    setIsLoading(true);
    if (onRefresh) {
      await onRefresh();
    }
    setIsLoading(false);
  };

  if (!announcement) return null;

  const hasImage = Boolean(announcement.image_path);

  return (
    <Backdrop onClick={onClose}>
      <PopupContainer onClick={(e) => e.stopPropagation()}>
        <RefreshButton 
          onClick={handleRefresh} 
          disabled={isLoading}
          loading={isLoading}
          title="Refresh announcement"
        >
          <FaSync />
        </RefreshButton>
        <CloseButton onClick={onClose}>
          <FaTimes />
        </CloseButton>
        {hasImage ? (
          <ImageWrapper>
            <AnnouncementImage
              src={announcement.image_path}
              alt={announcement.title || 'Announcement image'}
            />
          </ImageWrapper>
        ) : (
          <IconBadge>
            <FaBell />
          </IconBadge>
        )}
        <Title>{announcement.title}</Title>
        <Content>{announcement.content}</Content>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          {announcement.button_url && announcement.button_text && (
            <PrimaryButton href={announcement.button_url} target="_blank" rel="noopener noreferrer">
              {announcement.button_text}
            </PrimaryButton>
          )}
          <TextButton onClick={onClose}>Maybe Later</TextButton>
        </div>
      </PopupContainer>
    </Backdrop>
  );
};

export default AnnouncementPopup;
