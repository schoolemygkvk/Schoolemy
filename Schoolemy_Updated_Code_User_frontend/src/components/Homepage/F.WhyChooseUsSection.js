// src/components/Homepage/WhyChooseUsSection.js

import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import { FiCheckCircle } from "react-icons/fi";
import { getWhyChooseUsSection, getDashboardImageUrl } from "../../service/userdashboardApi";

// --- STYLED COMPONENTS ---

const SectionWrapper = styled.section`
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.sectionPadding} 4%;
  overflow: hidden;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing.sectionPadding} 3%;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[8]};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: ${({ theme }) => theme.spacing[12]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 45% 55%;
    gap: ${({ theme }) => theme.spacing[16]};
  }
`;

const ImageColumn = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    min-height: 450px;
    margin: 0;
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  max-width: 450px;
  width: 100%;
  transition: transform 0.3s ease-in-out;

  &:hover {
    transform: translateY(-10px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 350px;
  }
`;

const BackgroundBlob = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: ${({ theme }) => theme.borderRadius['3xl']};
  background: linear-gradient(135deg, #E0FF9A, #FFF078);
  z-index: 1;
  top: -20px;
  left: -20px;
  transform: rotate(-15deg);
`;

const StyledImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  position: relative;
  z-index: 2;
`;

const TextColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size['3xl']};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  margin: 0 0 ${({ theme }) => theme.spacing[8]} 0;
  line-height: 1.3;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size['4xl']};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
    margin: 0 0 ${({ theme }) => theme.spacing[6]} 0;
  }
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.spacing[6]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) and (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing[8]};
  }
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.typography.size.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: transform 0.2s ease-in-out;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  &:hover {
    transform: translateX(8px);
    background-color: rgba(224, 255, 154, 0.1);
  }

  svg {
    color: ${({ theme }) => theme.colors.secondary[500]};
    font-size: 1.5rem;
    flex-shrink: 0;
    margin-top: 2px;
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: scale(1.2);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.size.sm};
    gap: ${({ theme }) => theme.spacing[3]};
    
    svg {
      font-size: 1.25rem;
    }
  }
`;

// Default fallback data when API fails or loads
const DEFAULT_TITLE = "Why Choose GKVK - Gurukula Vidyalaya Kendra?";
const DEFAULT_IMAGE = "/hero1.jpg";
const DEFAULT_FEATURES = [
    "Recognized Certifications – Courses come with certificates from valid educational organizations.",
    "Lifetime Access – One-time purchase, learn forever.",
    "Tutor Upgradation – Courses are updated regularly to keep your learning fresh.",
    "Doubt Support – Get your questions answered directly by expert tutors.",
    "Flexible Payments – EMI options available for many courses.",
    "Global Community – Learn and grow with peers from across the world."
];

// --- REACT COMPONENT ---

const WhyChooseUsSection = () => {
    const [title, setTitle] = useState(DEFAULT_TITLE);
    const [image, setImage] = useState(DEFAULT_IMAGE);
    const [imageFromApi, setImageFromApi] = useState(false);
    const [features, setFeatures] = useState(DEFAULT_FEATURES);

    useEffect(() => {
        const fetchSection = async () => {
            try {
                const res = await getWhyChooseUsSection();
                if (res?.success && res?.data) {
                    const { title: apiTitle, image: apiImage, features: apiFeatures } = res.data;
                    if (apiTitle) setTitle(apiTitle);
                    if (apiImage) {
                        setImage(apiImage);
                        setImageFromApi(true);
                    }
                    if (apiFeatures && Array.isArray(apiFeatures) && apiFeatures.length > 0) {
                        setFeatures(apiFeatures);
                    }
                }
            } catch (err) {
                console.error("Error fetching why choose us section:", err);
            }
        };
        fetchSection();
    }, []);

    const imageSrc = imageFromApi ? getDashboardImageUrl(image) : image;

    return (
        <SectionWrapper>
            <Container>
                <ImageColumn>
                    <ImageWrapper>
                        <BackgroundBlob />
                        <StyledImage src={imageSrc} alt="Students collaborating and learning together in a modern environment" />
                    </ImageWrapper>
                </ImageColumn>

                <TextColumn>
                    <SectionTitle>{title}</SectionTitle>
                    <FeaturesList>
                        {features.map((feature, index) => (
                            <FeatureItem key={index}>
                                <FiCheckCircle />
                                <span>{feature}</span>
                            </FeatureItem>
                        ))}
                    </FeaturesList>
                </TextColumn>
            </Container>
        </SectionWrapper>
    );
};

export default WhyChooseUsSection;