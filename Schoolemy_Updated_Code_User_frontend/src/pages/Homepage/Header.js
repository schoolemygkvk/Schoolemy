// export default Header;
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { useAuth } from "../../Context/AuthContext";
import { getProfilePictureUrl } from "../../utils/profileImageUrl";

import {
  FiChevronDown,
  FiHome,
  FiBook,
  FiBookOpen,
  FiUser,
  FiLogOut,
  FiLogIn,
  FiMenu,
  FiX,
  FiFileText,
  FiHeart,
} from "react-icons/fi";
import NotificationBell from "../../components/DirectMeet/NotificationBell.js";
import { getCategorySection } from "../../service/userdashboardApi";
import {
  DEFAULT_HOMEPAGE_CATEGORIES,
  toExploreLinks,
} from "../../constants/homepageCategories";

// --- HOOK ---
const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
};

// --- ANIMATIONS ---
const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px) translateX(-50%);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
`;

/* Mobile drawer: never use translateX(-50%) here — it pulls the submenu off-screen */
const mobileExploreReveal = keyframes`
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`;

// --- STYLED COMPONENTS ---

const HeaderWrapper = styled.header`
  background: ${({ theme }) => `linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(255, 255, 255, 0.9) 100%)`};
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  padding: 0 clamp(12px, 3vw, 28px);
  min-height: 64px;
  height: auto;
  border-bottom: 1px solid
    ${({ theme }) => `rgba(${theme.colors.neutral[200]}, 0.3)`};
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};
  display: flex;
  align-items: center;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    min-height: 80px;
    height: 80px;
    padding: 0 2%;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${({ theme }) => `linear-gradient(90deg, 
      transparent 0%, 
      ${theme.colors.primary[400]} 50%, 
      transparent 100%)`};
    opacity: 0.3;
  }
`;

const NavContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  gap: 8px;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(0, 1fr) minmax(0, auto);
    align-items: center;
    column-gap: ${({ theme }) => theme.spacing[4]};
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    justify-self: start;
  }
`;

const LogoImage = styled.img`
  height: 44px;
  width: auto;
  max-width: min(160px, 42vw);
  object-fit: contain;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    height: 65px;
    max-width: none;
  }

  &:hover {
    transform: scale(1.05);
  }
`;

const NavLinks = styled.div`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    flex-wrap: nowrap;
    gap: ${({ theme }) => theme.spacing[4]};
    align-items: center;
    justify-content: center;
    justify-self: center;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    white-space: nowrap;
    overflow: visible;
  }
`;

const NavLink = styled(Link)`
  font-size: ${({ theme }) => theme.typography.size.base};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[600] : theme.colors.text.secondary};
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  position: relative;

  &::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: ${({ isActive }) => (isActive ? "80%" : "0")};
    height: 2px;
    background: ${({ theme }) => `linear-gradient(90deg, 
      ${theme.colors.primary[500]}, 
      ${theme.colors.secondary[500]})`};
    border-radius: 2px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
    background: ${({ theme }) => `linear-gradient(135deg, 
      ${theme.colors.primary[50]}, 
      ${theme.colors.secondary[50]})`};

    &::before {
      width: 80%;
    }
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ExploreButton = styled.button`
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.size.base};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[600] : theme.colors.text.secondary};
  background: ${({ isActive, theme }) =>
    isActive
      ? `linear-gradient(135deg, ${theme.colors.primary[50]}, ${theme.colors.secondary[50]})`
      : "transparent"};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: ${({ isActive }) => (isActive ? "80%" : "0")};
    height: 2px;
    background: ${({ theme }) => `linear-gradient(90deg, 
      ${theme.colors.primary[500]}, 
      ${theme.colors.secondary[500]})`};
    border-radius: 2px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
    background: ${({ theme }) => `linear-gradient(135deg, 
      ${theme.colors.primary[50]}, 
      ${theme.colors.secondary[50]})`};
    transform: translateY(-1px);

    &::after {
      width: 80%;
    }
  }

  svg {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const ExploreMenuWrapper = styled.div`
  position: absolute;
  top: calc(100% + 16px);
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => `linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(255, 255, 255, 0.95) 100%)`};
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius["2xl"]};
  border: 1px solid ${({ theme }) => `rgba(${theme.colors.neutral[200]}, 0.5)`};
  min-width: 720px;
  max-width: 880px;
  animation: ${slideDown} 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    /* Clamp to viewport so the dropdown never renders half off-screen */
    position: fixed;
    top: 88px;
    left: 50%;
    transform: translateX(-50%);
    width: min(880px, calc(100vw - 24px));
    min-width: 0;
    max-width: calc(100vw - 24px);
  }

  &::before {
    content: "";
    position: absolute;
    top: -16px;
    left: 0;
    right: 0;
    height: 16px;
    background: transparent;
  }

  &::after {
    content: "";
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 8px solid rgba(255, 255, 255, 0.98);
    filter: drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.05));
    pointer-events: none;
  }
`;

