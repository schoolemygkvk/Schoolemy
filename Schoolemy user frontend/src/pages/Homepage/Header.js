// export default Header;
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { useAuth } from "../../Context/AuthContext";

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
} from "react-icons/fi";
import NotificationBell from "../../components/DirectMeet/NotificationBell.js";

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

// --- STYLED COMPONENTS ---

const HeaderWrapper = styled.header`
  background: ${({ theme }) => `linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(255, 255, 255, 0.9) 100%)`};
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  padding: 0 2%;
  height: 80px;
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
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
`;

const LogoImage = styled.img`
  height: 65px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));

  &:hover {
    transform: scale(1.05);
  }
`;

const NavLinks = styled.div`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    gap: ${({ theme }) => theme.spacing[8]};
    align-items: center;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
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
  }

  &::after {
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
    border-radius: ${({ theme }) => theme.borderRadius["2xl"]}
      ${({ theme }) => theme.borderRadius["2xl"]} 0 0;
  }
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

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: relative;
    z-index: 1048;
    gap: ${({ theme }) => theme.spacing[2]};
  }
`;

const ProfileWrapper = styled.div`
  position: relative;
  z-index: 1050;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
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
    display: block;
    font-weight: ${({ theme }) => theme.typography.weight.medium};
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
    top: 120px;
    right: auto;
    left: 50%;
    bottom: auto;
    transform: translateX(-50%);
    width: 90vw;
    max-width: 400px;
    max-height: calc(100vh - 160px);
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
  width: 320px;
  max-width: 85vw;
  height: 100%;
  background: ${({ theme }) => `linear-gradient(180deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(255, 255, 255, 0.95) 100%)`};
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  z-index: 1001;
  transform: ${({ isOpen }) => (isOpen ? "translateX(0)" : "translateX(100%)")};
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: ${({ theme }) => theme.spacing[8]};
  padding-top: ${({ theme }) => theme.spacing[24]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  box-shadow:
    -10px 0px 40px rgba(0, 0, 0, 0.15),
    -4px 0px 16px rgba(0, 0, 0, 0.1);
  border-left: 1px solid
    ${({ theme }) => `rgba(${theme.colors.neutral[200]}, 0.3)`};
  overflow-y: auto;

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
  font-size: ${({ theme }) => theme.typography.size.xl};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};

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
      : "transparent"};
  border: 2px solid
    ${({ isOpen, theme }) =>
      isOpen ? `rgba(${theme.colors.primary[200]}, 0.5)` : "transparent"};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: ${({ theme }) => `linear-gradient(135deg, 
          ${theme.colors.primary[50]}, 
          ${theme.colors.secondary[50]})`};
    border-color: ${({ theme }) => `rgba(${theme.colors.primary[300]}, 0.5)`};
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const MobileExploreSubMenu = styled.div`
  padding-left: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[2]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  max-height: 350px;
  overflow-y: auto;
  animation: ${slideDown} 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.neutral[100]};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => `linear-gradient(180deg, 
        ${theme.colors.primary[400]}, 
        ${theme.colors.secondary[400]})`};
    border-radius: 2px;
  }
