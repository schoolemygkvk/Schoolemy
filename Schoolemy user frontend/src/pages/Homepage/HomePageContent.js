import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import axios from "axios";

// --- CRITICAL PATH COMPONENTS (load immediately) ---
import TopBannerSection from "../../components/Homepage/A.TopBannerSection";
import HeroSection from "../../components/Homepage/B.Herosection";

// --- LAZY LOADED COMPONENTS (load after critical sections) ---
const CategoriesSection = lazy(() =>
  import("../../components/Homepage/C.Categorysection")
);
const DemoVideoSection = lazy(() =>
  import("../../components/Homepage/D.Demovideosection")
);
const CoursesSection = lazy(() =>
  import("../../components/Homepage/E.Coursesection")
);
const WhyChooseUsSection = lazy(() =>
  import("../../components/Homepage/F.WhyChooseUsSection")
);
const CtaSection = lazy(() =>
  import("../../components/Homepage/G.CtaSection")
);
const WhatWeOfferSection = lazy(() =>
  import("../../components/Homepage/H.Whatweoffer")
);
const FeedbackSection = lazy(() =>
  import("../../components/Homepage/I.Feedbacksection")
);

// --- NON-CRITICAL COMPONENTS (load with delay) ---
const AnnouncementPopup = lazy(() =>
  import("../../components/page/AnnouncementPopup")
);

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const PageOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1001;
  animation: ${fadeIn} 0.3s ease-out;
`;

const PageWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
`;

const SkeletonLoader = styled.div`
  height: 200px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

// Suspense Fallback component for secondary content
const SuspenseFallback = () => <SkeletonLoader />;

// Lazy load sections with timeout for better UX
const LazySection = ({ children }) => (
  <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
);

const HomePage = () => {
  const context = useOutletContext();
  const onSignUpClick = context ? context.onSignUpClick : null;
  const [announcement, setAnnouncement] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showNonCritical, setShowNonCritical] = useState(false);

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({ onSignUpClick }), [onSignUpClick]);

  // Load announcement after main content is rendered (deferred)
  // This runs after paint, so initial render is faster
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnnouncement();
    }, 2000); // Delay 2 seconds after page load

    return () => clearTimeout(timer);
  }, []);

  // Show non-critical components (floating ads) after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNonCritical(true);
    }, 1500); // Show after 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  const fetchAnnouncement = async () => {
    try {
      // Use abort controller for request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await axios.get(
        "https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev/api/announcements/latest",
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (response.data) {
        setAnnouncement(response.data);
        setShowPopup(true);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.log("No new announcements or error fetching them.");
      }
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <PageWrapper>
      {/* Overlay for announcement popup */}
      {showPopup && <PageOverlay onClick={handleClosePopup} />}

      {/* Announcement Popup - Lazy loaded */}
      {showPopup && (
        <LazySection>
          <AnnouncementPopup
            announcement={announcement}
            onClose={handleClosePopup}
          />
        </LazySection>
      )}

      {/* CRITICAL PATH - Load immediately */}
      <TopBannerSection onSignUpClick={onSignUpClick} />
      <HeroSection />

      {/* SECONDARY CONTENT - Lazy load with Suspense */}
      <LazySection>
        <CategoriesSection />
      </LazySection>

      <LazySection>
        <DemoVideoSection />
      </LazySection>

      <LazySection>
        <CoursesSection />
      </LazySection>

      <LazySection>
        <WhyChooseUsSection />
      </LazySection>

      <LazySection>
        <CtaSection />
      </LazySection>

      <LazySection>
        <WhatWeOfferSection />
      </LazySection>

      <LazySection>
        <FeedbackSection />
      </LazySection>
    </PageWrapper>
  );
};

export default React.memo(HomePage);
