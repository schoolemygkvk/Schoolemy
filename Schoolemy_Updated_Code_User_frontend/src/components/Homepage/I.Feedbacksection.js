// src/components/Homepage/I.Feedbacksection.js

import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { FaStar } from "react-icons/fa";
import { HiArrowLeft, HiArrowRight } from "react-icons/hi";
import { getFeedbackSection } from "../../service/userdashboardApi";

// --- STYLED COMPONENTS (Same design as old code) ---

const SectionWrapper = styled.section`
  background-color: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing[24]} 0;
  overflow: hidden;
`;

const Container = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[4]};
`;

const SectionHeader = styled.div`
  text-align: center;
  max-width: 650px;
  margin: 0 auto ${({ theme }) => theme.spacing[12]};
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size["4xl"]};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.size.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const CarouselWrapper = styled.div`
  overflow: hidden;
`;

const CarouselContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[4]};
  margin: 0 -${({ theme }) => theme.spacing[4]};
  overflow-x: auto;
  scroll-behavior: smooth;
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const TestimonialCard = styled.div`
  flex: 0 0 320px;
  background-color: #ffffff;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`;

const StarRating = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme }) => theme.colors.accent[500]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const TestimonialText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  flex-grow: 1;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const AuthorAvatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
`;

const AuthorDetails = styled.div`
  strong {
    display: block;
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
  }
  span {
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: ${({ theme }) => theme.typography.size.sm};
  }
`;

const Navigation = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[8]};
`;

const NavButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[900]};
    color: ${({ theme }) => theme.colors.text.inverse};
  }
`;

// Default fallback when API fails or returns empty
const DEFAULT_TESTIMONIALS = [
  { name: "Judy Nguyen", role: "Junior UI designer", avatar: "/YOGAGIRL.png", text: "To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it." },
  { name: "Larry Lawson", role: "Graduate Teacher", avatar: "/YOGAGIRL.png", text: "Obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure." },
  { name: "Billy Vasquez", role: "Post Graduate Teacher", avatar: "/YOGAGIRL.png", text: "Because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful." },
  { name: "Carolyn Ortiz", role: "Primary Teacher", avatar: "/YOGAGIRL.png", text: "Occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga." },
];

const DEFAULT_TITLE = "What students say about our platform";
const DEFAULT_SUBTITLE = "No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know.";

// --- REACT COMPONENT ---

const FeedbackSection = () => {
  const scrollContainerRef = useRef(null);
  const [sectionData, setSectionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchFeedback = async () => {
      try {
        const res = await getFeedbackSection();
        if (res?.success && res?.data && mounted) {
          setSectionData(res.data);
        }
      } catch (err) {
        console.warn("Feedback API unavailable, using default testimonials:", err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchFeedback();
    return () => {
      mounted = false;
    };
  }, []);

  const title = sectionData?.title ?? DEFAULT_TITLE;
  const subtitle = sectionData?.subtitle ?? DEFAULT_SUBTITLE;
  const apiTestimonials = Array.isArray(sectionData?.testimonials) && sectionData.testimonials.length > 0 ? sectionData.testimonials : [];
  const testimonialsData = apiTestimonials.length > 0
    ? apiTestimonials.map((t) => ({
        name: t.name ?? "",
        role: t.role ?? "",
        avatar: t.avatar ?? "/YOGAGIRL.png",
        text: t.text ?? "",
      }))
    : DEFAULT_TESTIMONIALS;

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 320 + 24;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <SectionWrapper>
        <Container>
          <SectionHeader>
            <SectionTitle>Loading...</SectionTitle>
          </SectionHeader>
        </Container>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper>
      <Container>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          <SectionSubtitle>{subtitle}</SectionSubtitle>
        </SectionHeader>

        <CarouselWrapper>
          <CarouselContainer ref={scrollContainerRef}>
            {testimonialsData.map((testimonial, index) => (
              <TestimonialCard key={index}>
                <StarRating>
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} />
                  ))}
                </StarRating>
                <TestimonialText>"{testimonial.text}"</TestimonialText>
                <AuthorInfo>
                  <AuthorAvatar src={testimonial.avatar} alt={testimonial.name} />
                  <AuthorDetails>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </AuthorDetails>
                </AuthorInfo>
              </TestimonialCard>
            ))}
          </CarouselContainer>
        </CarouselWrapper>

        <Navigation>
          <NavButton onClick={() => handleScroll("left")} aria-label="Previous testimonial">
            <HiArrowLeft />
          </NavButton>
          <NavButton onClick={() => handleScroll("right")} aria-label="Next testimonial">
            <HiArrowRight />
          </NavButton>
        </Navigation>
      </Container>
    </SectionWrapper>
  );
};

export default FeedbackSection;