const ExploreMenuAccent = styled.div`
  position: absolute;
  top: 0;
  left: ${({ theme }) => theme.spacing[6]};
  right: ${({ theme }) => theme.spacing[6]};
  height: 1px;
  border-radius: ${({ theme }) => theme.borderRadius["2xl"]}
    ${({ theme }) => theme.borderRadius["2xl"]} 0 0;
  background: ${({ theme }) => `linear-gradient(90deg, 
    transparent 0%, 
    ${theme.colors.primary[400]} 50%, 
    transparent 100%)`};
  pointer-events: none;
`;

const ExploreMenuContent = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[2]};

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ExploreMenuItem = styled(Link)`
  font-size: ${({ theme }) => theme.typography.size.base};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  position: relative;
  white-space: nowrap;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    height: 100%;
    background: ${({ theme }) => `linear-gradient(180deg, 
      ${theme.colors.primary[500]}, 
      ${theme.colors.secondary[500]})`};
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: ${({ theme }) => `linear-gradient(135deg, 
      ${theme.colors.primary[50]}, 
      ${theme.colors.secondary[50]})`};
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: -1;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
    transform: translateX(6px) translateY(-2px);
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    &::before {
      transform: scaleY(1);
    }

    &::after {
      opacity: 1;
    }
  }

  &:active {
    transform: translateX(4px) translateY(0);
  }
`;

const ExploreContainer = styled.div`
  position: relative;
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-shrink: 0;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    justify-self: end;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: relative;
    z-index: 1048;
    gap: 6px;
  }
`;

/* Profile dropdown: desktop only — mobile uses the slide-out menu (no duplicate account UI) */
const ProfileWrapper = styled.div`
  position: relative;
  z-index: 1050;
  display: flex;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const AuthLoadingSkeleton = styled.div`
  width: 100px;
  height: 40px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  animation: ${pulse} 2s infinite;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[5]};
  background-color: ${({ theme }) => theme.colors.neutral[900]};
  color: ${({ theme }) => theme.colors.text.inverse};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  font-size: ${({ theme }) => theme.typography.size.base};
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.base};
  z-index: 1048;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: ${({ theme }) => theme.spacing[2]}
      ${({ theme }) => theme.spacing[4]};
    font-size: ${({ theme }) => theme.typography.size.sm};
    min-height: 44px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`;

const DesktopSignInButton = styled(PrimaryButton)`
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  background: ${({ isOpen, theme }) =>
    isOpen
      ? `linear-gradient(135deg, ${theme.colors.primary[50]}, ${theme.colors.secondary[50]})`
      : "transparent"};
  border: 2px solid
    ${({ isOpen, theme }) =>
      isOpen ? `rgba(${theme.colors.primary[200]}, 0.5)` : "transparent"};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1050;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: ${({ theme }) => theme.spacing[2]}
      ${({ theme }) => theme.spacing[2]};
    gap: ${({ theme }) => theme.spacing[1]};
    min-height: 48px;
  }

  &:hover {
    background: ${({ theme }) => `linear-gradient(135deg, 
      ${theme.colors.primary[50]}, 
      ${theme.colors.secondary[50]})`};
    border-color: ${({ theme }) => `rgba(${theme.colors.primary[300]}, 0.5)`};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ProfileAvatar = styled.img`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.colors.primary[200]};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 42px;
    height: 42px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
  }
`;

const AvatarPlaceholder = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: ${({ theme }) => `linear-gradient(135deg, 
    ${theme.colors.primary[400]}, 
    ${theme.colors.secondary[400]})`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.inverse};
  font-size: 18px;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid ${({ theme }) => theme.colors.primary[200]};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 42px;
    height: 42px;
    font-size: 16px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
    transform: scale(1.05);
  }
