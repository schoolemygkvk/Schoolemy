import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import axios from "axios";
import { useLocation } from "react-router-dom";

const ADMIN_API_URL =
  process.env.REACT_APP_ADMIN_API_URL ||
  "https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev";
const ADS_API_URL = `${ADMIN_API_URL}/api/advertisements/active`;

/* ================= ANIMATIONS ================= */

const slideIn = keyframes`
  from { transform: translateY(20px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

/* ================= STYLES ================= */

const AdWrapper = styled.div`
  position: fixed;
  width: 300px;
  max-width: calc(100vw - 32px);
  z-index: 1000;
  background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 20px;
  overflow: hidden;
  animation: ${slideIn} 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.02);
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;

  &:hover {
    box-shadow:
      0 30px 60px -15px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(0, 0, 0, 0.05);
  }

  ${({ position }) =>
    position === "bottom-right" &&
    `
    bottom: 28px;
    right: 28px;
  `}

  ${({ position }) =>
    position === "bottom-left" &&
    `
    bottom: 28px;
    left: 28px;
  `}

  ${({ position }) =>
    position === "top-right" &&
    `
    top: 100px;
    right: 28px;
  `}

  ${({ position }) =>
    position === "bottom-center" &&
    `
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
  `}

  /* Mobile responsive - tablet */
  @media (max-width: 768px) {
    width: 220px;
    max-width: calc(100vw - 32px);
    border-radius: 14px;
    bottom: max(16px, env(safe-area-inset-bottom, 16px)) !important;
    right: 10px !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
  }

  /* Mobile responsive - small phones */
  @media (max-width: 480px) {
    width: 200px;
    max-width: calc(100vw - 32px);
    bottom: max(12px, env(safe-area-inset-bottom, 12px)) !important;
    left: 50% !important;
    right: auto !important;
    top: auto !important;
    transform: translateX(-50%) !important;
    border-radius: 12px;
  }

  /* Extra small phones */
  @media (max-width: 360px) {
    width: 180px;
    max-width: calc(100vw - 24px);
    bottom: max(10px, env(safe-area-inset-bottom, 10px)) !important;
  }
`;

const AdContent = styled.a`
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 0.25s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:hover .ad-cta {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: #fff;
    transform: translateY(0);
  }
`;

const AdInner = styled.div`
  padding: 14px 14px 16px;

  @media (max-width: 768px) {
    padding: 8px 8px 10px;
  }

  @media (max-width: 480px) {
    padding: 6px 6px 8px;
  }
`;

const AdHeader = styled.div`
  padding: 0 0 12px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.3;

  @media (max-width: 768px) {
    padding: 0 0 6px;
    font-size: 0.78rem;
  }

  @media (max-width: 480px) {
    padding: 0 0 4px;
    font-size: 0.72rem;
  }
`;

const AdImageWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 14px;
  background: #f1f5f9;
  overflow: hidden;
  margin-bottom: 14px;

  @media (max-width: 768px) {
    border-radius: 8px;
    margin-bottom: 8px;
    aspect-ratio: 16 / 9;
  }

  @media (max-width: 480px) {
    border-radius: 6px;
    margin-bottom: 6px;
    aspect-ratio: 16 / 9;
  }
`;

const AdImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;

  ${AdContent}:hover & {
    transform: scale(1.03);
  }
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  min-height: 135px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;

  @media (max-width: 480px) {
    min-height: 60px;
    font-size: 0.65rem;
  }
`;

const AdBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  letter-spacing: 0.6px;
  text-transform: uppercase;

  @media (max-width: 480px) {
    top: 4px;
    left: 4px;
    font-size: 0.5rem;
    padding: 2px 5px;
    border-radius: 4px;
  }
`;

