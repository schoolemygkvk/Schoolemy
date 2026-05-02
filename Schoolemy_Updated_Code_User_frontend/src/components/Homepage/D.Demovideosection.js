import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaPlay, FaHeart, FaStar } from "react-icons/fa";
import Modal from 'react-modal';
import { Link } from "react-router-dom";
import { getDemoVideoSection } from "../../service/userdashboardApi";

// --- STYLED COMPONENTS ---

const SectionWrapper = styled.section`
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[4]}
    ${({ theme }) => theme.spacing[16]} ${({ theme }) => theme.spacing[4]};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[3]}
      ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[3]};
  }
`;

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  position: relative;
`;

const SectionHeader = styled.div`
  max-width: 650px;
  margin: 0 auto ${({ theme }) => theme.spacing[10]};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-bottom: ${({ theme }) => theme.spacing[8]};
  }
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size['3xl']};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.size.xl};
  }
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.size.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.sm};
  }
`;

const VideoThumbnail = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  overflow: hidden;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 2;
  margin: 0 auto;
  max-width: 90%;

  img {
    width: 100%;
    display: block;
    transition: ${({ theme }) => theme.transitions.base};
  }

  &:hover img {
    transform: scale(1.05);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 100%;
    border-radius: ${({ theme }) => theme.borderRadius.lg};
  }
`;

const PlayButtonOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${({ theme }) => theme.transitions.base};
  
  svg {
    font-size: 1.5rem;
    color: #E54D43;
    margin-left: 5px;
  }

  ${VideoThumbnail}:hover & {
    transform: translate(-50%, -50%) scale(1.1);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 60px;
    height: 60px;
    
    svg {
      font-size: 1.2rem;
    }
  }
`;

// --- UPDATED STYLED COMPONENTS (Changes are below) ---

const StatsContainer = styled.div`
  position: relative;
  background-color: #000000;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[10]} ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[24]};
  margin: 0 auto;
  margin-top: -${({ theme }) => theme.spacing[16]};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 1;
  width: 100%;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[4]};
    padding-top: ${({ theme }) => theme.spacing[20]};
    margin-top: -${({ theme }) => theme.spacing[12]};
    border-radius: ${({ theme }) => theme.borderRadius.lg};
    width: 100%;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[3]};
    padding-top: ${({ theme }) => theme.spacing[16]};
    margin-top: -${({ theme }) => theme.spacing[10]};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[8]};
  text-align: left;
  align-items: center;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing[10]};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: ${({ theme }) => theme.spacing[6]};
  }
`;

const TextContent = styled.div`
  text-align: center;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    text-align: left;
  }
`;

const StatsTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size['3xl']};
  color: #FFFFFF;
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  line-height: 1.2;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.xl};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
    text-align: center;
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    text-align: left;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.size.lg};
  }
`;

const CommunityButton = styled(Link)`
  display: inline-block;
  padding: 0.9rem 2rem;
  background-color: #A3B9A4;
  color: #1A202C;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.base};
  font-size: ${({ theme }) => theme.typography.size.base};

  &:hover {
    background-color: #8fa890;
    transform: translateY(-3px);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0.75rem 1.5rem;
    font-size: ${({ theme }) => theme.typography.size.sm};
    width: 100%;
    text-align: center;
  }
`;

const MetricsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: ${({ theme }) => theme.spacing[4]};
  }
`;

const Metric = styled.div`
  text-align: left;
`;

const MetricValue = styled.p`
  font-size: ${({ theme }) => theme.typography.size['4xl']};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: #FFFFFF;
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
  position: relative;
  display: inline-block;
  margin-bottom: ${({ theme }) => theme.spacing[3]};

  &::after {
    content: '';
    position: absolute;
    bottom: -${({ theme }) => theme.spacing[2]};
    left: 0;
    width: 100%;
    height: 3px;
    background-color: #FFFFFF;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size['3xl']};
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
  }
`;

const MetricLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: #E2E8F0;
  font-size: ${({ theme }) => theme.typography.size.sm};
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.xs};
  }
`;

const StarRating = styled.div`
  color: #F59E0B;
  display: flex;
  gap: 2px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.sm};
  }
`;

