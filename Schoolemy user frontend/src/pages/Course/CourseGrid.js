import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import api from "../../service/api"; // Use centralized API instance
import { getApprovedTutorCourses } from "../../service/courseApi";
import {
  FaStar,
  FaRegClock,
  FaUser,
  FaGraduationCap,
  FaPlay,
  FaHeart,
  FaBookmark,
  FaChalkboardTeacher,
} from "react-icons/fa";

// === ALL KEYFRAME ANIMATIONS FROM THE OLD CODE ===
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(25, 118, 210, 0.6);
  }
`;

// --- STYLED COMPONENTS FOR THE MAIN SECTION (from new code) ---

const PopularCoursesSection = styled.section`
  background: radial-gradient(circle at top left, #e3f2fd 0, #f9fafb 40%, #edf2f7 100%);
  padding: 72px 0 80px;
  width: 100%;
`;

const Container = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
`;

// --- Section header + controls (new world‑class layout) ---

const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;

  @media (min-width: 992px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

const SectionTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Eyebrow = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #1976d2;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
`;

const SectionSubtitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #64748b;
  max-width: 560px;
`;

const ControlsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;

  @media (min-width: 992px) {
    justify-content: flex-end;
    margin-top: 0;
  }
`;

const PillButton = styled.button`
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background-color: rgba(255, 255, 255, 0.85);
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;

  span.badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #22c55e;
  }

  &:hover {
    border-color: #1976d2;
    color: #0f172a;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
    transform: translateY(-1px);
  }
`;

// --- The Modern, Responsive CoursesGrid (from new code) ---
const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

// --- STYLED COMPONENTS FOR THE CARD (with old animations) ---

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(149, 157, 165, 0.1);
  position: relative;

  /* Initial animation for the card appearing */
  animation: ${fadeInUp} 0.6s ease-out;
  animation-fill-mode: backwards;

  /* Smoother hover transition */
  transition: all 0.3s ease-out;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(25, 118, 210, 0.15);

    .thumbnail-overlay {
      opacity: 1;
    }

    .play-button {
      transform: scale(1.2);
      animation: ${glow} 2s ease-in-out infinite;
    }

    .course-title {
      background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .action-buttons {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Gradient bar on hover from old code */
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #1976d2, #42a5f5, #90caf9, #e3f2fd);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;
  }

  &:hover:before {
    opacity: 1;
  }
`;

const CourseCard = styled.div`
  background: radial-gradient(circle at top, #ffffff 0, #f9fafb 65%, #eef2ff 100%);
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
`;

const Thumbnail = styled.div`
  position: relative;
  overflow: hidden; /* This keeps the overlay and buttons inside */

  img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease-out;
  }

  /* Image zoom effect from old code */
  ${CardLink}:hover & img {
    transform: scale(1.15);
  }
`;

// === Re-introduced components for hover effects ===

const ThumbnailOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* Remove background so image stays visible on hover */
  background: transparent;
  opacity: 0;
  transition: all 0.4s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Remove blur so image is clear */
  backdrop-filter: none;
  pointer-events: none;
`;

const PlayButton = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
  font-size: 16px;
  transition: all 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ActionButtons = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 0.75rem;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
`;

const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  /* No solid background so icons sit directly on the card */
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: none;

  &:hover {
    /* Only color + scale change on hover, no white box */
    color: #1976d2;
    transform: scale(1.1);
  }
`;

const Badge = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  color: white;
  padding: 6px 14px;
  font-size: 0.75rem;
  border-radius: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 5; /* Ensure badge is above image but below overlay */

  &.hard {
    background: #ff4757;
  }
  &.beginner {
    background: #1e90ff;
  }
  &.intermediate {
    background: #ffa502;
  }
  &.tutor-course {
    background: #9c27b0;
    top: 16px;
    left: auto;
    right: 16px;
  }
`;

const CourseInfo = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
  line-height: 1.3;
  transition: all 0.3s ease;
`;

const Instructor = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #64748b;
  gap: 8px;
  svg {
    font-size: 1rem;
  }
`;

const MetaInfoContainer = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const MetaPill = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
`;

const Rating = styled(MetaPill)`
  background-color: #fff4e5;
  color: #ff9800;
`;

const Duration = styled(MetaPill)`
  background-color: #e3f2fd;
  color: #1e90ff;
`;

const EnrollmentCount = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  background-color: #f8f9fa;
  padding: 8px 14px;
  border-radius: 12px;
`;

const PriceContainer = styled.div`
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const Price = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
`;

const PriceRowActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PriceActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;

  &:hover {
    color: #1976d2;
    border-color: #1976d2;
    background: rgba(25, 118, 210, 0.05);
    transform: scale(1.1);
  }

  &.liked {
    color: #ef4444;
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  &.bookmarked {
    color: #1976d2;
    border-color: #1976d2;
    background: rgba(25, 118, 210, 0.1);
  }
`;

// === HELPER FUNCTION (unchanged) ===
const formatDuration = (duration) => {
  if (!duration || typeof duration !== "string") return "N/A";
  const durationStr = duration.trim().toLowerCase();

  if (durationStr.includes("month")) {
    const value = parseInt(durationStr) || 0;
    return `${value} mo`;
  } else if (durationStr.includes("year")) {
    const value = parseInt(durationStr) || 0;
    return `${value} yr${value > 1 ? "s" : ""}`;
  }
  return duration;
};

// === MAIN COMPONENT (with updated JSX) ===
const PopularCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track liked / bookmarked course IDs (per user)
  const [likedCourses, setLikedCourses] = useState(new Set());
  const [bookmarkedCourses, setBookmarkedCourses] = useState(new Set());

  // Fetch courses - works for both logged in and non-logged in users
  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoading(true);
    
    const headers = {};
    // Only add authorization if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Fetch both regular courses and tutor courses in parallel
    Promise.all([
      api.get("/courses/user-view").catch((err) => {
        console.error("Failed to fetch regular courses", err);
        return { data: { data: [] } };
      }),
      getApprovedTutorCourses().catch((err) => {
        console.error("Failed to fetch tutor courses", err);
        // Return structure matching the API response format
        return { success: false, data: [], message: err.message };
      })
    ])
      .then(([regularRes, tutorRes]) => {
        const regularCourses = (regularRes.data?.data || []).map(course => ({
          ...course,
          isTutorCourse: false
        }));
        
        // getApprovedTutorCourses() returns response.data, which is { success, message, data: courses }
        // So tutorRes is already the parsed response object: { success: true, data: courses }
        // Handle both the success response and the error fallback
        let tutorCoursesData = [];
        if (tutorRes && tutorRes.success && tutorRes.data) {
          // Normal response: { success: true, data: courses }
          tutorCoursesData = Array.isArray(tutorRes.data) ? tutorRes.data : [];
        } else if (Array.isArray(tutorRes)) {
          // Fallback: direct array
          tutorCoursesData = tutorRes;
        } else if (tutorRes?.data && Array.isArray(tutorRes.data)) {
          // Another possible structure
          tutorCoursesData = tutorRes.data;
        }
        
        const tutorCourses = tutorCoursesData.map(course => ({
          ...course,
          isTutorCourse: true
        }));
        
        console.log("Regular courses:", regularCourses.length);
        console.log("Tutor courses:", tutorCourses.length);
        console.log("Tutor courses response:", tutorRes);
        
        // Merge both arrays
        const allCourses = [...regularCourses, ...tutorCourses];
        setCourses(allCourses);
      })
      .catch((err) => {
        console.error("Failed to fetch courses", err);
        // Don't break the UI - just show empty courses
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load persisted likes/bookmarks for the currently logged-in user
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const liked = JSON.parse(
        localStorage.getItem(`likedCourses_${userId}`) || "[]"
      );
      const bookmarked = JSON.parse(
        localStorage.getItem(`bookmarkedCourses_${userId}`) || "[]"
      );

      setLikedCourses(new Set(Array.isArray(liked) ? liked : []));
      setBookmarkedCourses(new Set(Array.isArray(bookmarked) ? bookmarked : []));
    } catch (err) {
      console.error("Failed to load liked/bookmarked courses from storage", err);
    }
  }, []);

  const handleLike = (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();
    const userId = localStorage.getItem("userId");

    setLikedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }

      // Persist per user so color stays after refresh / re-login
      if (userId) {
        try {
          localStorage.setItem(
            `likedCourses_${userId}`,
            JSON.stringify(Array.from(newSet))
          );
        } catch (err) {
          console.error("Failed to persist liked courses", err);
        }
      }

      return newSet;
    });
    // TODO: Optional: Add API call to like/unlike course on backend
  };

  const handleBookmark = (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();
    const userId = localStorage.getItem("userId");

    setBookmarkedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }

      // Persist per user so bookmarks survive refresh / re-login
      if (userId) {
        try {
          localStorage.setItem(
            `bookmarkedCourses_${userId}`,
            JSON.stringify(Array.from(newSet))
          );
        } catch (err) {
          console.error("Failed to persist bookmarked courses", err);
        }
      }

      return newSet;
    });
    // TODO: Optional: Add API call to bookmark/unbookmark course on backend
  };

  if (loading)
    return (
      <PopularCoursesSection>
        <Container>
          <h2>Loading Courses...</h2>
        </Container>
      </PopularCoursesSection>
    );
  if (courses.length === 0)
    return (
      <PopularCoursesSection>
        <Container>
          <h2>No Courses Found</h2>
        </Container>
      </PopularCoursesSection>
    );

  // Ensure bookmarked courses appear first for this user
  const sortedCourses = [...courses].sort((a, b) => {
    const aBookmarked = bookmarkedCourses.has(a._id);
    const bBookmarked = bookmarkedCourses.has(b._id);

    if (aBookmarked === bBookmarked) return 0;
    return aBookmarked ? -1 : 1;
  });

  return (
    <PopularCoursesSection>
      <Container>
        <CoursesGrid>
          {sortedCourses.map((course, index) => (
            <CardLink
              to={course.isTutorCourse ? `/tutor-course/${course._id}` : `/course/${course._id}`}
              key={course._id}
              // Staggered animation delay from old code
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => window.scrollTo(0, 0)}
            >
              <CourseCard>
                <Thumbnail>
                  <img
                    src={course.thumbnail || "/default-course.jpg"}
                    alt={course.coursename || course.title}
                  />
                  {/* These are the re-introduced hover components */}
                  <ThumbnailOverlay className="thumbnail-overlay">
                    <PlayButton className="play-button">
                      <FaPlay />
                    </PlayButton>
                  </ThumbnailOverlay>

                  <Badge className={course.level?.toLowerCase() || "beginner"}>
                    {course.level || "BEGINNER"}
                  </Badge>
                  
                  {course.isTutorCourse && (
                    <Badge className="tutor-course">
                      <FaChalkboardTeacher style={{ marginRight: '4px', fontSize: '0.7rem' }} />
                      TUTOR
                    </Badge>
                  )}
                </Thumbnail>
                <CourseInfo>
                  {/* Added className for hover effect to target this title */}
                  <Title className="course-title">{course.coursename || course.title}</Title>
                  <Instructor>
                    <FaUser />
                    {typeof course.instructor === 'object' ? course.instructor?.name : course.instructor || "Expert Instructor"}
                  </Instructor>
                  <MetaInfoContainer>
                    <Rating>
                      <FaStar />
                      {course.rating?.toFixed(1) || "4.5"}
                    </Rating>
                    <Duration>
                      <FaRegClock />
                      {formatDuration(course.courseduration)}
                    </Duration>
                  </MetaInfoContainer>

                  <EnrollmentCount>
                    <FaGraduationCap />
                    {Number(course.studentEnrollmentCount) || 0} students enrolled
                  </EnrollmentCount>

                  <PriceContainer>
                    <Price>
                      ₹{course.price?.finalPrice ?? course.price?.amount ?? 0}
                    </Price>
                    <PriceRowActions>
                      <PriceActionButton
                        className={likedCourses.has(course._id) ? "liked" : ""}
                        onClick={(e) => handleLike(e, course._id)}
                        aria-label="Like course"
                      >
                        <FaHeart />
                      </PriceActionButton>
                      <PriceActionButton
                        className={bookmarkedCourses.has(course._id) ? "bookmarked" : ""}
                        onClick={(e) => handleBookmark(e, course._id)}
                        aria-label="Bookmark course"
                      >
                        <FaBookmark />
                      </PriceActionButton>
                    </PriceRowActions>
                  </PriceContainer>
                </CourseInfo>
              </CourseCard>
            </CardLink>
          ))}
        </CoursesGrid>
      </Container>
    </PopularCoursesSection>
  );
};

export default PopularCourses;
