import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import styled from "styled-components";
import { FaHeart, FaTrash, FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  getWishlist,
  removeFromWishlist,
  syncWishlist,
} from "../../service/wishlistService";
import { useAuth } from "../../Context/AuthContext";
import { collectAllBookmarkIdsFromStorage } from "../../utils/wishlistStorage";

function rowCourseId(item) {
  const cid = item?.courseId;
  if (cid && typeof cid === "object" && cid._id != null) return String(cid._id);
  return cid != null ? String(cid) : "";
}

// ============ STYLED COMPONENTS ============

const PageContainer = styled.div`
  min-height: 100vh;
  background: #ffffff;
  padding: 24px 16px 48px;
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: 32px 24px 56px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 24px;
  text-align: center;

  @media (min-width: 768px) {
    margin-bottom: 32px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px 0;

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  max-width: 480px;
  margin: 0 auto;

  @media (min-width: 768px) {
    padding: 64px 40px;
  }

  svg {
    font-size: 4rem;
    color: #cbd5e1;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 1.8rem;
    color: #0f172a;
    margin: 0 0 10px 0;
  }

  p {
    font-size: 1rem;
    color: #64748b;
    margin: 0 0 30px 0;
  }
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 32px;

  @media (min-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
`;

const CourseCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;

  &:hover {
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
    border-color: #cbd5e1;
    transform: translateY(-2px);
  }
`;

const CourseImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;

  @media (min-width: 480px) {
    height: 170px;
  }

  @media (min-width: 768px) {
    height: 180px;
  }

  ${CourseCard}:hover & {
    transform: scale(1.05);
  }
`;

const CourseInfo = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
`;

const CourseTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1.35;
  cursor: pointer;
  transition: color 0.3s ease;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (min-width: 768px) {
    font-size: 1.1rem;
    -webkit-line-clamp: 3;
  }

  &:hover {
    color: #1976d2;
  }
`;

const CourseCategory = styled.p`
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const CourseMetaInfo = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const MetaBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
`;

const PriceSection = styled.div`
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  border-top: 1px solid #e2e8f0;
  padding-top: 14px;

  @media (min-width: 400px) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px 16px;
    padding-top: 16px;
  }
`;

