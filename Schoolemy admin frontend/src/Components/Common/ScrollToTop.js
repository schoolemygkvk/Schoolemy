import React, { useState, useEffect } from "react";
import { ArrowUpOutlined } from "@ant-design/icons";
import { Button } from "antd";

// Export scroll to top function for use in other components
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [transform, setTransform] = useState("translateY(20px) scale(0.8)");

  // Show button when page is scrolled down with smooth animations
  useEffect(() => {
    const toggleVisibility = () => {
      const scrollPosition = window.pageYOffset;
      const threshold = 300;
      const fadeRange = 200; // Range over which to fade in/out
      
      if (scrollPosition > threshold) {
        setIsVisible(true);
        // Gradually increase opacity and transform as user scrolls down
        const scrollProgress = Math.min((scrollPosition - threshold) / fadeRange, 1);
        const easedProgress = scrollProgress * scrollProgress * (3 - 2 * scrollProgress); // Smooth easing
        setOpacity(easedProgress);
        setTransform(`translateY(${20 * (1 - easedProgress)}px) scale(${0.8 + 0.2 * easedProgress})`);
      } else {
        // Gradually fade out when scrolling back up
        if (scrollPosition > threshold - fadeRange) {
          const fadeProgress = (scrollPosition - (threshold - fadeRange)) / fadeRange;
          const easedProgress = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
          setOpacity(easedProgress);
          setTransform(`translateY(${20 * (1 - easedProgress)}px) scale(${0.8 + 0.2 * easedProgress})`);
        } else {
          setIsVisible(false);
          setOpacity(0);
          setTransform("translateY(20px) scale(0.8)");
        }
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    
    // Initial check
    toggleVisibility();

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <Button
          type="primary"
          shape="circle"
          icon={<ArrowUpOutlined />}
          onClick={scrollToTop}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-5px) scale(1.15)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(24, 144, 255, 0.5)";
            e.currentTarget.style.transition = "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = transform;
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            e.currentTarget.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
          }}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            width: "50px",
            height: "50px",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            opacity: opacity,
            transform: transform,
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            pointerEvents: opacity > 0.3 ? "auto" : "none",
          }}
          aria-label="Scroll to top"
        />
      )}
    </>
  );
};

export default ScrollToTop;

