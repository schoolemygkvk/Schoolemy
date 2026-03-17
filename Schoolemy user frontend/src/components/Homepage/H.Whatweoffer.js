// src/components/Homepage/WhatWeOfferSection.js

import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import { Link } from "react-router-dom";
import { FaSpa, FaBookMedical, FaStarAndCrescent, FaHandHoldingHeart, FaLeaf, FaBandAid } from 'react-icons/fa';
import { getWhatWeOfferSection } from '../../service/userdashboardApi';

// Map icon strings from API to React icon components
const ICON_MAP = {
  FaSpa,
  FaBookMedical,
  FaStarAndCrescent,
  FaHandHoldingHeart,
  FaLeaf,
  FaBandAid,
  default: FaSpa,
};

const getIconComponent = (iconStr) => {
  if (!iconStr) return ICON_MAP.default;
  return ICON_MAP[iconStr] || ICON_MAP.default;
};

// Default fallback data
const DEFAULT_DATA = {
  title: 'What We Offer',
  description: 'We bring together highly skilled teachers and practitioners who are masters in their fields. Our expertise is rooted in traditional sciences.',
  buttonText: 'Start Now',
  buttonLink: '/course',
  offerings: [
    { title: 'Yoga', icon: 'FaSpa', link: '/course' },
    { title: 'Siddha Medicine', icon: 'FaBookMedical', link: '/course' },
    { title: 'Astrology', icon: 'FaStarAndCrescent', link: '/course' },
    { title: 'Varma Therapy', icon: 'FaHandHoldingHeart', link: '/course' },
    { title: 'Ayurveda', icon: 'FaLeaf', link: '/course' },
    { title: 'Pain Management', icon: 'FaBandAid', link: '/course' },
  ],
};

// --- STYLED COMPONENTS ---

const SectionWrapper = styled.section`
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.sectionPadding} 5%;
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[8]};
  padding: ${({ theme }) => theme.spacing[4]};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]};
    gap: ${({ theme }) => theme.spacing[10]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing[12]};
  }
`;

const TextColumn = styled.div`
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: sticky;
    top: 120px;
    height: fit-content;
    align-self: flex-start;
    max-height: calc(100vh - 140px);
    overflow-y: auto;
  }
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size['5xl']};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[6]} 0;
`;

const SectionDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.size.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const StyledButton = styled(Link)`
  display: inline-block;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[8]};
  background-color: ${({ theme }) => theme.colors.accent[400]};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  transition: ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ theme }) => theme.colors.accent[500]};
    transform: scale(1.05);
  }
`;

const ScrollingColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

// --- THIS IS WHERE THE CHANGES ARE ---

const OfferingCard = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral[800]};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  border: 1px solid ${({ theme }) => theme.colors.neutral[700]};
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      ${({ theme }) => theme.colors.accent[400]}22,
      ${({ theme }) => theme.colors.neutral[800]}
    );
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    border-color: ${({ theme }) => theme.colors.accent[400]};

    &::before {
      opacity: 1;
    }
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[8]};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[5]};
`;

const IconCircle = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  /* --- CHANGE 2: Light border for the icon circle --- */
  border: 2px solid ${({ theme }) => theme.colors.neutral[500]};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  /* --- CHANGE 3: White color for the icon --- */
  color: ${({ theme }) => theme.colors.text.inverse};
  flex-shrink: 0;
`;

const OfferingTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  /* --- CHANGE 4: White color for the text --- */
  color: ${({ theme }) => theme.colors.text.inverse};
  margin: 0;
`;
// --- END OF CHANGES ---


// --- REACT COMPONENT ---

const WhatWeOfferSection = () => {
    const [sectionData, setSectionData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSection = async () => {
            try {
                const response = await getWhatWeOfferSection();
                if (response?.success && response?.data) {
                    setSectionData(response.data);
                } else {
                    setSectionData(DEFAULT_DATA);
                }
            } catch (error) {
                setSectionData(DEFAULT_DATA);
            } finally {
                setLoading(false);
            }
        };
        fetchSection();
    }, []);

    const data = sectionData || DEFAULT_DATA;

    if (loading) {
        return (
            <SectionWrapper>
                <Container>
                    <TextColumn>
                        <SectionTitle>What We Offer</SectionTitle>
                        <SectionDescription>Loading...</SectionDescription>
                    </TextColumn>
                </Container>
            </SectionWrapper>
        );
    }

    return (
        <SectionWrapper>
            <Container>
                <TextColumn>
                    <SectionTitle>{data.title}</SectionTitle>
                    <SectionDescription>{data.description}</SectionDescription>
                    <StyledButton to={data.buttonLink || '/course'}>{data.buttonText || 'Start Now'}</StyledButton>
                </TextColumn>

                <ScrollingColumn>
                    {data.offerings?.map((item, index) => {
                        const IconComponent = getIconComponent(item.icon);
                        return (
                            <Link 
                                to={item.link || '/course'} 
                                key={index} 
                                style={{ textDecoration: 'none' }}
                            >
                                <OfferingCard>
                                    <CardHeader>
                                        <IconCircle><IconComponent /></IconCircle>
                                        <OfferingTitle>{item.title}</OfferingTitle>
                                    </CardHeader>
                                </OfferingCard>
                            </Link>
                        );
                    })}
                </ScrollingColumn>
            </Container>
        </SectionWrapper>
    );
};

export default WhatWeOfferSection;