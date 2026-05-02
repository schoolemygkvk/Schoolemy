// src/components/Homepage/CtaSection.js

import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import { Link } from "react-router-dom";
import api from "../../service/api";
import { getCtaSection } from "../../service/userdashboardApi";
import { HiArrowUpRight } from "react-icons/hi2";
import { FaAtom, FaFlask, FaCalculator, FaClock } from "react-icons/fa";

// Map icon strings from API to React icon components
const ICON_MAP = {
  FaAtom: FaAtom,
  FaFlask: FaFlask,
  FaCalculator: FaCalculator,
  default: FaAtom,
};

// Map subject title to class API key (for PCM classes)
const getSubjectKey = (title) => {
  if (!title) return null;
  const lower = title.toLowerCase();
  if (lower.includes("physics")) return "physics";
  if (lower.includes("chemistry")) return "chemistry";
  if (lower.includes("mathematics") || lower.includes("math")) return "mathematics";
  return null;
};

const getIconComponent = (iconStr) => {
  if (!iconStr) return ICON_MAP.default;
  if (iconStr.startsWith("http") || iconStr.startsWith("/")) return null; // URL - render as img
  return ICON_MAP[iconStr] || ICON_MAP.default;
};

// --- STYLED COMPONENTS ---

const SectionWrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.sectionPadding} 5%;
  background: #EFEBE5;
`;

const Container = styled.div`
  max-width: 1300px;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[12]};
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size['4xl']};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
  }
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.size.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 750px;
  margin: 0 auto;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.base};
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[8]};
  margin-top: ${({ theme }) => theme.spacing[10]};

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[6]};
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const Card = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: ${({ theme }) => theme.transitions.base};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ $gradientColor }) => $gradientColor};
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing[6]};
  }
`;

const IconCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ $bgColor }) => $bgColor};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto ${({ theme }) => theme.spacing[6]};
  transition: ${({ theme }) => theme.transitions.base};

  ${Card}:hover & {
    transform: scale(1.1) rotate(10deg);
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
`;

const CardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size['2xl']};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.xl};
  }
`;

const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.size.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0 0 ${({ theme }) => theme.spacing[6]} 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.sm};
  }
`;

const JoinButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  padding-right: ${({ theme }) => theme.spacing[3]};
  background-color: ${({ $bgColor }) => $bgColor};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  font-size: ${({ theme }) => theme.typography.size.base};
  transition: ${({ theme }) => theme.transitions.base};
  width: fit-content;
  margin: 0 auto;

  &:hover {
    transform: translateX(5px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.sm};
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[5]};
  }
`;

const ButtonText = styled.span`
  padding-left: ${({ theme }) => theme.spacing[2]};
`;

const ButtonIconWrapper = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: ${({ theme }) => theme.transitions.base};

  ${JoinButton}:hover & {
    background-color: rgba(255, 255, 255, 0.5);
    transform: rotate(45deg);
  }

  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
    font-size: 0.9rem;
  }
`;

const StatusBadge = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  
  ${({ $status }) => {
    if ($status === 'live') {
      return `
        background-color: #10b981;
        color: white;
      `;
    } else if ($status === 'upcoming') {
      return `
        background-color: #f59e0b;
        color: white;
      `;
    } else {
      return `
        background-color: #6b7280;
        color: white;
      `;
    }
  }}

  @media (max-width: 768px) {
    top: ${({ theme }) => theme.spacing[3]};
    right: ${({ theme }) => theme.spacing[3]};
    padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  }
`;

const TimerText = styled.div`
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing[2]};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-weight: ${({ theme }) => theme.typography.weight.medium};

  svg {
    color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const DisabledButton = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  padding-right: ${({ theme }) => theme.spacing[3]};
  background-color: #9ca3af;
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  font-size: ${({ theme }) => theme.typography.size.base};
  width: fit-content;
  margin: 0 auto;
  cursor: not-allowed;
  opacity: 0.6;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.sm};
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[5]};
  }
