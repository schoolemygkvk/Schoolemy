// src/components/Homepage/Herosection.js

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaStarOfLife, FaUserGraduate, FaGraduationCap, FaBook } from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi";
import { getHeroSection, getDashboardImageUrl } from "../../service/userdashboardApi";

// Map API icon names to React icon components (fallback when API returns icon name instead of URL)
const ICON_MAP = {
  FaUserGraduate,
  FaGraduationCap,
  FaBook,
};

const isImageUrl = (str) =>
  str &&
  (str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("/") ||
    str.startsWith("data:"));

const renderCardIcon = (iconValue) => {
  if (!iconValue) return <FaUserGraduate />;
  if (isImageUrl(iconValue)) {
    const src = getDashboardImageUrl(iconValue);
    return <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
  }
  const IconComponent = ICON_MAP[iconValue];
  return IconComponent ? <IconComponent /> : <FaUserGraduate />;
};

// --- STYLED COMPONENTS (with mobile responsiveness updates) ---

const HeroContainer = styled.section`
  max-width: 1300px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[10]}
    ${({ theme }) => theme.spacing[4]};
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[8]};
  align-items: center;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[16]}
      ${({ theme }) => theme.spacing[6]};
    gap: ${({ theme }) => theme.spacing[10]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
    padding: ${({ theme }) => theme.spacing[16]}
      ${({ theme }) => theme.spacing[8]}
      ${({ theme }) => theme.spacing[10]}
      ${({ theme }) => theme.spacing[8]};
    gap: ${({ theme }) => theme.spacing[12]};
  }
`;

const HeroTextContent = styled.div`
  text-align: center;
  order: 2;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    text-align: left;
    order: 1;
  }
`;

const Eyebrow = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[4]};
  background-color: ${({ theme }) => theme.colors.accent[100]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-weight: ${({ theme }) => theme.typography.weight.medium};
  font-size: ${({ theme }) => theme.typography.size.xs};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.text.secondary};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.sm};
    padding: ${({ theme }) => theme.spacing[2]}
      ${({ theme }) => theme.spacing[5]};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }

  svg {
    font-size: 0.6rem;

    @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
      font-size: 0.75rem;
    }

    color: ${({ theme }) => theme.colors.accent[500]};
  }
`;

const Headline = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.size.xl};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size["2xl"]};
    margin-bottom: ${({ theme }) => theme.spacing[5]};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    font-size: ${({ theme }) => theme.typography.size["3xl"]};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 550px;
  margin: 0 auto ${({ theme }) => theme.spacing[6]} auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.base};
    margin: 0 auto ${({ theme }) => theme.spacing[7]} auto;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin: 0 0 ${({ theme }) => theme.spacing[8]} 0;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  justify-content: center;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    justify-content: flex-start;
  }
`;

const PrimaryButton = styled(Link)`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background-color: ${({ theme }) => theme.colors.neutral[900]};
  color: ${({ theme }) => theme.colors.text.inverse};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  transition: ${({ theme }) => theme.transitions.base};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.size.sm};
  text-align: center;

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.components.button.sizes.base.padding};
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  transition: ${({ theme }) => theme.transitions.base};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.size.sm};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.components.button.sizes.base.padding};
    gap: ${({ theme }) => theme.spacing[3]};
    justify-content: flex-start;
  }

  svg {
    transition: ${({ theme }) => theme.transitions.base};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary[500]};
    svg {
      transform: translateX(4px);
    }
  }
`;

const HeroImageContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  order: 1;
  margin-bottom: ${({ theme }) => theme.spacing[4]};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    order: 2;
    margin-bottom: 0;
  }
`;

const MainImage = styled.img`
  width: 100%;
  max-width: 280px;
  height: auto;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  object-fit: cover;
  z-index: 5;
  box-shadow: ${({ theme }) => theme.shadows.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    max-width: 350px;
    border-radius: ${({ theme }) => theme.borderRadius.xl};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 400px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    max-width: 450px;
  }
`;

const BackgroundShape = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  max-width: 280px;
  background-color: ${({ theme }) => theme.colors.secondary[100]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transform: rotate(5deg);
  z-index: 1;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    max-width: 350px;
    border-radius: ${({ theme }) => theme.borderRadius.xl};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 400px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    max-width: 450px;
  }
`;

const FloatingCard = styled.div`
  position: absolute;
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing[2]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  z-index: 10;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[3]};
    gap: ${({ theme }) => theme.spacing[3]};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: ${({ theme }) => theme.spacing[4]};
  }
`;