`;

const ProfileName = styled.span`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: inline-block;
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 1280px) {
    display: none;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 48px);
  right: 0;
  background: ${({ theme }) => `linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(255, 255, 255, 0.95) 100%)`};
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  border: 1px solid ${({ theme }) => `rgba(${theme.colors.neutral[200]}, 0.5)`};
  width: 320px;
  min-width: 280px;
  max-width: 90vw;
  z-index: 1052;
  overflow: hidden;
  animation: ${slideUp} 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: fixed;
    top: calc(64px + env(safe-area-inset-top, 0px) + 12px);
    right: auto;
    left: 50%;
    bottom: auto;
    transform: translateX(-50%);
    width: min(calc(100vw - 24px), 400px);
    max-width: 400px;
    max-height: min(480px, calc(100vh - 100px - env(safe-area-inset-bottom, 0px)));
    overflow-y: auto;
    z-index: 1052;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${({ theme }) => `linear-gradient(90deg, 
      transparent 0%, 
      ${theme.colors.primary[400]} 50%, 
      transparent 100%)`};
  }
`;

const DropdownHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  border-bottom: 1px solid
    ${({ theme }) => `rgba(${theme.colors.neutral[200]}, 0.3)`};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => `linear-gradient(135deg, 
      ${theme.colors.primary[50]}, 
      ${theme.colors.secondary[50]})`};
`;

const DropdownUserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  flex: 1;
  min-width: 0;
`;

const DropdownUserName = styled.div`
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  font-size: ${({ theme }) => theme.typography.size.base};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
  word-break: break-word;
`;

const DropdownUserEmail = styled.div`
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.4;
  word-break: break-all;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
`;

const DropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  font-weight: ${({ theme }) => theme.typography.weight.medium};

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${({ theme }) => `linear-gradient(180deg, 
      ${theme.colors.primary[500]}, 
      ${theme.colors.secondary[500]})`};
    transform: scaleY(0);
    transform-origin: center;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    background: ${({ theme }) => `linear-gradient(135deg, 
      ${theme.colors.primary[50]}, 
      ${theme.colors.secondary[50]})`};
    color: ${({ theme }) => theme.colors.primary[700]};
    padding-left: ${({ theme }) => theme.spacing[6]};

    &::before {
      transform: scaleY(1);
    }
  }
`;

const LogoutButton = styled(DropdownItem).attrs({ as: "button" })`
  width: 100%;
  color: ${({ theme }) => theme.colors.error.main};
  border-top: 1px solid
    ${({ theme }) => `rgba(${theme.colors.neutral[200]}, 0.3)`};
  margin-top: ${({ theme }) => theme.spacing[1]};

  &::before {
    background: ${({ theme }) => `linear-gradient(180deg, 
      ${theme.colors.error.main}, 
      ${theme.colors.error.dark})`};
  }

  &:hover {
    background: ${({ theme }) => `linear-gradient(135deg, 
      ${theme.colors.error.light}, 
      rgba(254, 226, 226, 0.5))`};
    color: ${({ theme }) => theme.colors.error.dark};
  }
`;