`;

// Default fallback when API fails or has no data
const DEFAULT_CTA = {
  title: "Master Core Subjects & Build Your Foundation",
  subtitle: "Choose your path in Physics, Chemistry, or Mathematics. Our expert-led courses help you develop deep understanding and practical skills for academic and career success.",
  subjects: [
    { title: "Physics", description: "Explore the fundamental laws of nature and understand the universe through motion, energy, and forces.", color: "#3b82f6", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", icon: "FaAtom" },
    { title: "Chemistry", description: "Discover the fascinating world of matter, reactions, and the building blocks of everything around us.", color: "#10b981", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", icon: "FaFlask" },
    { title: "Mathematics", description: "Master the language of logic, patterns, and problem-solving that powers science and technology.", color: "#f59e0b", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", icon: "FaCalculator" },
  ],
};

// --- REACT COMPONENT ---

const CtaSection = () => {
  const [ctaData, setCtaData] = useState(DEFAULT_CTA);
  const [classesData, setClassesData] = useState({
    physics: null,
    chemistry: null,
    mathematics: null
  });
  const [timers, setTimers] = useState({
    physics: null,
    chemistry: null,
    mathematics: null
  });
  const [loading, setLoading] = useState(true);

  // Fetch CTA section from API
  useEffect(() => {
    const fetchCtaSection = async () => {
      try {
        const res = await getCtaSection();
        if (res?.success && res?.data) {
          const { title, subtitle, subjects } = res.data;
          if (title || subtitle || (subjects && subjects.length > 0)) {
            setCtaData({
              title: title || DEFAULT_CTA.title,
              subtitle: subtitle || DEFAULT_CTA.subtitle,
              subjects: subjects && subjects.length > 0 ? subjects : DEFAULT_CTA.subjects,
            });
          }
        }
      } catch (err) {
        console.warn("CTA API unavailable, using default content:", err?.message || err);
      }
    };
    fetchCtaSection();
  }, []);

  // Fetch upcoming classes for each subject
  useEffect(() => {
    const subjects = [
      { key: "physics" },
      { key: "chemistry" },
      { key: "mathematics" }
    ];

    const fetchClasses = async () => {
      try {
        const responses = await Promise.all(
          subjects.map(subject => 
            api.post(`/api/v1/pcm/classes-pcm`, { subject: subject.key })
              .catch(err => {
                console.error(`Error fetching ${subject.key}:`, err);
                return { data: { success: false, data: [] } };
              })
          )
        );

        const newClassesData = {};
        responses.forEach((response, index) => {
          const subjectKey = subjects[index].key;
          // console.log(`${subjectKey} response:`, response.data); // Debug log
          
          if (response.data.success && response.data.data && response.data.data.length > 0) {
            // Get the nearest upcoming or live class
            const sortedClasses = response.data.data.sort((a, b) => {
              const aTime = new Date(a.startTime).getTime();
              const bTime = new Date(b.startTime).getTime();
              return aTime - bTime;
            });
            
            // Find first non-completed class
            const activeClass = sortedClasses.find(cls => cls.status !== 'completed') || sortedClasses[0];
            newClassesData[subjectKey] = activeClass;
            // console.log(`${subjectKey} selected class:`, activeClass); // Debug log
          }
        });

        // console.log('Final classesData:', newClassesData); // Debug log
        setClassesData(newClassesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setLoading(false);
      }
    };

    fetchClasses();
    // Refresh every minute
    const interval = setInterval(fetchClasses, 60000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array is correct here

  // Update timers every second
  useEffect(() => {
    const updateTimers = () => {
      const newTimers = {};
      
      Object.keys(classesData).forEach(subjectKey => {
        const classItem = classesData[subjectKey];
        if (classItem) {
          const now = new Date();
          const startTime = new Date(classItem.startTime);
          const endTime = new Date(classItem.endTime);
          const fifteenMinutesBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
          
          if (now >= fifteenMinutesBefore && now <= endTime) {
            newTimers[subjectKey] = { status: 'joinable', time: null };
          } else if (now < fifteenMinutesBefore) {
            const diff = fifteenMinutesBefore.getTime() - now.getTime();
            newTimers[subjectKey] = { status: 'upcoming', time: diff };
          } else {
            newTimers[subjectKey] = { status: 'ended', time: null };
          }
        }
      });
      
      setTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [classesData]);

  // Format time remaining
  const formatTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Handle join class
  const handleJoinClass = (classData) => {
    if (classData && classData.meetLink) {
      // Open Google Meet link in new tab
      window.open(classData.meetLink, '_blank', 'noopener,noreferrer');
    } else {
      alert('Meet link is not available for this class');
    }
  };

  const getStatusBadge = (subjectKey) => {
    const timer = timers[subjectKey];
    if (!timer) return null;

    if (timer.status === 'joinable') {
      return <StatusBadge $status="live"> Join Now Available</StatusBadge>;
    } else if (timer.status === 'upcoming') {
      return <StatusBadge $status="upcoming">Upcoming</StatusBadge>;
    }
    return null;
  };

  const renderButton = (subject) => {
    const classItem = classesData[subject.key];
    const timer = timers[subject.key];

    // Show loading state
    if (loading) {
      return (
        <DisabledButton>
          <ButtonText>Loading...</ButtonText>
          <ButtonIconWrapper>
            <HiArrowUpRight />
          </ButtonIconWrapper>
        </DisabledButton>
      );
    }

    if (!classItem) {
      // No class scheduled
      return (
        <DisabledButton>
          <ButtonText>No Class Scheduled</ButtonText>
          <ButtonIconWrapper>
            <HiArrowUpRight />
          </ButtonIconWrapper>
        </DisabledButton>
      );
    }

    // console.log(`Rendering ${subject.key}:`, { classItem, timer }); // Debug log

    if (timer?.status === 'joinable') {
      // Class is joinable
      return (
        <>
          <JoinButton 
            as="button"
            onClick={() => handleJoinClass(classItem)}
            $bgColor={subject.color}
          >
            <ButtonText>Join Now</ButtonText>
            <ButtonIconWrapper>
              <HiArrowUpRight />
            </ButtonIconWrapper>
          </JoinButton>
          <TimerText>
            <FaClock />
            Class is live!
          </TimerText>
        </>
      );
    } else if (timer?.status === 'upcoming' && timer?.time) {
      // Class is upcoming
      return (
        <>
          <DisabledButton>
            <ButtonText>Waiting to Join</ButtonText>
            <ButtonIconWrapper>
              <HiArrowUpRight />
            </ButtonIconWrapper>
          </DisabledButton>
          <TimerText>
            <FaClock />
            Available in: {formatTimeRemaining(timer.time)}
          </TimerText>
        </>
      );
    } else {
      // Class ended or no timer
      return (
        <DisabledButton>
          <ButtonText>Class Ended</ButtonText>
          <ButtonIconWrapper>
            <HiArrowUpRight />
          </ButtonIconWrapper>
        </DisabledButton>
      );
    }
  };

  // Enrich subjects with key for class lookup and icon component
  const subjectsWithKey = ctaData.subjects.map((subject, index) => ({
    ...subject,
    id: index + 1,
    key: getSubjectKey(subject.title),
    IconComponent: getIconComponent(subject.icon),
    isIconUrl: subject.icon && (subject.icon.startsWith("http") || subject.icon.startsWith("/")),
  }));

  return (
    <SectionWrapper>
      <Container>
        <SectionHeader>
          <SectionTitle>{ctaData.title}</SectionTitle>
          <SectionSubtitle>{ctaData.subtitle}</SectionSubtitle>
        </SectionHeader>

        <CardsGrid>
          {subjectsWithKey.map((subject) => (
            <Card key={subject.id} $gradientColor={subject.gradient}>
              {subject.key && getStatusBadge(subject.key)}
              <IconCircle $bgColor={subject.color}>
                {subject.isIconUrl ? (
                  <img src={subject.icon} alt={subject.title} style={{ width: "2.5rem", height: "2.5rem", objectFit: "contain" }} />
                ) : (
                  subject.IconComponent && React.createElement(subject.IconComponent)
                )}
              </IconCircle>
              <CardTitle>{subject.title}</CardTitle>
              <CardDescription>{subject.description}</CardDescription>
              {renderButton(subject)}
            </Card>
          ))}
        </CardsGrid>
      </Container>
    </SectionWrapper>
  );
};

export default CtaSection;