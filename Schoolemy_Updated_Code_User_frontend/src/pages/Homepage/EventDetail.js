import React, { useEffect, useState } from "react";
import { getEventById } from "../../service/eventapi";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiInfo,
  FiImage,
} from "react-icons/fi";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%);
  padding: 2rem 1.5rem 4rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem 3rem;
  }
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #0f766e;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    border-color: #14b8a6;
    background: #f0fdfa;
    transform: translateX(-2px);
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
`;

const Spinner = styled.div`
  width: 44px;
  height: 44px;
  border: 3px solid #e2e8f0;
  border-top-color: #14b8a6;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingText = styled.p`
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
`;

const ErrorCard = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #fecaca;
`;

const ErrorTitle = styled.h3`
  color: #dc2626;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
`;

const ErrorText = styled.p`
  color: #64748b;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const ErrorButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
  }
`;

const SecondaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
  }
`;

const MainCard = styled.article`
  background: #fff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  animation: ${fadeIn} 0.5s ease-out;
`;

const HeroImage = styled.div`
  width: 100%;
  height: 320px;
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    height: 240px;
  }
`;

const CardContent = styled.div`
  padding: 2rem 2.5rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1.25rem;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.35rem 1rem;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 100px;
  margin-bottom: 1rem;
  background: ${({ $status }) =>
    $status === "Upcoming"
      ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
      : $status === "Ongoing"
        ? "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)"
        : "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)"};
  color: ${({ $status }) =>
    $status === "Upcoming"
      ? "#047857"
      : $status === "Ongoing"
        ? "#c2410c"
        : "#b91c1c"};
`;

const EventTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 1.5rem 0;
  line-height: 1.3;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #f1f5f9;

  svg {
    flex-shrink: 0;
    color: #14b8a6;
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.1rem;
  }
`;

const InfoLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
`;

const Section = styled.section`
  margin-bottom: 2rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1rem 0;

  svg {
    color: #14b8a6;
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const Description = styled.p`
  font-size: 1rem;
  line-height: 1.75;
  color: #475569;
  margin: 0;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
`;

const GalleryImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }
`;

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvent = async (skipImages = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEventById(id, skipImages);
      setEvent(res.data.data);
    } catch (err) {
      console.error("Error loading event:", err);
      if (
        !skipImages &&
        (err?.response?.status === 413 ||
          err?.message?.includes("maxContentLength"))
      ) {
        loadEvent(true);
        return;
      }
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load event. Please try again.",
      );
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading && !event) {
    return (
      <PageWrapper>
        <ContentWrapper>
          <LoadingWrapper>
            <Spinner />
            <LoadingText>Loading event...</LoadingText>
          </LoadingWrapper>
        </ContentWrapper>
      </PageWrapper>
    );
  }

  if (error && !event) {
    return (
      <PageWrapper>
        <ContentWrapper>
          <BackButton onClick={() => navigate("/events")}>
            <FiArrowLeft size={18} />
            Back to Events
          </BackButton>
          <ErrorCard>
            <ErrorTitle>Unable to load event</ErrorTitle>
            <ErrorText>{error}</ErrorText>
            <ErrorButtons>
              <PrimaryButton onClick={() => navigate("/events")}>
                Back to Events
              </PrimaryButton>
              <SecondaryButton onClick={() => loadEvent()}>
                Retry
              </SecondaryButton>
            </ErrorButtons>
          </ErrorCard>
        </ContentWrapper>
      </PageWrapper>
    );
  }

  if (!event) return null;

  return (
    <PageWrapper>
      <ContentWrapper>
        <BackButton onClick={() => navigate("/events")}>
          <FiArrowLeft size={18} />
          Back to Events
        </BackButton>

        <MainCard>
          <HeroImage>
            {event.coverImages?.length > 0 ? (
              (() => {
                const first = event.coverImages[0];
                // New format: S3 URL string
                if (typeof first === "string") {
                  return (
                    <img
                      src={first}
                      alt={event.eventName}
                    />
                  );
                }
                // Backwards compatibility for old base64 object format
                if (first?.data) {
                  return (
                    <img
                      src={`data:${first.contentType || "image/jpeg"};base64,${first.data}`}
                      alt={event.eventName}
                    />
                  );
                }
                return <FiImage size={64} color="#14b8a6" opacity={0.4} />;
              })()
            ) : (
              <FiImage size={64} color="#14b8a6" opacity={0.4} />
            )}
          </HeroImage>

          <CardContent>
            <StatusBadge $status={event.status}>{event.status}</StatusBadge>
            <EventTitle>{event.eventName}</EventTitle>

            <InfoGrid>
              <InfoItem>
                <FiCalendar />
                <div>
                  <InfoLabel>Date</InfoLabel>
                  <InfoValue>{event.date}</InfoValue>
                </div>
              </InfoItem>
              <InfoItem>
                <FiClock />
                <div>
                  <InfoLabel>Time</InfoLabel>
                  <InfoValue>{event.time}</InfoValue>
                </div>
              </InfoItem>
              <InfoItem>
                <FiInfo />
                <div>
                  <InfoLabel>Category</InfoLabel>
                  <InfoValue>{event.category}</InfoValue>
                </div>
              </InfoItem>
              <InfoItem>
                <FiMapPin />
                <div>
                  <InfoLabel>Venue</InfoLabel>
                  <InfoValue>
                    {event.venue?.type === "Offline"
                      ? event.venue?.location || "—"
                      : "Online"}
                  </InfoValue>
                </div>
              </InfoItem>
            </InfoGrid>

            <Section>
              <SectionTitle>
                <FiInfo size={18} />
                Description
              </SectionTitle>
              <Description>{event.description}</Description>
            </Section>

            {event.coverImages?.length > 1 && (
              <Section>
                <SectionTitle>
                  <FiImage size={18} />
                  Event Gallery
                </SectionTitle>
                <ImageGrid>
                  {event.coverImages.slice(1).map((img, index) => {
                    // New format: each item is an S3 URL string
                    if (typeof img === "string") {
                      return (
                        <GalleryImage
                          key={index}
                          src={img}
                          alt={`Event ${index + 2}`}
                        />
                      );
                    }
                    // Backwards compatibility for old base64 object format
                    if (img?.data) {
                      return (
                        <GalleryImage
                          key={index}
                          src={`data:${img.contentType || "image/jpeg"};base64,${img.data}`}
                          alt={`Event ${index + 2}`}
                        />
                      );
                    }
                    return null;
                  })}
                </ImageGrid>
              </Section>
            )}
          </CardContent>
        </MainCard>
      </ContentWrapper>
    </PageWrapper>
  );
};

export default EventDetails;
