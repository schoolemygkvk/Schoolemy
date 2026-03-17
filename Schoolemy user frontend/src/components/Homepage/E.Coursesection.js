import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { HiArrowRight, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { getCoursesSection, getDashboardImageUrl } from "../../service/userdashboardApi";


// --- STYLED COMPONENTS ---

const SectionWrapper = styled.section`
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.sectionPadding} 0;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[8]} 0;
  }
`;

const Container = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 5%;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[12]};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-bottom: ${({ theme }) => theme.spacing[8]};
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size['4xl']};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  margin: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size['2xl']};
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    justify-content: space-between;
    margin-top: ${({ theme }) => theme.spacing[2]};
  }
`;

const NavButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  position: relative;
  z-index: 2;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: ${({ theme }) => theme.spacing[2]};
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    transform: translateY(-50%);
    justify-content: space-between;
    padding: 0 ${({ theme }) => theme.spacing[2]};
    pointer-events: none;
  }
`;

const NavButton = styled.button`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: none;
  background-color: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.base};
  box-shadow: ${({ theme }) => theme.shadows.md};

  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[900]};
    color: ${({ theme }) => theme.colors.text.inverse};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
    pointer-events: auto;
    background-color: ${({ theme }) => theme.colors.background.primary};
    opacity: 0.9;
    
    &:active {
      transform: scale(0.95);
    }
  }
`;

const ViewAllLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.sm};
  }
`;

const CarouselWrapper = styled.div`
  overflow: hidden;
  position: relative;
`;

const CarouselContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[8]};
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: ${({ theme }) => theme.spacing[4]};
  margin: 0 -${({ theme }) => theme.spacing[4]};
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: ${({ theme }) => theme.spacing[6]};
    padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[2]};
    margin: 0;
    scroll-padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const CourseCard = styled.div`
  flex: 0 0 calc(33.333% - 22px);
  min-width: 320px;
  background-color: #ffffff;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  overflow: hidden;
  transition: ${({ theme }) => theme.transitions.base};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-basis: calc(50% - 16px);
    min-width: 280px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-basis: 90%;
    min-width: 280px;
    margin: 0 auto;
    box-shadow: ${({ theme }) => theme.shadows.md};
    
    &:hover {
      transform: translateY(-4px);
    }
  }
`;

const ImageContainer = styled.div`
  height: 200px;
  position: relative;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 200px;
  }
  
  ${CourseCard}:hover & img {
    transform: scale(1.05);
  }
`;

const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[4]};
  }
`;

const InfoBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[3]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing[2]};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }
`;

const CategoryPill = styled.span`
  background-color: ${({ theme }) => theme.colors.neutral[100]};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.size.sm};
  font-weight: ${({ theme }) => theme.typography.weight.medium};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.xs};
  }
`;

const PriceText = styled.span`
  color: ${({ theme }) => theme.colors.secondary[600]};
  font-size: ${({ theme }) => theme.typography.size.xl};
  font-weight: ${({ theme }) => theme.typography.weight.bold};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.lg};
  }
`;

const CourseTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size.lg};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  margin: 0 0 auto;
  padding-bottom: ${({ theme }) => theme.spacing[4]};
  line-height: 1.4;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.size.base};
    padding-bottom: ${({ theme }) => theme.spacing[3]};
  }
`;

const StartLearningButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  background-color: ${({ theme }) => theme.colors.neutral[900]};
  color: ${({ theme }) => theme.colors.text.inverse};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.base};
  margin-top: ${({ theme }) => theme.spacing[4]};

  &:hover {
    transform: scale(1.05);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing[2]};
    font-size: ${({ theme }) => theme.typography.size.sm};
    margin-top: ${({ theme }) => theme.spacing[3]};
  }
`;

// Indicator dots for mobile
const IndicatorDots = styled.div`
  display: none;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[6]};
  padding-bottom: ${({ theme }) => theme.spacing[4]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    position: relative;
    z-index: 2;
  }
`;

const Dot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background-color: ${({ active, theme }) => 
    active ? theme.colors.neutral[900] : theme.colors.neutral[300]};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.base};
  opacity: ${({ active }) => active ? 1 : 0.5};
  transform: scale(${({ active }) => active ? 1.2 : 1});
`;

// --- REACT COMPONENT ---