const MobileMenuIcon = styled.button`
  display: block;
  background: ${({ isOpen, theme }) =>
    isOpen
      ? `linear-gradient(135deg, ${theme.colors.primary[50]}, ${theme.colors.secondary[50]})`
      : "transparent"};
  border: 2px solid
    ${({ isOpen, theme }) =>
      isOpen ? `rgba(${theme.colors.primary[200]}, 0.5)` : "transparent"};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 1.8rem;
  cursor: pointer;
  z-index: 1003;
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing[2]};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => `linear-gradient(135deg, 
      ${theme.colors.primary[50]}, 
      ${theme.colors.secondary[50]})`};
    transform: scale(1.1);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const MobileMenuContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(360px, calc(100vw - 40px));
  max-width: 100%;
  /* Fixed viewport height so overflow-y can scroll (body is overflow:hidden when open) */
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  box-sizing: border-box;
  background: ${({ theme }) => `linear-gradient(180deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(255, 255, 255, 0.95) 100%)`};
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  z-index: 1001;
  transform: ${({ isOpen }) => (isOpen ? "translateX(0)" : "translateX(100%)")};
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: ${({ theme }) => theme.spacing[6]};
  padding-top: calc(
    ${({ theme }) => theme.spacing[20]} + env(safe-area-inset-top, 0px)
  );
  padding-bottom: calc(
    ${({ theme }) => theme.spacing[6]} + env(safe-area-inset-bottom, 0px)
  );
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  box-shadow:
    -10px 0px 40px rgba(0, 0, 0, 0.15),
    -4px 0px 16px rgba(0, 0, 0, 0.1);
  border-left: 1px solid
    ${({ theme }) => `rgba(${theme.colors.neutral[200]}, 0.3)`};
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${({ theme }) => `linear-gradient(90deg, 
      transparent 0%, 
      ${theme.colors.primary[400]} 50%, 
      transparent 100%)`};
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => `rgba(${theme.colors.neutral[100]}, 0.5)`};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => `linear-gradient(180deg, 
      ${theme.colors.primary[400]}, 
      ${theme.colors.secondary[400]})`};
    border-radius: 3px;
  }
`;
const MobileNavLink = styled(NavLink)`
  font-size: clamp(
    ${({ theme }) => theme.typography.size.base},
    4.2vw,
    ${({ theme }) => theme.typography.size.xl}
  );
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  word-break: break-word;

  &::before {
    display: none;
  }

  &:hover {
    background: ${({ theme }) => `linear-gradient(135deg, 
          ${theme.colors.primary[50]}, 
          ${theme.colors.secondary[50]})`};
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const MobileExploreButton = styled.button`
  font-size: ${({ theme }) => theme.typography.size.xl};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  width: 100%;
  text-align: left;
  background: ${({ isOpen, theme }) =>
    isOpen
      ? `linear-gradient(135deg, ${theme.colors.primary[50]}, ${theme.colors.secondary[50]})`
      : `rgba(15, 23, 42, 0.04)`};
  border: 2px solid
    ${({ isOpen, theme }) =>
      isOpen
        ? `rgba(${theme.colors.primary[200]}, 0.55)`
        : `rgba(148, 163, 184, 0.45)`};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.primary[600]};
  }

  &:hover {
    background: ${({ theme }) => `linear-gradient(135deg, 
          ${theme.colors.primary[50]}, 
          ${theme.colors.secondary[50]})`};
    border-color: ${({ theme }) => `rgba(${theme.colors.primary[300]}, 0.55)`};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
`;

const MobileExploreSubMenu = styled.div`
  margin-top: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  padding-left: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-left: 3px solid ${({ theme }) => theme.colors.primary[500]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  /* Let the drawer scroll; avoid nested tiny scroll + horizontal clip */
  max-height: none;
  overflow: visible;
  animation: ${mobileExploreReveal} 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
`;

const MobileExploreItem = styled(Link)`
  font-size: ${({ theme }) => theme.typography.size.base};
  color: #0f172a;
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  transition: background 0.2s ease, color 0.2s ease;
  position: relative;
  word-break: break-word;
  line-height: 1.35;
  border: 1px solid transparent;

  &:hover,
  &:active {
    color: ${({ theme }) => theme.colors.primary[700]};
    background: ${({ theme }) => `linear-gradient(135deg, 
          ${theme.colors.primary[50]}, 
          ${theme.colors.secondary[50]})`};
    border-color: rgba(148, 163, 184, 0.25);
  }
`;

const MobileUserSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => `linear-gradient(135deg, 
    ${theme.colors.primary[50]}, 
    ${theme.colors.secondary[50]})`};
  border: 1px solid ${({ theme }) => `rgba(${theme.colors.primary[200]}, 0.3)`};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const MobileUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const MobileUserName = styled.div`
  flex: 1;
  min-width: 0;
`;

const MobileUserNameText = styled.div`
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  font-size: ${({ theme }) => theme.typography.size.base};
  color: ${({ theme }) => theme.colors.text.primary};
  word-break: break-word;
`;

const MobileUserEmail = styled.div`
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  word-break: break-all;
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

const MobileUserActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding-top: ${({ theme }) => theme.spacing[3]};
  border-top: 1px solid
    ${({ theme }) => `rgba(${theme.colors.primary[200]}, 0.3)`};
`;

const MobileActionLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: ${({ theme }) => `rgba(${theme.colors.primary[200]}, 0.2)`};
    color: ${({ theme }) => theme.colors.primary[700]};
    padding-left: ${({ theme }) => theme.spacing[4]};
  }
`;

const MobileLogoutButton = styled(MobileActionLink).attrs({ as: "button" })`
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.error.main};

  &:hover {
    background: ${({ theme }) => `rgba(${theme.colors.error.main}, 0.1)`};
    color: ${({ theme }) => theme.colors.error.dark};
  }
`;

const MobileDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => `linear-gradient(90deg, 
    transparent 0%, 
    ${theme.colors.neutral[300]} 50%, 
    transparent 100%)`};
  margin: ${({ theme }) => theme.spacing[2]} 0;
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ isOpen }) =>
    isOpen
      ? "linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6))"
      : "transparent"};
  backdrop-filter: ${({ isOpen }) => (isOpen ? "blur(4px)" : "none")};
  -webkit-backdrop-filter: ${({ isOpen }) => (isOpen ? "blur(4px)" : "none")};
  z-index: 999;
  opacity: ${({ isOpen }) => (isOpen ? "1" : "0")};
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

