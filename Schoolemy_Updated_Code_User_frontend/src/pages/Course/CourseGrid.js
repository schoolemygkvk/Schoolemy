import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import api, { publicApi } from "../../service/api"; // Use centralized API instance
import { getApprovedTutorCourses } from "../../service/courseApi";
import { getWishlist, addToWishlist, removeFromWishlist, syncWishlist } from "../../service/wishlistService";
import EnrollmentBadge from "../../components/Course/EnrollmentBadge";
import {
  FaStar,
  FaRegClock,
  FaUser,
  FaGraduationCap,
  FaPlay,
  FaHeart,
  FaBookmark,
  FaChalkboardTeacher,
  FaArrowRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  collectAllBookmarkIdsFromStorage,
  writeBookmarkIdsToPrimaryKey,
} from "../../utils/wishlistStorage";

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

/* div (not <a>) so inner <button>s (enroll, bookmark) are valid and receive clicks */
const CourseCardOuter = styled.div`
  text-decoration: none;
  color: inherit;
  display: flex;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(149, 157, 165, 0.1);
  position: relative;
  cursor: pointer;

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

  /* BUG 2.8.1: Enrolled card styling */
  &.enrolled {
    &:before {
      background: linear-gradient(90deg, #22c55e, #16a34a, #22c55e);
    }

    &:hover:before {
      opacity: 1;
    }
  }
`;

// BUG 2.8.1: Card style for enrolled courses
const EnrolledCard = styled.div`
  background: radial-gradient(
    circle at top,
    #ffffff 0%,
    #f8fbf8 65%,
    #ecf6f0 100%
  );
`;

const RegularCard = styled.div`
  background: radial-gradient(circle at top, #ffffff 0%, #f9fafb 65%, #eef2ff 100%);
`;

const CourseCard = styled.div`
  background: radial-gradient(circle at top, #ffffff 0, #f9fafb 65%, #eef2ff 100%);
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;

  /* BUG 2.8.1: Override background for enrolled courses */
  &.enrolled {
    background: radial-gradient(
      circle at top,
      #ffffff 0%,
      #f8fbf8 65%,
      #ecf6f0 100%
    );
  }
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
  ${CourseCardOuter}:hover & img {
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
  flex-wrap: wrap;
  gap: 8px;

  /* BUG 2.8.1: Adjust layout for enrolled state */
  &.enrolled {
    border-top-color: #d1fae5;
  }
`;

/** Inline text-style action (not a solid button) — enroll / continue */
const EnrollActionText = styled.button`
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: color 0.2s ease;
  position: relative;
  z-index: 1;
  pointer-events: auto;

  &:hover:not(:disabled) {
    color: #0d47a1;
  }

  &.enrolled {
    color: #15803d;
    &:hover:not(:disabled) {
      color: #166534;
    }
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    font-size: 0.82rem;
  }
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
  position: relative;
  z-index: 2;
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

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }

  &:disabled:hover {
    color: #64748b;
    border-color: #e2e8f0;
    background: transparent;
    transform: none;
  }
`;

