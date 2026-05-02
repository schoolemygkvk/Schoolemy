
import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { getCategorySection } from "../../service/userdashboardApi";
import {
  DEFAULT_HOMEPAGE_CATEGORIES,
  categoryBrowsePath,
} from "../../constants/homepageCategories";

// --- STYLED COMPONENTS (with responsive updates) ---

const CategoryImage = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  background-image: url(${({ image }) => image});
  background-size: cover;
  background-position: center;
  opacity: 1;
  transition: all 0.5s ease;
  filter: brightness(1.1) contrast(1.05);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.3) 100%
    );
    border-radius: 50%;
    transition: all 0.5s ease;
    mix-blend-mode: soft-light;
  }
`;

const SectionWrapper = styled.section`
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[4]}
    ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[4]};
  
  @media (min-width: 768px) {
    padding: ${({ theme }) => theme.spacing[10]} ${({ theme }) => theme.spacing[4]}
      ${({ theme }) => theme.spacing[12]} ${({ theme }) => theme.spacing[4]};
  }
`;

const Container = styled.div`
  max-width: 1300px;
  margin: 0 auto;
`;

const SectionHeadline = styled.h2`
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size['3xl']};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  
  @media (min-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size['4xl']};
    margin-bottom: ${({ theme }) => theme.spacing[12]};
  }
`;

const CarouselWrapper = styled.div`
  overflow: hidden;
  position: relative;
`;

const CarouselContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[2]};
  padding-bottom: ${({ theme }) => theme.spacing[4]};
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  margin: 0 -${({ theme }) => theme.spacing[2]};
  
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  @media (min-width: 480px) {
    gap: ${({ theme }) => theme.spacing[6]};
    padding: ${({ theme }) => theme.spacing[3]};
  }
  
  @media (min-width: 768px) {
    gap: ${({ theme }) => theme.spacing[8]};
    padding: ${({ theme }) => theme.spacing[4]};
    margin: 0;
  }

  @media (min-width: 1024px) {
    gap: ${({ theme }) => theme.spacing[12]};
    padding: ${({ theme }) => theme.spacing[6]};
  }
`;

const CategoryCard = styled(Link)`
  flex: 0 0 140px;
  width: 140px;
  height: 140px;
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: 50%;
  background-color: ${({ bgColor }) => bgColor};
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  scroll-snap-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(255, 255, 255, 0.1);
  padding-bottom: ${({ theme }) => theme.spacing[5]};
  margin: ${({ theme }) => theme.spacing[2]};
  backdrop-filter: blur(5px);
  text-decoration: none;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(255, 255, 255, 0.2), 0 8px 25px rgba(0, 0, 0, 0.15);

    ${CategoryImage} {
      filter: brightness(1.2) contrast(1.1);
      &:before {
        background: linear-gradient(
          180deg,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0.2) 100%
        );
        opacity: 0.8;
      }
    }
  }
  
  @media (min-width: 480px) {
    flex: 0 0 160px;
    width: 160px;
    height: 160px;
    padding-bottom: ${({ theme }) => theme.spacing[6]};
  }
  
  @media (min-width: 768px) {
    flex: 0 0 200px;
    width: 200px;
    height: 200px;
    padding: ${({ theme }) => theme.spacing[4]};
    padding-bottom: ${({ theme }) => theme.spacing[8]};
  }

  @media (min-width: 1024px) {
    flex: 0 0 220px;
    width: 220px;
    height: 220px;
    padding: ${({ theme }) => theme.spacing[6]};
    padding-bottom: ${({ theme }) => theme.spacing[10]};
  }
`;

const CategoryTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size.xs};
  color: white;
  font-weight: 300;
  position: relative;
  z-index: 2;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  letter-spacing: 0.5px;
  width: 100%;
  text-align: center;
  padding: 0 ${({ theme }) => theme.spacing[2]};
  
  @media (min-width: 480px) {
    font-size: ${({ theme }) => theme.typography.size.sm};
    letter-spacing: 0.8px;
  }
  
  @media (min-width: 768px) {
    font-size: ${({ theme }) => theme.spacing[4]};
    letter-spacing: 1px;
    padding: 0 ${({ theme }) => theme.spacing[3]};
  }

  @media (min-width: 1024px) {
    font-size: ${({ theme }) => theme.typography.size.base};
    letter-spacing: 1.2px;
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const NavButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  justify-content: flex-start;
  margin-top: ${({ theme }) => theme.spacing[4]};
  
  @media (max-width: 767px) {
    justify-content: center;
  }
`;

const NavButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.base};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[900]};
    color: ${({ theme }) => theme.colors.text.inverse};
    border-color: ${({ theme }) => theme.colors.neutral[900]};
  }
  
  @media (min-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
`;


// --- REACT COMPONENT ---

const CategoriesSection = () => {
    const scrollContainerRef = useRef(null);
    const [showNavButtons, setShowNavButtons] = useState(true);
    const [sectionTitle, setSectionTitle] = useState("Explore course categories");
    const [categories, setCategories] = useState(DEFAULT_HOMEPAGE_CATEGORIES);

    useEffect(() => {
        let mounted = true;
        const fetchCategories = async () => {
            try {
                const res = await getCategorySection();
                if (mounted && res?.success && res?.data) {
                    const cats = res.data.categories ?? [];
                    if (cats.length > 0) {
                        setSectionTitle(res.data.sectionTitle || "Explore course categories");
                        setCategories(cats);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch category section:", err);
                // Keep default categories on error - section still displays
            }
        };
        fetchCategories();
        return () => { mounted = false; };
    }, []);

    const handleScroll = (direction) => {
        const container = scrollContainerRef.current;
        if (container) {
            const cardWidth = window.innerWidth < 768 
                ? container.offsetWidth * 0.85 
                : 280;
            const gap = window.innerWidth < 768 ? 16 : 24;
            const scrollAmount = cardWidth + gap;
            
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Check if we need to show navigation buttons (if content overflows)
    useEffect(() => {
        const checkScroll = () => {
            if (scrollContainerRef.current) {
                const { scrollWidth, clientWidth } = scrollContainerRef.current;
                setShowNavButtons(scrollWidth > clientWidth);
            }
        };

        checkScroll();
        window.addEventListener('resize', checkScroll);
        
        return () => {
            window.removeEventListener('resize', checkScroll);
        };
    }, [categories.length]);

    return (
        <SectionWrapper>
            <Container>
                <SectionHeadline>
                    {sectionTitle}
                </SectionHeadline>

                <CarouselWrapper>
                    <CarouselContainer ref={scrollContainerRef}>
                        {categories.map((category, index) => (
                            <CategoryCard 
                                key={category.title || index} 
                                bgColor={category.bgColor || "#b6e0d1"}
                                to={categoryBrowsePath(category.title)}
                            >
                                <CategoryImage image={category.image} />
                                <CategoryTitle>{category.title}</CategoryTitle>
                            </CategoryCard>
                        ))}
                    </CarouselContainer>
                </CarouselWrapper>
                
                {showNavButtons && (
                    <NavButtons>
                        <NavButton onClick={() => handleScroll('left')} aria-label="Scroll Left">
                            <HiChevronLeft />
                        </NavButton>
                        <NavButton onClick={() => handleScroll('right')} aria-label="Scroll Right">
                            <HiChevronRight />
                        </NavButton>
                    </NavButtons>
                )}
            </Container>
        </SectionWrapper>
    );
};

export default CategoriesSection;