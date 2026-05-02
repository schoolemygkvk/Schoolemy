// src/components/Homepage/TopBannerSection.js

import React, { useState, useEffect } from 'react';
import styled, { css } from "styled-components";
import { Link } from "react-router-dom";
import { getTopBannerSection } from '../../service/userdashboardApi';
import { useAuth } from '../../Context/AuthContext';

// --- STYLED COMPONENTS ---

const BannerWrapper = styled.section`
  width: 100%;
  height: 85vh;
  min-height: 600px;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    height: auto;
    min-height: 0;
  }
`;

const SliderContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  transition: transform 0.7s ease-in-out;
  transform: ${({ currentSlide }) => `translateX(-${currentSlide * 100}%)`};
`;

const Slide = styled.div`
  flex: 0 0 100%;
  height: 100%;
  position: relative;
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    height: auto;
  }
`;

const SlideBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${({ bgImage }) => bgImage});
  background-size: ${({ bgSize }) => bgSize || 'cover'};
  background-position: center;
  background-repeat: no-repeat;
  background-color: #1a1a1a;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.25); 
  }

  @media (max-width: 768px) {
    position: relative;
    height: 0;
    padding-bottom: 47.6%;
    background-size: contain;
    background-color: #000;

    &::after {
      background-color: transparent;
    }
  }
`;

const CustomLayoutContainer = styled.div`
  position: absolute;
  z-index: 2;
  top: ${({ vAlign }) => vAlign || '50%'};
  transform: translateY(-50%);
  max-width: 45%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  left: 8%;

  ${({ hAlign }) =>
    hAlign === 'right' &&
    css`
      left: auto;
      right: 8%;
    `}

  @media (max-width: 1024px) {
    max-width: 55%;
  }

  @media (max-width: 768px) {
    position: relative;
    top: auto; left: auto; right: auto; bottom: auto;
    transform: none;
    
    width: 100%;
    max-width: 100%;
    
    background-color: ${({ theme }) => theme.colors.background.primary};
    
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 24px;
    padding-top: 48px;
  }
`;

const Eyebrow = styled.p`
  background-color: ${({ theme }) => theme.colors.accent[400]};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  display: inline-block;
  margin-bottom: 16px;
  font-size: 14px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.size['3xl']};
  font-weight: ${({ theme }) => theme.typography.weight.semibold || 600};
  color: #fff;
  line-height: 1.4;
  margin: 0;
  margin-bottom: 24px;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.5);

  @media (max-width: 1024px) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size['lg']};
    color: ${({ theme }) => theme.colors.text.primary};
    text-shadow: none;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;

  @media (max-width: 480px) {
    width: 100%;
    align-items: center;
  }
`;

const PrimaryButton = styled(Link)`
  padding: 12px 24px;
  background-color: ${({ theme }) => theme.colors.accent[400]};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  transition: ${({ theme }) => theme.transitions.base};
  box-shadow: ${({ theme }) => theme.shadows.md};
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.colors.accent[500]};
    transform: translateY(-2px);
  }
  @media (max-width: 480px) {
    padding: 10px 16px;
    font-size: 14px;
  }
`;

// CHANGE: This is now a button, not a Link
const SecondaryButton = styled.button`
  padding: 12px 24px;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
  color: #ffffff;
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all 0.3s ease;
  white-space: nowrap;
  cursor: pointer;
  font-family: inherit;
  position: relative;
  
  &:disabled {
    background-color: rgba(128, 128, 128, 0.2);
    color: #888888;
    border-color: rgba(128, 128, 128, 0.3);
    cursor: not-allowed;
    opacity: 0.6;
    pointer-events: none;
  }

  &:hover {
    background-color: ${props => props.disabled ? 'rgba(128, 128, 128, 0.2)' : 'rgba(255, 255, 255, 0.25)'};
    border-color: ${props => props.disabled ? 'rgba(128, 128, 128, 0.3)' : '#ffffff'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
  }

  &:before {
    content: "${props => props.disabled ? 'Already logged in' : 'Sign up for an account'}";
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
  }

  &:hover:before {
    opacity: 1;
    visibility: visible;
  }
  
  @media (max-width: 768px) {
    background-color: ${props => props.disabled ? 'rgba(128, 128, 128, 0.1)' : 'transparent'};
    color: ${props => props.disabled ? '#999999' : ({ theme }) => theme.colors.text.primary};
    border-color: ${props => props.disabled ? 'rgba(128, 128, 128, 0.3)' : ({ theme }) => theme.colors.neutral[400]};
    
    &:hover {
      background-color: ${props => props.disabled ? 'rgba(128, 128, 128, 0.1)' : ({ theme }) => theme.colors.neutral[100]};
      border-color: ${props => props.disabled ? 'rgba(128, 128, 128, 0.3)' : ({ theme }) => theme.colors.neutral[500]};
    }
  }
  
  @media (max-width: 480px) {
    padding: 10px 16px;
    font-size: 14px;
    
    &:before {
      display: none; /* Hide tooltip on mobile */
    }
  }
`;