const AdCta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0f172a;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  padding: 8px 16px;
  border-radius: 10px;
  transition: all 0.25s ease;

  &::after {
    content: "→";
    font-size: 1rem;
    transition: transform 0.2s ease;
  }

  ${AdContent}:hover &::after {
    transform: translateX(3px);
  }

  @media (max-width: 768px) {
    font-size: 0.68rem;
    padding: 5px 10px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    font-size: 0.62rem;
    padding: 4px 8px;
    border-radius: 5px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  min-width: 44px;
  min-height: 44px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #64748b;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;

  &:hover,
  &:active {
    background: #fff;
    color: #0f172a;
  }

  @media (max-width: 768px) {
    top: 6px;
    right: 6px;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    font-size: 18px;
    border-radius: 50%;
  }

  @media (max-width: 480px) {
    top: 5px;
    right: 5px;
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    font-size: 16px;
    border-radius: 50%;
    padding: 0;
  }
`;

const DotIndicator = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 12px 0 14px;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ active }) => (active ? "#0f172a" : "#cbd5e1")};
  transition: all 0.25s ease;
  opacity: ${({ active }) => (active ? 1 : 0.5)};
`;

const LoadingWrapper = styled.div`
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1000;

  @media (max-width: 768px) {
    bottom: max(16px, env(safe-area-inset-bottom, 16px));
    right: 10px;
  }

  @media (max-width: 480px) {
    bottom: max(12px, env(safe-area-inset-bottom, 12px));
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }
`;

const AdLoadingPlaceholder = styled.div`
  width: 300px;
  max-width: calc(100vw - 32px);
  height: 200px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);

  @media (max-width: 768px) {
    width: 220px;
    max-width: calc(100vw - 32px);
    height: 130px;
    border-radius: 14px;
  }

  @media (max-width: 480px) {
    width: 200px;
    max-width: calc(100vw - 32px);
    height: 115px;
    border-radius: 12px;
  }

  @media (max-width: 360px) {
    width: 180px;
    max-width: calc(100vw - 24px);
    height: 100px;
  }
`;

/* ================= HELPERS ================= */

function normalizeAdsResponse(data) {
  let raw = data;
  if (data?.data && Array.isArray(data.data)) raw = data.data;
  else if (data?.data && !Array.isArray(data.data)) raw = [data.data];
  else if (data?.advertisements) raw = data.advertisements;
  else if (data?.ads) raw = data.ads;
  else if (!Array.isArray(data)) raw = data ? [data] : [];

  return Array.isArray(raw) ? raw : [raw];
}

function getImageSource(ad) {
  if (ad.image_base64) return ad.image_base64;
  if (!ad.image_path) return null;
  if (ad.image_path.startsWith("http")) return ad.image_path;
  const base = ADMIN_API_URL.replace(/\/$/, "");
  const path = ad.image_path.startsWith("/")
    ? ad.image_path
    : `/${ad.image_path}`;
  return `${base}${path}`;
}

function getTargetUrl(ad) {
  const url = ad.target_url || ad.targetUrl || ad.url || ad.link || "";
  return url && url.trim() ? url.trim() : null;
}

function hasValidImage(ad) {
  return !!(ad.image_base64 || ad.image_path);
}

/* ================= COMPONENT ================= */

const FloatingAd = () => {
  const [ads, setAds] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();

  const positions = [
    "bottom-right",
    "bottom-left",
    "top-right",
    "bottom-center",
  ];

  const noAdRoutes = [
    "/course/",
    "/dashboard",
    "/profile",
    "/payment",
    "/blog/",
    "/events/",
    "/admin",
    "/login",
    "/register",
  ];

  const shouldHideAd = noAdRoutes.some((route) =>
    location.pathname.includes(route),
  );

  useEffect(() => {
    const fetchActiveAds = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(ADS_API_URL);
        const raw = normalizeAdsResponse(res.data);
        const validAds = raw.filter((ad) => ad && hasValidImage(ad));
        setAds(validAds);
      } catch (err) {
        console.error("Ad fetch failed", err);
        setAds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveAds();
  }, []);

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
  };

  const handleImageError = (id) => {
    setImageErrors((prev) => new Set([...prev, id]));
  };

  if (isLoading) {
    return (
      <LoadingWrapper>
        <AdLoadingPlaceholder>Loading...</AdLoadingPlaceholder>
      </LoadingWrapper>
    );
  }
  if (!ads.length || !isVisible || shouldHideAd) return null;

  const renderAdCard = (ad, index) => {
    const position = positions[index % positions.length];
    const imageSrc = getImageSource(ad);
    const targetUrl = getTargetUrl(ad);
    const hasValidLink = !!targetUrl;
    const adId = ad._id || ad.id || `ad-${index}`;

    return (
      <AdWrapper key={adId} position={position}>
        <CloseButton onClick={handleClose} aria-label="Close">
          ×
        </CloseButton>

        <AdContent
          as={hasValidLink ? "a" : "div"}
          href={hasValidLink ? targetUrl : undefined}
          target={hasValidLink ? "_blank" : undefined}
          rel={hasValidLink ? "noopener noreferrer" : undefined}
          style={hasValidLink ? undefined : { cursor: "default" }}
        >
          {!ad.title && imageSrc && <AdBadge>Sponsored</AdBadge>}

          <AdInner>
            {ad.title && <AdHeader>{ad.title}</AdHeader>}

            <AdImageWrapper>
              {imageSrc && !imageErrors.has(adId) ? (
                <AdImage
                  src={imageSrc}
                  alt={ad.title || "Advertisement"}
                  onError={() => handleImageError(adId)}
                />
              ) : (
                <ImagePlaceholder>Image unavailable</ImagePlaceholder>
              )}
            </AdImageWrapper>

            {hasValidLink && <AdCta className="ad-cta">Learn more</AdCta>}
          </AdInner>
        </AdContent>
      </AdWrapper>
    );
  };

  /* Show only one ad (single ad) even if backend returns multiple */
  const adsToShow = ads.slice(0, 1);

  return <>{adsToShow.map((ad, index) => renderAdCard(ad, index))}</>;
};

export default FloatingAd;
