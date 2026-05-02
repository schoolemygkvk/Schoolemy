import React, { useEffect, useState } from "react";
import { getAllEvents } from "../../service/eventapi.js";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { FiCalendar, FiMapPin, FiClock, FiArrowRight, FiArrowLeft } from "react-icons/fi";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
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
  max-width: 1280px;
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

const PageHeader = styled.header`
  text-align: center;
  margin-bottom: 3rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

  @media (max-width: 768px) {
    font-size: 1.875rem;
  }
`;

const PageSubtitle = styled.p`
  font-size: 1.125rem;
  color: #64748b;
  font-weight: 500;
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  gap: 1rem;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color:rgb(187, 215, 126);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingText = styled.p`
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
`;

const ErrorCard = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 16px;
  padding: 2rem;
  margin: 0 auto 2rem;
  max-width: 560px;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  color: #dc2626;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
`;

const ErrorText = styled.p`
  color: #991b1b;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const RetryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
`;

const EmptyText = styled.p`
  font-size: 1.125rem;
  color: #64748b;
  font-weight: 500;
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.75rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`;

const EventCard = styled.article`
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${fadeIn} 0.5s ease-out backwards;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(15, 118, 110, 0.12);
    border-color: rgba(20, 184, 166, 0.2);

    .card-arrow {
      transform: translateX(4px);
      opacity: 1;
    }
  }
`;

const CardImage = styled.div`
  width: 100%;
  height: 200px;
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
`;

const CardBody = styled.div`
  padding: 1.5rem;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 100px;
  margin-bottom: 0.75rem;
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

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1rem 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;

  svg {
    flex-shrink: 0;
    color: #14b8a6;
    width: 1rem;
    height: 1rem;
  }
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
`;

const ViewLink = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #14b8a6;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s ease;

  .card-arrow {
    transition: transform 0.2s ease, opacity 0.2s ease;
    opacity: 0.8;
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2.5rem;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  padding: 0.625rem 1.25rem;
  background: ${({ $active }) =>
    $active
      ? "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)"
      : "#fff"};
  color: ${({ $active }) => ($active ? "#fff" : "#64748b")};
  border: 1px solid ${({ $active }) => ($active ? "transparent" : "#e2e8f0")};
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.25);
  }
`;

const PaginationText = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #475569;
`;

const EventPage = () => {
  const [events, setEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadEvents = async (page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllEvents(page, 6);
      if (res.data && res.data.data) {
        setEvents(res.data.data);
        setHasMore(res.data.data.length === 6);
      }
    } catch (err) {
      console.error("Error loading events:", err);
      let errorMessage = "Failed to load events.";
      if (err.response?.status === 502) {
        errorMessage =
          "Server is temporarily unavailable. Please try again later.";
      } else if (err.request) {
        errorMessage =
          "Cannot connect to server. Please check your connection.";
      } else {
        errorMessage += ` ${err.message}`;
      }
      setError(errorMessage);
      setEvents([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(currentPage);
  }, [currentPage]);

  return (
    <PageWrapper>
      <ContentWrapper>
        <BackButton onClick={() => navigate("/")}>
          <FiArrowLeft size={18} />
          Back to Home
        </BackButton>
        <PageHeader>
          <PageTitle>Events</PageTitle>
          <PageSubtitle>Discover upcoming workshops, webinars & more</PageSubtitle>
        </PageHeader>

        {loading && (
          <LoadingWrapper>
            <Spinner />
            <LoadingText>Loading events...</LoadingText>
          </LoadingWrapper>
        )}

        {error && !loading && (
          <ErrorCard>
            <ErrorTitle>Unable to load events</ErrorTitle>
            <ErrorText>{error}</ErrorText>
            <RetryButton onClick={() => loadEvents(currentPage)}>
              Try again
            </RetryButton>
          </ErrorCard>
        )}

        {!loading && !error && events.length === 0 && (
          <EmptyState>
            <EmptyText>No events found at the moment.</EmptyText>
          </EmptyState>
        )}

        {!loading && events.length > 0 && (
          <>
            <EventsGrid>
              {events.map((e, index) => (
                <EventCard
                  key={e._id}
                  onClick={() => navigate(`/events/${e._id}`)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardImage>
                    {e.coverImages?.length > 0 ? (
                      (() => {
                        const first = e.coverImages[0];
                        // If backend sends S3 URL strings
                        if (typeof first === "string") {
                          return (
                            <img
                              src={first}
                              alt={e.eventName}
                            />
                          );
                        }
                        // Backwards compatibility for old base64 objects
                        if (first?.data) {
                          return (
                            <img
                              src={`data:${first.contentType || "image/jpeg"};base64,${first.data}`}
                              alt={e.eventName}
                            />
                          );
                        }
                        return (
                          <FiCalendar size={48} color="#14b8a6" opacity={0.5} />
                        );
                      })()
                    ) : (
                      <FiCalendar size={48} color="#14b8a6" opacity={0.5} />
                    )}
                  </CardImage>
                  <CardBody>
                    <StatusBadge $status={e.status}>{e.status}</StatusBadge>
                    <CardTitle>{e.eventName}</CardTitle>
                    <MetaRow>
                      <MetaItem>
                        <FiCalendar />
                        {e.date}
                      </MetaItem>
                      <MetaItem>
                        <FiClock />
                        {e.time}
                      </MetaItem>
                      <MetaItem>
                        <FiMapPin />
                        {e.category}
                      </MetaItem>
                    </MetaRow>
                    <CardFooter>
                      <ViewLink>
                        View details
                        <FiArrowRight className="card-arrow" size={18} />
                      </ViewLink>
                    </CardFooter>
                  </CardBody>
                </EventCard>
              ))}
            </EventsGrid>

            <Pagination>
              <PaginationButton
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                $active={false}
                $disabled={currentPage === 1}
              >
                Previous
              </PaginationButton>
              <PaginationText>Page {currentPage}</PaginationText>
              <PaginationButton
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!hasMore}
                $active={false}
                $disabled={!hasMore}
              >
                Next
              </PaginationButton>
            </Pagination>
          </>
        )}
      </ContentWrapper>
    </PageWrapper>
  );
};

export default EventPage;