const CardTop = styled(FloatingCard)`
  top: -0.5rem;
  left: -0.5rem;
  background: rgba(255, 255, 255, 0.7);

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    top: 1rem;
    left: -1rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    top: 2rem;
    left: -2rem;
  }
`;

const CardBottom = styled(FloatingCard)`
  bottom: -0.5rem;
  right: -0.5rem;
  background: #ffedf0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    bottom: 1rem;
    right: -1rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    bottom: 2rem;
    right: -2rem;
  }
`;

const IconWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.primary[100]};
  color: ${({ theme }) => theme.colors.primary[600]};
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 35px;
    height: 35px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 40px;
    height: 40px;
  }
`;

const CardText = styled.div`
  p {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.size.xxs};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-weight: ${({ theme }) => theme.typography.weight.medium};

    @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
      font-size: ${({ theme }) => theme.typography.size.xs};
    }
  }

  strong {
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};

    @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
      font-size: ${({ theme }) => theme.typography.size.sm};
    }
  }
`;

// Static fallback when dashboard/CMS API is down or returns empty data (FIX 2.2).
const HERO_FALLBACK = {
  eyebrow: "Online learning",
  headline: "Build skills with expert-led courses",
  description:
    "Explore our catalog, learn at your pace, and track your progress. Live homepage content is temporarily unavailable.",
  primaryButtonText: "Browse courses",
  primaryButtonLink: "/course",
  secondaryButtonText: "Get in touch",
  secondaryButtonLink: "/contact",
};

// --- REACT COMPONENT ---

const HeroSection = () => {
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchHero = async () => {
      try {
        const res = await getHeroSection();
        if (res?.success && res?.data) {
          if (mounted) setHero(res.data);
        } else {
          setError(res?.message || "No hero found");
        }
      } catch (err) {
        console.error("Failed to fetch hero:", err);
        setError("Failed to load hero content");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHero();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <HeroContainer>
        <HeroTextContent>
          <Headline>Loading...</Headline>
        </HeroTextContent>
      </HeroContainer>
    );
  }

  const useFallback = !hero || error;
  const source = useFallback ? HERO_FALLBACK : hero;
  const eyebrow = source.eyebrow ?? "";
  const headline = source.headline ?? "";
  const description = source.description ?? "";
  const mainImage = useFallback ? "" : hero.mainImage ?? "";
  const primaryText = source.primaryButtonText ?? "";
  const primaryLink = source.primaryButtonLink ?? "/course";
  const secondaryText = source.secondaryButtonText ?? "";
  const secondaryLink = source.secondaryButtonLink ?? "/demo";
  const cardTop = useFallback ? null : hero?.cardTop ?? null;
  const cardBottom = useFallback ? null : hero?.cardBottom ?? null;

  return (
    <HeroContainer>
      <HeroTextContent>
        <Eyebrow>
          <FaStarOfLife /> {eyebrow}
        </Eyebrow>

        <Headline>{headline}</Headline>

        <Description>{description}</Description>

        {useFallback && error ? (
          <Description style={{ marginTop: "0.5rem", fontSize: "0.9rem", opacity: 0.85 }}>
            ({error})
          </Description>
        ) : null}

        <ButtonWrapper>
          <PrimaryButton to={primaryLink}>{primaryText}</PrimaryButton>
          <SecondaryButton to={secondaryLink}>
            {secondaryText} <HiArrowRight />
          </SecondaryButton>
        </ButtonWrapper>
      </HeroTextContent>

      {!useFallback && mainImage ? (
        <HeroImageContainer>
          <BackgroundShape />
          <MainImage src={mainImage} alt={hero?.headline ?? "Hero image"} />

          {cardTop && (
            <CardTop>
              <IconWrapper>{renderCardIcon(cardTop.icon)}</IconWrapper>
              <CardText>
                <strong>{cardTop.value}</strong>
                <p>{cardTop.label}</p>
              </CardText>
            </CardTop>
          )}

          {cardBottom && (
            <CardBottom>
              <IconWrapper>{renderCardIcon(cardBottom.icon || cardBottom.image)}</IconWrapper>
              <CardText>
                <strong>{cardBottom.title}</strong>
                <p>{cardBottom.label}</p>
              </CardText>
            </CardBottom>
          )}
        </HeroImageContainer>
      ) : null}
    </HeroContainer>
  );
};

export default HeroSection;