// --- REACT COMPONENT ---
const Header = ({ onLoginClick }) => {
  const { isLoggedIn, logout, userData, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isMobileExploreOpen, setIsMobileExploreOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [exploreItems, setExploreItems] = useState(() =>
    toExploreLinks(DEFAULT_HOMEPAGE_CATEGORIES),
  );

  // All refs are declared here, before they are used.
  const profileRef = useRef(null);
  const exploreRef = useRef(null);

  useOutsideClick(profileRef, () => setIsProfileOpen(false));
  useOutsideClick(exploreRef, () => setIsExploreOpen(false));

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    // Close profile menu when mobile menu opens
    if (isMobileMenuOpen) {
      setIsProfileOpen(false);
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsExploreOpen(false); // Close explore menu on route change
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    const loadExploreCategories = async () => {
      try {
        const res = await getCategorySection();
        const cats = res?.data?.categories;
        if (
          mounted &&
          res?.success &&
          Array.isArray(cats) &&
          cats.length > 0
        ) {
          setExploreItems(toExploreLinks(cats));
        }
      } catch {
        // Keep defaults (same as homepage category section)
      }
    };
    loadExploreCategories();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Reset photo error state when user data changes (e.g. after uploading new picture)
    setPhotoError(false);
  }, [userData]);

  const handleLogout = async () => {
    closeAllMenus();
    await logout();
    navigate("/");
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    setIsExploreOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
  };

  const handleExploreClick = (e) => {
    e.stopPropagation();
    setIsExploreOpen(true);
    setIsProfileOpen(false);
  };

  const handleSignInClick = () => {
    if (onLoginClick) onLoginClick();
    closeAllMenus();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;
  // UPDATED: Fix profile picture display for Base64 data
  // Helper function to get profile picture URL from AWS S3 or Base64 data (same as Profile page)
  const getUserPhoto = () => getProfilePictureUrl(userData);
  const getDisplayName = () =>
    userData?.username || userData?.email?.split("@")[0] || "User";

  const navItems = useMemo(() => {
    const items = [
      { path: "/", label: "Home", icon: <FiHome /> },
      { path: "/course", label: "Courses", icon: <FiBook /> },
    ];
    if (isLoggedIn && !isAuthLoading) {
      items.push(
        { path: "/wishlist", label: "Wishlist", icon: <FiHeart /> },
        { path: "/Resources", label: "Resources", icon: <FiFileText /> },
      );
    }
    items.push(
      { path: "/events", label: "Event", icon: <FiFileText /> },
      { path: "/blogs", label: "Blog", icon: <FiBookOpen /> },
    );
    return items;
  }, [isLoggedIn, isAuthLoading]);

  return (
    <div>
      <HeaderWrapper>
        <NavContainer>
          <LogoLink to="/" onClick={closeAllMenus}>
            <LogoImage src="/Logo.png" alt="Schoolemy Logo" />
          </LogoLink>

          <NavLinks>
            <ExploreContainer
              ref={exploreRef}
              onMouseEnter={() => setIsExploreOpen(true)}
              onMouseLeave={() => setIsExploreOpen(false)}
            >
              <ExploreButton
                isActive={isExploreOpen}
                onClick={handleExploreClick}
              >
                Explore{" "}
                <FiChevronDown
                  style={{
                    transform: isExploreOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </ExploreButton>

              {isExploreOpen && (
                <ExploreMenuWrapper>
                  <ExploreMenuAccent aria-hidden />
                  <ExploreMenuContent>
                    {exploreItems.map((category) => (
                      <ExploreMenuItem
                        key={category.label}
                        to={category.path}
                        onClick={closeAllMenus}
                      >
                        {category.label}
                      </ExploreMenuItem>
                    ))}
                  </ExploreMenuContent>
                </ExploreMenuWrapper>
              )}
            </ExploreContainer>

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                isActive={isActive(item.path)}
              >
                {item.label}
              </NavLink>
            ))}
          </NavLinks>

          <ActionButtons>
            {isAuthLoading ? (
              <AuthLoadingSkeleton />
            ) : isLoggedIn ? (
              <>
                <NotificationBell />

                <ProfileWrapper ref={profileRef}>
                  <ProfileButton onClick={toggleProfile} isOpen={isProfileOpen}>
                    {getUserPhoto() && !photoError ? (
                      <ProfileAvatar
                        src={getUserPhoto()}
                        alt="Profile"
                        onError={() => setPhotoError(true)}
                      />
                    ) : (
                      <AvatarPlaceholder>
                        {getDisplayName().charAt(0).toUpperCase()}
                      </AvatarPlaceholder>
                    )}
                    <ProfileName>{getDisplayName()}</ProfileName>
                    <FiChevronDown
                      style={{
                        opacity: 0.7,
                        transform: isProfileOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition:
                          "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </ProfileButton>

                  {isProfileOpen && (
                    <DropdownMenu>
                      <DropdownHeader>
                        {getUserPhoto() && !photoError ? (
                          <ProfileAvatar
                            src={getUserPhoto()}
                            alt="Profile"
                            onError={() => setPhotoError(true)}
                          />
                        ) : (
                          <AvatarPlaceholder>
                            {getDisplayName().charAt(0).toUpperCase()}
                          </AvatarPlaceholder>
                        )}
                        <DropdownUserInfo>
                          <DropdownUserName>
                            {getDisplayName()}
                          </DropdownUserName>
                          {userData?.email && (
                            <DropdownUserEmail>
                              {userData.email}
                            </DropdownUserEmail>
                          )}
                        </DropdownUserInfo>
                      </DropdownHeader>
                      <DropdownItem to="/dashboard" onClick={closeAllMenus}>
                        {" "}
                        <FiUser /> Dashboard
                      </DropdownItem>
                      <LogoutButton onClick={handleLogout}>
                        {" "}
                        <FiLogOut /> Sign Out
                      </LogoutButton>
                    </DropdownMenu>
                  )}
                </ProfileWrapper>
              </>
            ) : (
              <DesktopSignInButton onClick={handleSignInClick}>
                <FiLogIn /> Sign In
              </DesktopSignInButton>
            )}

            <MobileMenuIcon
              onClick={() => {
                setIsProfileOpen(false);
                setIsMobileMenuOpen((open) => !open);
              }}
              isOpen={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <FiX /> : <FiMenu />}
            </MobileMenuIcon>
          </ActionButtons>
        </NavContainer>
      </HeaderWrapper>

      <Backdrop isOpen={isMobileMenuOpen} onClick={closeAllMenus} />

      <MobileMenuContainer isOpen={isMobileMenuOpen}>
        {/* Mobile Sign In Button */}
        {!isLoggedIn && (
          <>
            <PrimaryButton
              onClick={handleSignInClick}
              style={{ width: "100%", justifyContent: "center" }}
            >
              <FiLogIn /> Sign In
            </PrimaryButton>
            <MobileDivider />
          </>
        )}

        {isLoggedIn && !isAuthLoading && (
          <>
            <MobileUserSection>
              <MobileUserInfo>
                {getUserPhoto() && !photoError ? (
                  <ProfileAvatar
                    src={getUserPhoto()}
                    alt="Profile"
                    style={{ width: "44px", height: "44px" }}
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <AvatarPlaceholder
                    style={{ width: "44px", height: "44px", fontSize: "16px" }}
                  >
                    {getDisplayName().charAt(0).toUpperCase()}
                  </AvatarPlaceholder>
                )}
                <MobileUserName>
                  <MobileUserNameText>{getDisplayName()}</MobileUserNameText>
                  {userData?.email && (
                    <MobileUserEmail>{userData.email}</MobileUserEmail>
                  )}
                </MobileUserName>
              </MobileUserInfo>
              <MobileUserActions>
                <MobileActionLink to="/dashboard" onClick={closeAllMenus}>
                  <FiUser /> Dashboard
                </MobileActionLink>
                <MobileLogoutButton type="button" onClick={handleLogout}>
                  <FiLogOut /> Sign Out
                </MobileLogoutButton>
              </MobileUserActions>
            </MobileUserSection>
            <MobileDivider />
          </>
        )}

        {/* 1. Explore Button */}
        <MobileExploreButton
          type="button"
          aria-expanded={isMobileExploreOpen}
          aria-controls="mobile-explore-categories"
          id="mobile-explore-toggle"
          onClick={() => setIsMobileExploreOpen(!isMobileExploreOpen)}
          isOpen={isMobileExploreOpen}
        >
          Explore
          <FiChevronDown
            style={{
              transform: isMobileExploreOpen
                ? "rotate(180deg)"
                : "rotate(0deg)",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </MobileExploreButton>

        {isMobileExploreOpen && (
          <MobileExploreSubMenu
            id="mobile-explore-categories"
            role="region"
            aria-labelledby="mobile-explore-toggle"
          >
            {exploreItems.map((category) => (
              <MobileExploreItem
                key={category.label}
                to={category.path}
                onClick={closeAllMenus}
              >
                {category.label}
              </MobileExploreItem>
            ))}
          </MobileExploreSubMenu>
        )}

        {/* 3. மற்ற Nav Links */}
        {navItems.map((item) => (
          <MobileNavLink
            key={item.path}
            to={item.path}
            isActive={isActive(item.path)}
            onClick={closeAllMenus}
          >
            {item.label}
          </MobileNavLink>
        ))}
      </MobileMenuContainer>
    </div>
  );
};

export default Header;