const DotsContainer = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 3;
  
  @media (max-width: 768px) {
    top: 44%;
    transform: translate(-50%, -50%);
    bottom: auto;
  }
`;

const Dot = styled.button`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background-color: ${({ isActive }) => (isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)')};
  transition: background-color 0.3s ease;
  box-shadow: 0 0 5px rgba(0,0,0,0.3);
`;

// --- REACT COMPONENT ---

const TopBannerSection = ({ onSignUpClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesData, setSlidesData] = useState([]);
  // SECURITY FIX 3.32.1: Tokens in cookies - check AuthContext instead
  const auth = useAuth();
  const isLoggedIn = auth?.isLoggedIn ?? false;

  useEffect(() => {
    let mounted = true;
    const fetchTopBanner = async () => {
      try {
        const res = await getTopBannerSection();
        if (mounted && res?.success) {
          const slides = res.data?.slides ?? [];
          if (slides.length > 0) setSlidesData(slides);
        }
      } catch (err) {
        console.error('Failed to fetch top banner:', err);
      }
    };
    fetchTopBanner();
    return () => { mounted = false; };
  }, []);

  const goToSlide = (slideIndex) => setCurrentSlide(slideIndex);

  useEffect(() => {
    if (slidesData.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev === slidesData.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slidesData.length]);

  // FIX 2.2: When the CMS/API fails or returns no slides, show a static banner instead of
  // rendering nothing (empty dark viewport reads as a "black screen" to users).
  if (slidesData.length === 0) {
    return (
      <BannerWrapper
        style={{
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 45%, #0f3460 100%)",
        }}
      >
        <SliderContainer currentSlide={0}>
          <Slide>
            <CustomLayoutContainer vAlign="50%" hAlign="left">
              <Eyebrow>Schoolemy</Eyebrow>
              <Title>“Learn without limits”</Title>
              <ButtonWrapper>
                <PrimaryButton to="/course">Explore Courses</PrimaryButton>
                {isLoggedIn ? (
                  <SecondaryButton disabled title="Already logged in">
                    Sign Up
                  </SecondaryButton>
                ) : (
                  <SecondaryButton
                    onClick={onSignUpClick}
                    title="Sign up for an account"
                  >
                    Sign Up
                  </SecondaryButton>
                )}
              </ButtonWrapper>
            </CustomLayoutContainer>
          </Slide>
        </SliderContainer>
      </BannerWrapper>
    );
  }

  return (
    <BannerWrapper>
      <SliderContainer currentSlide={currentSlide}>
        {slidesData.map((slide, index) => (
          <Slide key={index}>
            <SlideBackground bgImage={slide.bgImage} bgSize={slide.bgSize} />
            
            <CustomLayoutContainer vAlign={slide.vAlign} hAlign={slide.hAlign}>
              <Eyebrow>{slide.eyebrow}</Eyebrow>
              <Title>“{slide.title}”</Title>
              <ButtonWrapper>
                <PrimaryButton to="/course">Explore Courses</PrimaryButton>
                {isLoggedIn ? (
                  <SecondaryButton 
                    disabled
                    title="Already logged in"
                  >
                    Sign Up
                  </SecondaryButton>
                ) : (
                  <SecondaryButton 
                    onClick={onSignUpClick}
                    title="Sign up for an account"
                  >
                    Sign Up
                  </SecondaryButton>
                )}
              </ButtonWrapper>
            </CustomLayoutContainer>
          </Slide>
        ))}
      </SliderContainer>

      <DotsContainer>
        {slidesData.map((_, index) => (
          <Dot key={index} isActive={index === currentSlide} onClick={() => goToSlide(index)} />
        ))}
      </DotsContainer>
    </BannerWrapper>
  );
};

export default TopBannerSection;