const TinyReview = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
  background-color: #2D3748;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  max-width: 100%;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.typography.size.sm};
    color: #FFFFFF;
    text-align: left;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
    gap: ${({ theme }) => theme.spacing[2]};
    
    p {
      font-size: ${({ theme }) => theme.typography.size.xs};
    }
    
    img {
      width: 28px;
      height: 28px;
    }
  }
`;

// --- ICON HELPER ---
const getMetricIcon = (iconName) => {
  const name = (iconName || "").toLowerCase();
  if (name === "heart") return FaHeart;
  if (name === "star") return FaStar;
  return FaStar;
};

// --- REACT COMPONENT ---
Modal.setAppElement('#root');

const DemoVideoSection = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [section, setSection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const fetchSection = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getDemoVideoSection();
                if (mounted && response?.success && response?.data) {
                    setSection(response.data);
                }
            } catch (err) {
                console.error("Error fetching demo video section:", err);
                if (mounted) setError(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchSection();
        return () => { mounted = false; };
    }, []);

    const openModal = () => setModalIsOpen(true);
    const closeModal = () => setModalIsOpen(false);

    const getEmbedUrl = (url) => {
        if (!url) return "";
        if (url.includes("youtube.com/watch")) {
            const match = url.match(/[?&]v=([^&]+)/);
            return match ? `https://www.youtube.com/embed/${match[1]}` : url;
        }
        if (url.includes("youtu.be/")) {
            const match = url.match(/youtu\.be\/([^?]+)/);
            return match ? `https://www.youtube.com/embed/${match[1]}` : url;
        }
        if (url.includes("/embed/")) return url;
        return url;
    };

    if (loading || error || !section) {
        return null;
    }

    const videoEmbedUrl = section.videoUrl ? getEmbedUrl(section.videoUrl) : "";
    const buttonLink = section.buttonLink || "/?auth=signup";

    return (
        <SectionWrapper>
            <Container>
                <SectionHeader>
                    <SectionTitle>{section.title}</SectionTitle>
                    <SectionSubtitle>{section.subtitle}</SectionSubtitle>
                </SectionHeader>
                
                <VideoThumbnail onClick={openModal}>
                    <img src={section.videoThumbnail} alt={section.title} />
                    <PlayButtonOverlay><FaPlay /></PlayButtonOverlay>
                </VideoThumbnail>

                <StatsContainer>
                    <StatsGrid>
                        <TextContent>
                            <StatsTitle>{section.statsTitle}</StatsTitle>
                            <CommunityButton to={buttonLink}>{section.buttonText}</CommunityButton>
                        </TextContent>
                        <MetricsContainer>
                            {Array.isArray(section.metrics) && section.metrics.map((metric, idx) => (
                                <Metric key={idx}>
                                    <MetricValue>{metric.value}</MetricValue>
                                    <MetricLabel>
                                        <StarRating>
                                            {[...Array(5)].map((_, i) => {
                                                const IconComponent = getMetricIcon(metric.icon);
                                                return <IconComponent key={i} />;
                                            })}
                                        </StarRating>
                                        {metric.label}
                                    </MetricLabel>
                                </Metric>
                            ))}
                            {section.review && (
                                <TinyReview>
                                    <img src={section.review.image} alt="review" />
                                    <p><b>"{section.review.text}"</b></p>
                                </TinyReview>
                            )}
                        </MetricsContainer>
                    </StatsGrid>
                </StatsContainer>

                <Modal 
                    isOpen={modalIsOpen} 
                    onRequestClose={closeModal} 
                    style={{
                        overlay: {
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            zIndex: 1000,
                            padding: '1rem'
                        },
                        content: {
                            top: '50%',
                            left: '50%',
                            right: 'auto',
                            bottom: 'auto',
                            marginRight: '-50%',
                            transform: 'translate(-50%, -50%)',
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            width: '90%',
                            maxWidth: '900px',
                            maxHeight: '90vh'
                        }
                    }}
                >
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        <iframe 
                            src={videoEmbedUrl} 
                            frameBorder="0" 
                            allow="autoplay; encrypted-media" 
                            allowFullScreen 
                            title={section.title}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        />
                    </div>
                    <button 
                        onClick={closeModal} 
                        style={{
                            position: 'absolute',
                            top: '-40px',
                            right: '0',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </Modal>
            </Container>
        </SectionWrapper>
    );
};

export default DemoVideoSection;