// BUG 2.8.1: Progress bar for enrolled courses
const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;

  &:after {
    content: "";
    display: block;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
`;

// === HELPER FUNCTION (unchanged) ===
/** Normalize wishlist API row `courseId` (string or populated object). */
const wishlistRowCourseId = (item) => {
  const cid = item?.courseId;
  if (cid && typeof cid === "object" && cid._id != null) return String(cid._id);
  return cid != null ? String(cid) : "";
};

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
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track liked / bookmarked course IDs (per user)
  const [likedCourses, setLikedCourses] = useState(new Set());
  const [bookmarkedCourses, setBookmarkedCourses] = useState(new Set());
  const [syncingWishlist, setSyncingWishlist] = useState(false);
  /** Keeps bookmark toggles correct for rapid clicks (React state is async). */
  const bookmarkedRef = useRef(new Set());
  // BUG 2.8.1: Track enrolled courses
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());

  // Fetch courses - works for both logged in and non-logged in users
  // SECURITY FIX 3.19.1: Public course endpoints don't require authentication
  // Using publicApi instance that doesn't add tokens
  useEffect(() => {
    setLoading(true);

    // Fetch both regular courses and tutor courses in parallel
    Promise.all([
      api.get("/api/v1/courses/user-view").catch((err) => {
        console.error("Failed to fetch regular courses", err);
        return { data: {} };
      }),
      getApprovedTutorCourses().catch((err) => {
        console.error("Failed to fetch tutor courses", err);
        return { success: false, data: [], message: err.message };
      })
    ])
      .then(async ([regularRes, tutorRes]) => {
        // Handle multiple possible response shapes from backend:
        // { data: [...] } or { courses: [...] } or [...] directly
        const body = regularRes.data;
        const regularCourses = (
          Array.isArray(body) ? body :
          Array.isArray(body?.data) ? body.data :
          Array.isArray(body?.courses) ? body.courses :
          []
        ).map(course => ({ ...course, isTutorCourse: false }));

        // getApprovedTutorCourses() returns { success, data: [...] }
        let tutorCoursesData = [];
        if (tutorRes && tutorRes.success && Array.isArray(tutorRes.data)) {
          tutorCoursesData = tutorRes.data;
        } else if (Array.isArray(tutorRes)) {
          tutorCoursesData = tutorRes;
        } else if (tutorRes?.data && Array.isArray(tutorRes.data)) {
          tutorCoursesData = tutorRes.data;
        }

        const tutorCourses = tutorCoursesData.map(course => ({
          ...course,
          isTutorCourse: true
        }));

        console.log("Regular courses:", regularCourses.length);
        console.log("Tutor courses:", tutorCourses.length);
        console.log("Regular res body:", body);
        console.log("Tutor courses response:", tutorRes);

        // Merge both arrays
        let allCourses = [...regularCourses, ...tutorCourses];

        // BUG 2.8.2: Extract enrollment status from API response (regular courses)
        const enrolledIds = new Set();
        allCourses.forEach((course) => {
          if (
            course.enrollment_status &&
            course.enrollment_status.is_enrolled
          ) {
            enrolledIds.add(String(course._id));
          }
        });

        // Tutor courses are not included in /courses/user-view — merge completed tutor payments
        const userId = typeof window !== "undefined"
          ? localStorage.getItem("userId")
          : null;
        if (userId) {
          try {
            const payRes = await api.get(
              "/api/v1/payments/user/payment/tutor-courses",
              { params: { limit: 200, page: 1, status: "completed" } },
            );
            const payments = payRes.data?.data?.payments || [];
            const tutorDateById = new Map();
            payments.forEach((p) => {
              if (p.paymentStatus !== "completed") return;
              const tid = p.tutorCourseId;
              const rawId =
                tid && typeof tid === "object" && tid._id != null
                  ? tid._id
                  : tid;
              if (rawId == null) return;
              const sid = String(rawId);
              enrolledIds.add(sid);
              if (p.createdAt) tutorDateById.set(sid, p.createdAt);
            });
            allCourses = allCourses.map((c) => {
              if (!c.isTutorCourse || !enrolledIds.has(String(c._id))) return c;
              if (c.enrollment_status?.is_enrolled) return c;
              return {
                ...c,
                enrollment_status: {
                  is_enrolled: true,
                  enrolled_date: tutorDateById.get(String(c._id)) || null,
                  progress_percentage: 0,
                },
              };
            });
          } catch (e) {
            console.warn("Could not load tutor course enrollments", e);
          }
        }

        setCourses(allCourses);
        setEnrolledCourses(enrolledIds);
      })
      .catch((err) => {
        console.error("Failed to fetch courses", err);
        // Don't break the UI - just show empty courses
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bookmarkedRef.current = new Set(
      [...bookmarkedCourses].map((x) => String(x)),
    );
  }, [bookmarkedCourses]);

  // Likes + wishlist: load storage, then merge server + fresh local (avoids stale sync wiping toggles).
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    // SECURITY FIX 3.32.1: Tokens in cookies - not in localStorage

    try {
      if (userId) {
        const liked = JSON.parse(
          localStorage.getItem(`likedCourses_${userId}`) || "[]",
        );
        setLikedCourses(
          new Set((Array.isArray(liked) ? liked : []).map((x) => String(x))),
        );
      } else {
        const liked = JSON.parse(localStorage.getItem("likedCourses") || "[]");
        setLikedCourses(
          new Set(
            (Array.isArray(liked) ? liked : []).map((x) => String(x)),
          ),
        );
      }
    } catch (err) {
      console.error("Failed to load liked courses from storage", err);
    }

    const initial = collectAllBookmarkIdsFromStorage();
    setBookmarkedCourses(new Set(initial));

    let cancelled = false;

    (async () => {
      try {
        setSyncingWishlist(true);
        const response = await getWishlist();
        if (cancelled) return;

        const serverIds =
          response?.success && Array.isArray(response.data)
            ? response.data.map(wishlistRowCourseId).filter(Boolean)
            : [];

        const freshLocal = collectAllBookmarkIdsFromStorage();
        let merged = [...new Set([...serverIds, ...freshLocal])];

        setBookmarkedCourses(new Set(merged));
        writeBookmarkIdsToPrimaryKey(merged);

        const serverSet = new Set(serverIds);
        const needsSync =
          merged.some((cid) => !serverSet.has(cid)) ||
          (serverIds.length === 0 && merged.length > 0);

        if (needsSync && merged.length > 0) {
          const syncRes = await syncWishlist(merged);
          if (cancelled) return;
          if (syncRes?.success && Array.isArray(syncRes.data)) {
            const fromSync = syncRes.data
              .map(wishlistRowCourseId)
              .filter(Boolean);
            merged = [
              ...new Set([
                ...fromSync,
                ...collectAllBookmarkIdsFromStorage(),
              ]),
            ];
            setBookmarkedCourses(new Set(merged));
            writeBookmarkIdsToPrimaryKey(merged);
          }
        }
      } catch (err) {
        console.error("Failed to load/sync wishlist", err);
      } finally {
        if (!cancelled) setSyncingWishlist(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLike = (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();
    const id = String(courseId);
    const userId = localStorage.getItem("userId");

    setLikedCourses((prev) => {
      const newSet = new Set([...prev].map((x) => String(x)));
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
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

  const handleBookmark = async (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();
    if (syncingWishlist) return;

    const id = String(courseId);
    // SECURITY FIX 3.32.1: Tokens in cookies - not in localStorage
    // API will handle auth via cookies automatically

    const prev = new Set(
      [...bookmarkedRef.current].map((x) => String(x)),
    );
    const wasBookmarked = prev.has(id);
    const next = new Set(prev);
    if (wasBookmarked) next.delete(id);
    else next.add(id);

    bookmarkedRef.current = next;
    setBookmarkedCourses(new Set(next));
    writeBookmarkIdsToPrimaryKey([...next]);

    try {
      if (wasBookmarked) await removeFromWishlist(id);
      else await addToWishlist(id);
      toast.success(
        wasBookmarked ? "Removed from wishlist" : "Saved to wishlist",
      );
    } catch (err) {
      const status = err?.response?.status;
      const apiMsg = String(err?.response?.data?.message || "").toLowerCase();

      if (
        !wasBookmarked &&
        status === 400 &&
        apiMsg.includes("already")
      ) {
        toast.success("Saved to wishlist");
        return;
      }
      if (
        wasBookmarked &&
        (status === 404 || apiMsg.includes("not found"))
      ) {
        toast.success("Removed from wishlist");
        return;
      }

      console.error("Wishlist API failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not update wishlist";
      toast.error(msg);
      bookmarkedRef.current = new Set(prev);
      setBookmarkedCourses(new Set(prev));
      writeBookmarkIdsToPrimaryKey([...prev]);
    }
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
    const aBookmarked = bookmarkedCourses.has(String(a._id));
    const bBookmarked = bookmarkedCourses.has(String(b._id));

    if (aBookmarked === bBookmarked) return 0;
    return aBookmarked ? -1 : 1;
  });

  return (
    <PopularCoursesSection>
      <Container>
        <CoursesGrid>
          {sortedCourses.map((course, index) => {
            const isEnrolled = enrolledCourses.has(String(course._id));
            const courseDetailPath = course.isTutorCourse
              ? `/tutor-course/${course._id}`
              : `/course/${course._id}`;

            const handleCardNavigate = () => {
              window.scrollTo(0, 0);
              navigate(courseDetailPath);
            };

            const handleEnrollClick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCardNavigate();
            };

            return (
              <CourseCardOuter
                key={course._id}
                className={isEnrolled ? "enrolled" : ""}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={handleCardNavigate}
              >
                <CourseCard className={isEnrolled ? "enrolled" : ""}>
                  <Thumbnail>
                    <img
                      src={course.thumbnail || "/default-course.jpg"}
                      alt={course.title || course.coursename || "Course"}
                    />
                    {/* These are the re-introduced hover components */}
                    <ThumbnailOverlay className="thumbnail-overlay">
                      <PlayButton className="play-button">
                        <FaPlay />
                      </PlayButton>
                    </ThumbnailOverlay>

                    {/* BUG 2.8.1: Show enrollment badge if enrolled */}
                    <EnrollmentBadge
                      isEnrolled={isEnrolled}
                      enrolledDate={
                        course.enrollment_status?.enrolled_date
                      }
                    />

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
                    <Title className="course-title">
                      {course.title || course.coursename}
                    </Title>
                    <Instructor>
                      <FaUser />
                      {typeof course.instructor === 'object'
                        ? course.instructor?.name
                        : course.instructor || "Expert Instructor"}
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
                      {Number(course.studentEnrollmentCount) || 0} students
                      enrolled
                    </EnrollmentCount>

                    {/* BUG 2.8.1: Add progress bar for enrolled courses */}
                    {isEnrolled &&
                      course.enrollment_status?.progress_percentage >
                        0 && (
                        <ProgressBar
                          progress={
                            course.enrollment_status
                              .progress_percentage
                          }
                        />
                      )}

                    <PriceContainer className={isEnrolled ? "enrolled" : ""}>
                      {!isEnrolled && (
                        <Price>
                          ₹
                          {course.price?.finalPrice ??
                            course.price?.amount ??
                            0}
                        </Price>
                      )}
                      <PriceRowActions>
                        {/* BUG 2.8.1: Change button based on enrollment status */}
                        <EnrollActionText
                          type="button"
                          className={isEnrolled ? "enrolled" : ""}
                          onClick={handleEnrollClick}
                          aria-label={
                            isEnrolled
                              ? "Go to course"
                              : "Enroll now"
                          }
                        >
                          {isEnrolled ? (
                            <>
                              <FaArrowRight aria-hidden /> Go to course
                            </>
                          ) : (
                            "Enroll now"
                          )}
                        </EnrollActionText>
                        
                        <PriceActionButton
                          type="button"
                          disabled={syncingWishlist}
                          className={
                            bookmarkedCourses.has(String(course._id))
                              ? "bookmarked"
                              : ""
                          }
                          onClick={(e) =>
                            handleBookmark(e, String(course._id))
                          }
                          aria-label={
                            bookmarkedCourses.has(String(course._id))
                              ? "Remove from wishlist"
                              : "Save to wishlist"
                          }
                          aria-pressed={bookmarkedCourses.has(
                            String(course._id),
                          )}
                        >
                          <FaBookmark />
                        </PriceActionButton>
                      </PriceRowActions>
                    </PriceContainer>
                  </CourseInfo>
                </CourseCard>
              </CourseCardOuter>
            );
          })}
        </CoursesGrid>
      </Container>
    </PopularCoursesSection>
  );
};

export default PopularCourses;