// Fallback when API fails or returns empty
const DEFAULT_COURSES = [
    { title: "Siddha Medicine Fundamentals", image: "/yoga7.jpeg", category: "Traditional Medicine" },
    { title: "Advanced Yoga Therapy", image: "/yoga3.jpeg", category: "Therapeutic Yoga" },
    { title: "Ayurvedic Lifestyle Design", image: "/yoga6.jpg", category: "Holistic Wellness" },
    { title: "Varma Kalai Mastery", image: "/yoga4.jpg", category: "Energy Healing" },
    { title: "Herbal Medicine Mastery", image: "/yoga.jpeg", category: "Natural Healing" }
];

const CoursesSection = () => {
    const scrollContainerRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [sectionTitle, setSectionTitle] = useState("Popular Courses");
    const [coursesData, setCoursesData] = useState(DEFAULT_COURSES);
    const [coursesFromApi, setCoursesFromApi] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchCourses = async () => {
            try {
                const res = await getCoursesSection();
                if (mounted && res?.success && res?.data) {
                    const courses = res.data.courses ?? [];
                    if (courses.length > 0) {
                        setSectionTitle(res.data.sectionTitle || "Popular Courses");
                        setCoursesData(courses);
                        setCoursesFromApi(true);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch courses section:", err);
                // Keep default courses on error - section still displays
            }
        };
        fetchCourses();
        return () => { mounted = false; };
    }, []);

    // Handle window resize for responsive behavior
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle scroll to update current index for indicator dots
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (isMobile && container.scrollWidth > 0) {
                const scrollPos = container.scrollLeft;
                const cardWidth = container.offsetWidth * 0.85; // 85% of container width
                const newIndex = Math.round(scrollPos / (cardWidth + 16)); // 16px gap
                setCurrentIndex(newIndex);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [isMobile]);

    const handleScroll = (direction) => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = container.offsetWidth * (isMobile ? 0.85 : 0.9);
            container.scrollBy({ 
                left: direction === 'left' ? -scrollAmount : scrollAmount, 
                behavior: 'smooth' 
            });
        }
    };

    const scrollToIndex = (index) => {
        const container = scrollContainerRef.current;
        if (container) {
            const cardWidth = container.offsetWidth * 0.85; // 85% of container width
            const scrollPosition = index * (cardWidth + 16); // 16px gap
            container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
    };

    return (
        <SectionWrapper>
            <Container>
                <SectionHeader>
                    <SectionTitle>{sectionTitle}</SectionTitle>
                    <HeaderActions>
                        <NavButtons>
                            <NavButton onClick={() => handleScroll('left')} aria-label="Previous courses">
                                <HiChevronLeft />
                            </NavButton>
                            <NavButton onClick={() => handleScroll('right')} aria-label="Next courses">
                                <HiChevronRight />
                            </NavButton>
                        </NavButtons>
                        {/* Uncomment if needed */}
                        {/* <ViewAllLink to="/course">View all courses</ViewAllLink> */}
                    </HeaderActions>
                </SectionHeader>

                <CarouselWrapper>
                    <CarouselContainer ref={scrollContainerRef}>
                        {coursesData.map((course, index) => (
                            <CourseCard key={course.title || index}>
                                <ImageContainer>
                                    <img src={coursesFromApi ? getDashboardImageUrl(course.image) : course.image} alt={course.title} />
                                </ImageContainer>
                                <CardContent>
                                    <InfoBar>
                                        <CategoryPill>{course.category}</CategoryPill>
                                        {/* Uncomment if needed */}
                                        {/* <PriceText>${course.price}</PriceText> */}
                                    </InfoBar>
                                    <CourseTitle>{course.title}</CourseTitle>
                                    <StartLearningButton to={`/course`}>
                                        Start Learning <HiArrowRight />
                                    </StartLearningButton>
                                </CardContent>
                            </CourseCard>
                        ))}
                    </CarouselContainer>

                    {/* Indicator dots for mobile */}
                    <IndicatorDots>
                        {coursesData.map((_, index) => (
                            <Dot 
                                key={index} 
                                active={index === currentIndex}
                                onClick={() => scrollToIndex(index)}
                                aria-label={`Go to course ${index + 1}`}
                            />
                        ))}
                    </IndicatorDots>
                </CarouselWrapper>
            </Container>
        </SectionWrapper>
    );
};

export default CoursesSection;