`;

const MobileExploreItem = styled(Link)`
  font-size: ${({ theme }) => theme.typography.size.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: ${({ theme }) => `linear-gradient(180deg, 
        ${theme.colors.primary[500]}, 
        ${theme.colors.secondary[500]})`};
    border-radius: 2px;
    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
    background: ${({ theme }) => `linear-gradient(135deg, 
          ${theme.colors.primary[50]}, 
          ${theme.colors.secondary[50]})`};
    padding-left: ${({ theme }) => theme.spacing[6]};
    transform: translateX(4px);

    &::before {
      height: 60%;
    }
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

const ProfileBackdrop = styled.div`
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
  z-index: 1051;
  opacity: ${({ isOpen }) => (isOpen ? "1" : "0")};
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;
// --- DATA FOR EXPLORE MENU ---
const exploreCategories = [
  { label: "Technology", path: "/courses/category/Technology" },
  { label: "Business", path: "/courses/category/Business" },
  {
    label: "Personal Developement",
    path: "/courses/category/Personal Developement",
  },
  { label: "Creative Arts", path: "/courses/category/Creative Arts" },
  { label: "Health & Wellness", path: "/courses/category/Health & Wellness" },
  { label: "Academic", path: "/courses/category/Academic" },
  { label: "Language learning", path: "/courses/category/Language learning" },
  // { label: "Career Developement", path: "/courses/category/Career Developement" },
];

// --- REACT COMPONENT ---
const Header = ({ onLoginClick }) => {
  const { isLoggedIn, logout, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isMobileExploreOpen, setIsMobileExploreOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // All refs are declared here, before they are used.
  const profileRef = useRef(null);
  const exploreRef = useRef(null);

  useOutsideClick(profileRef, () => setIsProfileOpen(false));
  useOutsideClick(exploreRef, () => setIsExploreOpen(false));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        // Use >= for better breakpoint handling
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

  const handleLogout = async () => {
    await logout();
    closeAllMenus();
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
  // ✅ UPDATED: Fix profile picture display for Base64 data
  // Helper function to get profile picture URL from AWS S3 or Base64 data (same as Profile page)
  const getUserPhoto = () => {
    const profilePicture = userData?.profilePicture;

    // Handle null or undefined
    if (!profilePicture) {
      return null;
    }

    // If profilePicture is a string (direct URL), return it
    if (typeof profilePicture === "string") {
      return profilePicture;
    }

    // Priority 1: Check for URL field (AWS S3 or cloud storage)
    if (profilePicture.url) {
      return profilePicture.url;
    }

    // Priority 2: Check for Location field (AWS S3 direct upload response)
    if (profilePicture.Location) {
      return profilePicture.Location;
    }

    // Priority 3: Check for base64 data (supports both legacy 'data' and new 'base64')
    if (profilePicture.data || profilePicture.base64) {
      // Prefer the new 'base64' field if present, otherwise use 'data'
      const rawData = (profilePicture.base64 || profilePicture.data || "")
        .toString()
        .trim();

      // If rawData already includes data:image prefix, return it
      if (rawData.startsWith("data:")) {
        return rawData;
      }

      // Otherwise, construct the data URL from raw base64
      const mimetype = profilePicture.mimetype || "image/jpeg";
      return `data:${mimetype};base64,${rawData}`;
    }

    // No valid image format found
    return null;
  };
  const getDisplayName = () =>
    userData?.username || userData?.email?.split("@")[0] || "User";

  const navItems = [
    { path: "/", label: "Home", icon: <FiHome /> },
    { path: "/course", label: "Courses", icon: <FiBook /> },
    { path: "/Resources", label: "Resources", icon: <FiFileText /> },
    { path: "/events", label: "Event", icon: <FiFileText /> },
    { path: "/blogs", label: "Blog", icon: <FiBookOpen /> },
  ];

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
                  <ExploreMenuContent>
                    {exploreCategories.map((category) => (
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
            {isLoggedIn ? (
              <>
                <NotificationBell />

                {/* Profile Backdrop for Mobile */}
                <ProfileBackdrop
                  isOpen={isProfileOpen && isMobile}
                  onClick={() => setIsProfileOpen(false)}
                />

                <ProfileWrapper ref={profileRef}>
                  <ProfileButton onClick={toggleProfile} isOpen={isProfileOpen}>
                    {getUserPhoto() ? (
                      <ProfileAvatar
                        src={getUserPhoto()}
                        alt="Profile"
                        onError={(e) => {
                          // If image fails to load, hide it and show initial instead
                          e.target.style.display = "none";
                        }}
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
                        {getUserPhoto() ? (
                          <ProfileAvatar
                            src={getUserPhoto()}
                            alt="Profile"
                            onError={(e) => {
                              // If image fails to load, hide it and show initial instead
                              e.target.style.display = "none";
                            }}
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
              <PrimaryButton onClick={handleSignInClick}>
                <FiLogIn /> Sign In
              </PrimaryButton>
            )}

            <MobileMenuIcon
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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

        {/* 1. Explore Button */}
        <MobileExploreButton
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
          <MobileExploreSubMenu>
            {exploreCategories.map((category) => (
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