const Price = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;

  @media (min-width: 400px) {
    font-size: 1.5rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  @media (min-width: 400px) {
    flex-direction: row;
    flex-wrap: wrap;
    width: auto;
    gap: 10px;
    justify-content: flex-end;
    flex: 1;
    min-width: 0;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const EnrollButton = styled(Button)`
  background: #1976d2;
  color: white;
  width: 100%;
  justify-content: center;
  white-space: nowrap;
  min-height: 38px;

  @media (min-width: 400px) {
    width: auto;
    flex: 1;
    min-width: 120px;
  }

  &:hover {
    background: #1565c0;
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  }
`;

const RemoveButton = styled(Button)`
  background: #fee2e2;
  color: #ef4444;
  width: 100%;
  justify-content: center;

  @media (min-width: 400px) {
    width: auto;
    flex: 0 0 auto;
  }

  &:hover {
    background: #fecaca;
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 60px 20px;

  div {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #1976d2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// ============ MAIN COMPONENT ============

const WishlistPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isAuthLoading } = useAuth();
  const { onLoginClick } = useOutletContext() ?? {};
  const openLogin = React.useCallback(onLoginClick ?? (() => {}), [onLoginClick]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(null);


  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let response = await getWishlist();
      let list = Array.isArray(response?.data) ? response.data : [];

      if (!response?.success) {
        throw new Error(response?.message || "Failed to load wishlist");
      }

      const serverIds = list.map(rowCourseId).filter(Boolean);
      const serverSet = new Set(serverIds);
      const localIds = collectAllBookmarkIdsFromStorage();
      const needsPush =
        isLoggedIn &&
        localIds.length > 0 &&
        localIds.some((cid) => !serverSet.has(cid));

      if (needsPush) {
        const merged = [...new Set([...serverIds, ...localIds])];
        try {
          const syncRes = await syncWishlist(merged);
          if (syncRes?.success) {
            response = await getWishlist();
            list = Array.isArray(response?.data) ? response.data : [];
          }
        } catch (syncErr) {
          console.warn("Wishlist sync from browser storage failed:", syncErr);
        }
      }

      setWishlist(list);
    } catch (err) {
      console.error("Error loading wishlist:", err);
      const status = err?.response?.status;
      if (status === 401) {
        setError("Session expired. Please sign in again.");
      } else {
        setError(err.message || "Failed to load wishlist");
      }
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const wishlistPath =
    (location.pathname || "").replace(/\/+$/, "") === "/wishlist";

  // Load as soon as /wishlist opens with a token (do not wait for profile fetch).
  useEffect(() => {
    if (!wishlistPath) return;
    if (!isLoggedIn) return;
    loadWishlist();
  }, [wishlistPath, location.pathname, loadWishlist, isLoggedIn]);

  useEffect(() => {
    if (!wishlistPath) return;
    if (isAuthLoading) return;
    if (!isLoggedIn) {
      openLogin();
    }
  }, [wishlistPath, isAuthLoading, isLoggedIn, openLogin]);

  const handleRemove = async (courseId, courseName) => {
    const id = String(courseId);
    try {
      setRemoving(id);
      const response = await removeFromWishlist(id);

      if (response.success) {
        setWishlist((prev) =>
          prev.filter((item) => wishlistItemId(item) !== id),
        );
        toast.success(`${courseName} removed from wishlist`);
      } else {
        throw new Error(response.message || "Failed to remove course");
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      toast.error("Failed to remove course from wishlist");
    } finally {
      setRemoving(null);
    }
  };

  const wishlistItemId = (item) => rowCourseId(item);

  const courseDetailPath = (item) => {
    const id = wishlistItemId(item);
    if (!id) return "/course";
    return item.courseSnapshot?.isTutorCourse
      ? `/tutor-course/${id}`
      : `/course/${id}`;
  };

  const isCourseEnrolled = (item) => {
    const enrollmentFlag =
      item?.courseSnapshot?.isEnrolled ??
      item?.courseSnapshot?.enrolled ??
      item?.isEnrolled ??
      item?.enrolled;
    const enrollmentStatus =
      item?.courseSnapshot?.enrollmentStatus ??
      item?.enrollmentStatus ??
      item?.courseSnapshot?.accessStatus ??
      item?.accessStatus;
    const normalizedStatus =
      typeof enrollmentStatus === "string"
        ? enrollmentStatus.trim().toLowerCase()
        : "";

    return (
      Boolean(enrollmentFlag) ||
      ["enrolled", "purchased", "full", "active", "completed"].includes(
        normalizedStatus,
      )
    );
  };

  const handleEnroll = (item) => {
    navigate(courseDetailPath(item));
  };

  const handleCourseClick = (item) => {
    navigate(courseDetailPath(item));
  };

  const sortedWishlist = useMemo(() => {
    return [...wishlist].sort(
      (a, b) =>
        new Date(b.addedAt || 0).getTime() -
        new Date(a.addedAt || 0).getTime(),
    );
  }, [wishlist]);

  if (isAuthLoading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <LoadingSpinner>
            <div></div>
          </LoadingSpinner>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (!isLoggedIn) {
    return (
      <PageContainer>
        <ContentWrapper>
          <EmptyState>
            <FaHeart />
            <h2>Please Log In</h2>
            <p>You need to be logged in to view your wishlist</p>
            <button onClick={openLogin} style={{
              padding: "10px 20px",
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}>
              Log In
            </button>
          </EmptyState>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <LoadingSpinner>
            <div></div>
          </LoadingSpinner>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentWrapper>
          <EmptyState>
            <h2>Error Loading Wishlist</h2>
            <p>{error}</p>
            <button onClick={loadWishlist} style={{
              padding: "10px 20px",
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}>
              Retry
            </button>
          </EmptyState>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (wishlist.length === 0) {
    return (
      <PageContainer>
        <ContentWrapper>
          <Header>
            <Title>My Wishlist</Title>
            <Subtitle>0 courses saved</Subtitle>
          </Header>
          <EmptyState>
            <FaHeart />
            <h2>Your Wishlist is Empty</h2>
            <p>Start adding courses to your wishlist to save them for later</p>
            <button onClick={() => navigate("/")} style={{
              padding: "10px 20px",
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}>
              Browse Courses
            </button>
          </EmptyState>
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <Header>
          <Title>My Wishlist</Title>
          <Subtitle>{wishlist.length} course{wishlist.length !== 1 ? "s" : ""} saved</Subtitle>
        </Header>

        <CoursesGrid>
          {sortedWishlist.map((item) => (
            <CourseCard key={wishlistItemId(item)}>
              <CourseImage
                src={item.courseSnapshot?.thumbnail || "/default-course.jpg"}
                alt={item.courseSnapshot?.title}
                onClick={() => handleCourseClick(item)}
              />
              <CourseInfo>
                <CourseCategory>
                  {item.courseSnapshot?.category || "Category"}
                </CourseCategory>
                <CourseTitle onClick={() => handleCourseClick(item)}>
                  {item.courseSnapshot?.title || "Course"}
                </CourseTitle>
                <CourseMetaInfo>
                  {item.courseSnapshot?.level && (
                    <MetaBadge>{item.courseSnapshot.level.toUpperCase()}</MetaBadge>
                  )}
                  {item.courseSnapshot?.rating && (
                    <MetaBadge>★ {item.courseSnapshot.rating.toFixed(1)}</MetaBadge>
                  )}
                </CourseMetaInfo>
              </CourseInfo>
              <PriceSection>
                <Price>
                  ₹{item.courseSnapshot?.price?.finalPrice || 0}
                </Price>
                <ActionButtons>
                  <RemoveButton
                    type="button"
                    onClick={() =>
                      handleRemove(
                        wishlistItemId(item),
                        item.courseSnapshot?.title,
                      )
                    }
                    disabled={removing === wishlistItemId(item)}
                    title="Remove from wishlist"
                  >
                    <FaTrash />
                  </RemoveButton>
                 
                </ActionButtons>
              </PriceSection>
            </CourseCard>
          ))}
        </CoursesGrid>
      </ContentWrapper>
    </PageContainer>
  );
};

export default WishlistPage;
