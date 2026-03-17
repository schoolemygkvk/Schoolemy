import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../Utils/api';
import { secureStorage } from '../../Utils/security';
import { useAuth } from '../Auth/AuthProvider';
// eslint-disable-next-line no-unused-vars
import {
  getCachedData,
  setCachedData,
  CACHE_KEYS,
  setupAutoRefresh,
  clearAutoRefresh,
} from '../../Utils/dashboardCache';
import './Tutordashboard.css';

const TutorDashboard = () => {
  const { user } = useAuth();
  const [tutorData, setTutorData] = useState({
    name: '',
    title: '',
    rating: null,
    students: 0,
    experience: '',
    avatar: '',
    profilePictureUpload: null,
    totalCoursesUploaded: 0,
  });
  const hasFetchedRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  const [metrics, setMetrics] = useState({
    totalCourses: 0,
    pendingReview: 0,
    approvedCourses: 0,
    totalRevenue: 0
  });

  // CSS Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px 24px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      '@media (max-width: 768px)': {
        padding: '24px 16px'
      }
    },
    
    // Header
    header: {
      marginBottom: '40px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      '@media (max-width: 768px)': {
        flexDirection: 'column',
        alignItems: 'flex-start'
      }
    },
    
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flex: 1
    },
    
    headerAvatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#3b82f6',
      fontSize: '28px',
      fontWeight: '600',
      color: 'white',
      border: '3px solid white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      flexShrink: 0
    },
    
    headerContent: {
      flex: 1
    },
    
    greeting: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0f172a',
      lineHeight: '1.2',
      marginBottom: '8px',
      '@media (max-width: 768px)': {
        fontSize: '28px'
      }
    },
    
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      fontWeight: '400',
      lineHeight: '1.5'
    },
    
    // Grid Layout
    grid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '24px',
      '@media (max-width: 1024px)': {
        gridTemplateColumns: '1fr'
      }
    },
    
    leftColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    
    rightColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    
    // Cards
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      transition: 'box-shadow 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }
    },
    
    fullWidthCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      width: '100%',
      marginTop: '24px'
    },
    
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    
    cardTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#0f172a',
      lineHeight: '1.4'
    },
    
    // Metrics Grid
    metricsGrid: {
      // NOTE: responsive grid is handled in `Tutordashboard.css` because
      // React inline styles do not support @media queries.
    },
    
    metricCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e2e8f0',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    },
    
    metricHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px'
    },
    
    metricIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      flexShrink: 0
    },
    
    metricValueContainer: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      marginBottom: '8px'
    },
    
    metricValue: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#0f172a',
      lineHeight: '1'
    },
    
    metricUnit: {
      fontSize: '14px',
      color: '#64748b',
      fontWeight: '500'
    },
    
    metricTitle: {
      fontSize: '14px',
      color: '#64748b',
      fontWeight: '400',
      marginBottom: '16px'
    },
    
    metricTrend: {
      fontSize: '13px',
      fontWeight: '500',
      padding: '6px 12px',
      borderRadius: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    },
    
    
    // Profile Card
    profileCard: {
      textAlign: 'center',
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0'
    },
    
    avatar: {
      width: '96px',
      height: '96px',
      borderRadius: '50%',
      margin: '0 auto 20px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#3b82f6',
      fontSize: '32px',
      fontWeight: '600',
      color: 'white',
      border: '4px solid white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    
    profileName: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '8px'
    },
    
    profileTitle: {
      fontSize: '16px',
      color: '#64748b',
      fontWeight: '400',
      marginBottom: '24px'
    },
    
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    
    statItem: {
      textAlign: 'center',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    
    statValue: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#3b82f6',
      marginBottom: '4px'
    },
    
    statLabel: {
      fontSize: '12px',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: '500'
    },
    
    // Info Card
    infoCard: {
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      marginBottom: '16px'
    },
    
    infoTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    
    infoList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    
    infoItem: {
      fontSize: '14px',
      color: '#475569',
      lineHeight: '1.6',
      marginBottom: '8px',
      paddingLeft: '20px',
      position: 'relative'
    },
    
    infoItemBullet: {
      position: 'absolute',
      left: '0',
      color: '#3b82f6',
      fontWeight: 'bold'
    },
    
    highlightText: {
      fontWeight: '600',
      color: '#0f172a'
    },
    
    // Modal Styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '16px',
      maxWidth: '900px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      position: 'relative'
    },
    
    modalHeader: {
      padding: '24px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      backgroundColor: 'white',
      zIndex: 10
    },
    
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#0f172a'
    },
    
    modalCloseButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#64748b',
      padding: '4px 8px',
      borderRadius: '8px',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      '&:hover': {
        backgroundColor: '#f1f5f9',
        color: '#0f172a'
      }
    },
    
    modalBody: {
      padding: '24px'
    },
    
    clickableCard: {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 12px -2px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.06)'
      }
    },
    
    // View All Button
    viewAllButton: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      padding: '8px 16px',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      '&:hover': {
        backgroundColor: '#eff6ff'
      }
    },
    
    // Buttons
    button: {
      primary: {
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '10px',
        border: 'none',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        '&:hover': {
          backgroundColor: '#2563eb',
          transform: 'translateY(-1px)'
        }
      },
      secondary: {
        backgroundColor: 'white',
        color: '#3b82f6',
        padding: '12px 24px',
        borderRadius: '10px',
        border: '1px solid #3b82f6',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        '&:hover': {
          backgroundColor: '#eff6ff'
        }
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#64748b',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontWeight: '500',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        '&:hover': {
          backgroundColor: '#f8fafc',
          borderColor: '#94a3b8'
        }
      }
    }
  };

  // Color constants
  const colors = {
    primary: {
      light: '#eff6ff',
      DEFAULT: '#3b82f6',
      dark: '#1d4ed8',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    },
    success: {
      light: '#f0fdf4',
      DEFAULT: '#22c55e',
      dark: '#15803d',
      gradient: 'linear-gradient(135deg, #22c55e, #16a34a)'
    },
    warning: {
      light: '#fffbeb',
      DEFAULT: '#f59e0b',
      dark: '#b45309',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    error: {
      light: '#fef2f2',
      DEFAULT: '#ef4444',
      dark: '#b91c1c',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
    },
    purple: {
      light: '#f5f3ff',
      DEFAULT: '#8b5cf6',
      dark: '#6d28d9',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    }
  };

  // Avatar helpers
  const getInitials = (name) => {
    if (!name) return 'TU';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const resolveAvatarSrc = (img) => {
    if (!img) return null;
    const trimmed = String(img).trim();
    if (trimmed.startsWith('data:')) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.length < 50) return null;
    return `data:image/jpeg;base64,${trimmed}`;
  };

  const safeDecode = (value) => {
    if (!value || typeof value !== 'string') return value;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  // Fetch earnings from revenue API with cache
  const fetchEarnings = useCallback(async () => {
    const token = secureStorage.getItem('token');
    if (!token) {
      // Try cache if no token
      const cachedEarnings = getCachedData(CACHE_KEYS.TUTOR_EARNINGS);
      if (cachedEarnings !== null) {
        setMetrics((prev) => ({
          ...prev,
          totalRevenue: cachedEarnings,
        }));
      }
      return;
    }

    try {
      const response = await axios.get('/tutor/calculate-admin-payments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const totalCommission = response.data.data?.totals?.totalCommission || 0;
        // Store in cache
        setCachedData(CACHE_KEYS.TUTOR_EARNINGS, totalCommission);
        // Also keep localStorage for backward compatibility
        localStorage.setItem('tutorEarnings', totalCommission.toString());
        // Update metrics
        setMetrics((prev) => ({
          ...prev,
          totalRevenue: totalCommission,
        }));
      }
    } catch (err) {
      console.error('Fetch earnings error:', err);
      // Try to get from cache as fallback
      const cachedEarnings = getCachedData(CACHE_KEYS.TUTOR_EARNINGS);
      if (cachedEarnings !== null) {
        setMetrics((prev) => ({
          ...prev,
          totalRevenue: cachedEarnings,
        }));
      } else {
        // Fallback to localStorage for backward compatibility
        const storedEarnings = localStorage.getItem('tutorEarnings');
        if (storedEarnings) {
          setMetrics((prev) => ({
            ...prev,
            totalRevenue: parseFloat(storedEarnings) || 0,
          }));
        }
      }
    }
  }, []);

  // Fetch courses to calculate metrics with cache
  const fetchCourses = useCallback(async () => {
    const token = secureStorage.getItem('token');
    if (!token) {
      // Try cache if no token
      const cachedCourses = getCachedData(CACHE_KEYS.TUTOR_COURSES);
      if (cachedCourses !== null) {
        setMetrics((prev) => ({
          ...prev,
          totalCourses: cachedCourses.totalCourses || 0,
          approvedCourses: cachedCourses.approvedCourses || 0,
          pendingReview: cachedCourses.pendingReview || 0,
        }));
        setTutorData((prev) => ({
          ...prev,
          totalCoursesUploaded: cachedCourses.totalCourses || 0,
        }));
      }
      return;
    }

    try {
      const response = await axios.get('/courses-tutors');
      
      // Handle different response shapes
      const payload = response.data && response.data.data ? response.data.data : response.data;
      const courses = Array.isArray(payload) ? payload : [];

      // Calculate metrics from courses
      const totalCourses = courses.length;
      const approvedCourses = courses.filter(course => 
        course.status === 'approved'
      ).length;
      const pendingReview = courses.filter(course => 
        course.status === 'pending_review' || 
        course.status === 'pending' || 
        course.status === 'draft' ||
        !course.status
      ).length;

      const coursesMetrics = {
        totalCourses,
        approvedCourses,
        pendingReview,
      };

      // Update cache
      setCachedData(CACHE_KEYS.TUTOR_COURSES, coursesMetrics);

      setMetrics((prev) => ({
        ...prev,
        ...coursesMetrics,
      }));

      // Update totalCoursesUploaded in tutorData
      setTutorData((prev) => ({
        ...prev,
        totalCoursesUploaded: totalCourses,
      }));
    } catch (err) {
      console.error('Fetch courses error:', err);
      // Try cache as fallback
      const cachedCourses = getCachedData(CACHE_KEYS.TUTOR_COURSES);
      if (cachedCourses !== null) {
        setMetrics((prev) => ({
          ...prev,
          totalCourses: cachedCourses.totalCourses || 0,
          approvedCourses: cachedCourses.approvedCourses || 0,
          pendingReview: cachedCourses.pendingReview || 0,
        }));
        setTutorData((prev) => ({
          ...prev,
          totalCoursesUploaded: cachedCourses.totalCourses || 0,
        }));
      } else {
        // Set metrics to 0 only if no cache
        setMetrics((prev) => ({
          ...prev,
          totalCourses: 0,
          approvedCourses: 0,
          pendingReview: 0,
        }));
      }
    }
  }, []);

  // Initialize from cache on mount
  useEffect(() => {
    // Load earnings from cache
    const cachedEarnings = getCachedData(CACHE_KEYS.TUTOR_EARNINGS);
    if (cachedEarnings !== null) {
      setMetrics((prev) => ({
        ...prev,
        totalRevenue: cachedEarnings,
      }));
    } else {
      // Fallback to localStorage for backward compatibility
      const storedEarnings = localStorage.getItem('tutorEarnings');
      if (storedEarnings) {
        setMetrics((prev) => ({
          ...prev,
          totalRevenue: parseFloat(storedEarnings) || 0,
        }));
      }
    }

    // Load courses from cache
    const cachedCourses = getCachedData(CACHE_KEYS.TUTOR_COURSES);
    if (cachedCourses !== null) {
      setMetrics((prev) => ({
        ...prev,
        totalCourses: cachedCourses.totalCourses || 0,
        approvedCourses: cachedCourses.approvedCourses || 0,
        pendingReview: cachedCourses.pendingReview || 0,
      }));
      setTutorData((prev) => ({
        ...prev,
        totalCoursesUploaded: cachedCourses.totalCourses || 0,
      }));
    }

    // Load profile from cache
    const cachedProfile = getCachedData(CACHE_KEYS.TUTOR_PROFILE);
    if (cachedProfile !== null) {
      setTutorData((prev) => ({
        ...prev,
        ...cachedProfile,
      }));
    }
  }, []);

  // Fetch profile and course metrics
  useEffect(() => {
    const rawStoredName = secureStorage.getItem('name');
    const storedName = safeDecode(rawStoredName);
    if (storedName) {
      setTutorData((prev) => ({
        ...prev,
        name: storedName,
      }));
    }

    const fetchProfile = async () => {
      try {
        const token = secureStorage.getItem('token');
        if (!token) {
          // Try cache if no token
          const cachedProfile = getCachedData(CACHE_KEYS.TUTOR_PROFILE);
          if (cachedProfile !== null) {
            setTutorData((prev) => ({
              ...prev,
              ...cachedProfile,
            }));
          }
          return;
        }

        const res = await axios.get('/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const payload = res && res.data ? res.data : {};
        const p = payload.profile ?? payload.data ?? payload.user ?? payload;

        if (p) {
          const profileData = {
            name: safeDecode(p.name) ?? storedName ?? tutorData.name,
            title: p.subject ?? p.qualification ?? tutorData.title,
            experience: p.experience ?? tutorData.experience,
            rating: p.rating ?? tutorData.rating,
            students: p.students ?? tutorData.students,
            profilePictureUpload: p.profilePictureUpload ?? tutorData.profilePictureUpload,
          };

          // Update cache
          setCachedData(CACHE_KEYS.TUTOR_PROFILE, profileData);

          setTutorData((prev) => ({
            ...prev,
            ...profileData,
          }));
        }
        hasFetchedRef.current = true;
      } catch (err) {
        console.error('Profile fetch error:', err);
        // Try cache as fallback
        const cachedProfile = getCachedData(CACHE_KEYS.TUTOR_PROFILE);
        if (cachedProfile !== null) {
          setTutorData((prev) => ({
            ...prev,
            ...cachedProfile,
          }));
        }
      }
    };

    // Fetch profile, courses, and earnings
    fetchProfile();
    fetchCourses();
    fetchEarnings();

    // Setup auto-refresh
    setupAutoRefresh(CACHE_KEYS.TUTOR_EARNINGS, fetchEarnings);
    setupAutoRefresh(CACHE_KEYS.TUTOR_COURSES, fetchCourses);
    setupAutoRefresh(CACHE_KEYS.TUTOR_PROFILE, fetchProfile);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchProfile();
        fetchCourses();
        fetchEarnings();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearAutoRefresh(CACHE_KEYS.TUTOR_EARNINGS);
      clearAutoRefresh(CACHE_KEYS.TUTOR_COURSES);
      clearAutoRefresh(CACHE_KEYS.TUTOR_PROFILE);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCourses, fetchEarnings]);

  // Greeting
  const getGreetingText = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return 'Good Morning';
    if (hr >= 12 && hr < 17) return 'Good Afternoon';
    if (hr >= 17 && hr < 21) return 'Good Evening';
    return 'Good Night';
  };

  const [greeting, setGreeting] = useState(getGreetingText());

  useEffect(() => {
    const id = setInterval(() => {
      setGreeting(getGreetingText());
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // MetricCard Component
  const MetricCard = ({ title, value, trend, icon, color, compact = false }) => {
    const colorMap = {
      primary: colors.primary,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      purple: colors.purple
    };

    const colorSet = colorMap[color] || colors.primary;
    const hasTrend = trend && trend.trim() !== '';
    const isPositive = hasTrend && trend.startsWith('+');

    return (
      <div className="td-metricCard" style={styles.metricCard}>
        <div
          className={`td-metricHeader ${hasTrend ? '' : 'td-metricHeader--center'}`}
          style={styles.metricHeader}
        >
          <div style={{ 
            ...styles.metricIcon, 
            background: colorSet.gradient,
            color: 'white'
          }}>
            {icon}
          </div>
          {hasTrend && (
            <div style={{ 
              ...styles.metricTrend, 
              backgroundColor: isPositive ? '#f0fdf4' : '#fef2f2',
              color: isPositive ? colors.success.DEFAULT : colors.error.DEFAULT
            }}>
              {isPositive ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        <div>
          <div className="td-metricValueContainer" style={styles.metricValueContainer}>
            <div
              className="td-metricValue"
              style={{
                ...styles.metricValue,
                fontSize: compact ? '26px' : styles.metricValue.fontSize,
              }}
            >
              {value}
            </div>
          </div>
          <div className="td-metricTitle" style={styles.metricTitle}>{title}</div>
        </div>
      </div>
    );
  };


  // InfoCard Component
  const InfoCard = ({ title, icon, children }) => (
    <div style={styles.infoCard}>
      <div style={styles.infoTitle}>
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );

  // Handle card click to open modal
  const handleCardClick = (title, content) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
    setModalTitle('');
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };
    if (modalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [modalOpen]);

  // Modal Component
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div 
        style={styles.modalOverlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>{title}</h2>
            <button 
              style={styles.modalCloseButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          <div style={styles.modalBody}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerAvatar}>
            {(() => {
              const displayName = user?.name || tutorData.name;
              const src = resolveAvatarSrc(tutorData.profilePictureUpload || tutorData.avatar);
              if (src) {
                return (
                  <img
                    src={src}
                    alt="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                );
              }
              return getInitials(displayName);
            })()}
          </div>
          <div style={styles.headerContent}>
            <h1 style={styles.greeting}>
              {greeting}{user?.name ? `, ${user.name}` : ''} 👋
            </h1>
            <p style={styles.subtitle}>
              Here's your teaching overview ...
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.grid}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Metrics Grid */}
          <div className="td-metricsGrid">
            <MetricCard
              title="Total Courses"
              value={metrics.totalCourses}
              trend=""
              icon="📚"
              color="primary"
            />
            <MetricCard
              title="Approved Courses"
              value={metrics.approvedCourses}
              trend=""
              icon="✅"
              color="success"
            />
            <MetricCard
              title="Pending Review"
              value={metrics.pendingReview}
              trend=""
              icon="⏳"
              color="warning"
            />
            <MetricCard
              title="Your Earnings"
              value={`₹${metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              trend=""
              icon="💰"
              color="purple"
              compact
            />
          </div>

          {/* Course Review Process Info */}
          <div 
            style={{ ...styles.card, ...styles.clickableCard }}
            onClick={() => handleCardClick('Course Review Process', (
              <InfoCard title="Important Information" icon="ℹ️">
                <ul style={styles.infoList}>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    All courses are subject to <span style={styles.highlightText}>review and approval by Schoolemy Admin</span> before publishing.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    Courses will only be visible to students after <span style={styles.highlightText}>final approval</span> from the admin.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    Ensure your course includes: <span style={styles.highlightText}>2-minute demo video</span>, detailed description, profile picture, qualifications, and complete course content.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    You are responsible for the <span style={styles.highlightText}>accuracy, authenticity, and originality</span> of your course content.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    Content must comply with <span style={{ ...styles.highlightText, color: '#dc2626' }}>strict content guidelines</span> - no violence, adult content, or harmful material.
                  </li>
                </ul>
              </InfoCard>
            ))}
          >
            <h2 style={styles.cardTitle}>Course Review Process</h2>
            <InfoCard title="Important Information" icon="ℹ️">
              <ul style={styles.infoList}>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  All courses are subject to <span style={styles.highlightText}>review and approval by Schoolemy Admin</span> before publishing.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  Courses will only be visible to students after <span style={styles.highlightText}>final approval</span> from the admin.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  Ensure your course includes: <span style={styles.highlightText}>2-minute demo video</span>, detailed description, profile picture, qualifications, and complete course content.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  You are responsible for the <span style={styles.highlightText}>accuracy, authenticity, and originality</span> of your course content.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  Content must comply with <span style={{ ...styles.highlightText, color: '#dc2626' }}>strict content guidelines</span> - no violence, adult content, or harmful material.
                </li>
              </ul>
            </InfoCard>
          </div>

          {/* Payment Information */}
          <div 
            style={{ ...styles.card, ...styles.clickableCard }}
            onClick={() => handleCardClick('Payment & Revenue', (
              <InfoCard title="Payment Terms" icon="💳">
                <ul style={styles.infoList}>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    You receive <span style={styles.highlightText}>30% of the net course fee</span> (including taxes) for every successful student purchase.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    Schoolemy retains <span style={styles.highlightText}>70%</span> for platform maintenance, marketing, and administrative costs.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    Payments are released <span style={styles.highlightText}>once every 15 days</span> via bank transfer.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    All payments are managed and maintained by <span style={styles.highlightText}>Schoolemy Admin</span>.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    Revenue share percentage remains <span style={styles.highlightText}>30% Tutor / 70% Company</span> even during discounts and promotions.
                  </li>
                </ul>
              </InfoCard>
            ))}
          >
            <h2 style={styles.cardTitle}>Payment & Revenue</h2>
            <InfoCard title="Payment Terms" icon="💳">
              <ul style={styles.infoList}>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  You receive <span style={styles.highlightText}>30% of the net course fee</span> (including taxes) for every successful student purchase.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  Schoolemy retains <span style={styles.highlightText}>70%</span> for platform maintenance, marketing, and administrative costs.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  Payments are released <span style={styles.highlightText}>once every 15 days</span> via bank transfer.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  All payments are managed and maintained by <span style={styles.highlightText}>Schoolemy Admin</span>.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  Revenue share percentage remains <span style={styles.highlightText}>30% Tutor / 70% Company</span> even during discounts and promotions.
                </li>
              </ul>
            </InfoCard>
          </div>

        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {/* Profile Details Card */}
          <div style={styles.profileCard}>
            <h2 style={styles.profileName}>{tutorData.name || 'Tutor Name'}</h2>
            <p style={styles.profileTitle}>{tutorData.title || 'Subject Specialist'}</p>
            
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{tutorData.rating || 0}</div>
                <div style={styles.statLabel}>Rating</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{tutorData.students || 0}</div>
                <div style={styles.statLabel}>Students</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{tutorData.totalCoursesUploaded || 0}</div>
                <div style={styles.statLabel}>Courses</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{tutorData.experience || 'N/A'}</div>
                <div style={styles.statLabel}>Experience</div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Reminder */}
          <div 
            style={{ ...styles.card, ...styles.clickableCard }}
            onClick={() => handleCardClick('Terms & Conditions Reminder', (
              <InfoCard title="Key Points" icon="📋">
                <ul style={styles.infoList}>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    You retain <span style={styles.highlightText}>full ownership</span> of your course content.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    Schoolemy has a <span style={styles.highlightText}>non-exclusive license</span> to host, market, and distribute your courses.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    Maintain <span style={styles.highlightText}>professional behavior</span> and academic integrity.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    All activities are <span style={styles.highlightText}>monitored by Schoolemy Admin</span>.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    <span style={{ ...styles.highlightText, color: '#dc2626' }}>STRICT CONTENT POLICY:</span> No violence, adult content, hate speech, or harmful material allowed.
                  </li>
                  <li style={styles.infoItem}>
                    <span style={styles.infoItemBullet}>•</span>
                    Courses may be <span style={styles.highlightText}>immediately removed</span> if they violate platform standards or receive poor ratings.
                  </li>
                </ul>
              </InfoCard>
            ))}
          >
            <h3 style={styles.cardTitle}>Terms & Conditions Reminder</h3>
            <InfoCard title="Key Points" icon="📋">
              <ul style={styles.infoList}>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  You retain <span style={styles.highlightText}>full ownership</span> of your course content.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  Schoolemy has a <span style={styles.highlightText}>non-exclusive license</span> to host, market, and distribute your courses.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  Maintain <span style={styles.highlightText}>professional behavior</span> and academic integrity.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  All activities are <span style={styles.highlightText}>monitored by Schoolemy Admin</span>.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  <span style={{ ...styles.highlightText, color: '#dc2626' }}>STRICT CONTENT POLICY:</span> No violence, adult content, hate speech, or harmful material allowed.
                </li>
                <li style={styles.infoItem}>
                  <span style={styles.infoItemBullet}>•</span>
                  Courses may be <span style={styles.highlightText}>immediately removed</span> if they violate platform standards or receive poor ratings.
                </li>
              </ul>
            </InfoCard>
          </div>
        </div>
      </div>

      {/* Strict Content Guidelines - Full Width */}
      <div 
        style={{ ...styles.fullWidthCard, ...styles.clickableCard }}
        onClick={() => handleCardClick('⚠️ Strict Content Guidelines', (
          <InfoCard title="Prohibited Content - Zero Tolerance Policy" icon="🚫">
            <ul style={styles.infoList}>
              <li style={styles.infoItem}>
                <span style={styles.infoItemBullet}>•</span>
                <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO VIOLENCE:</span> Any content depicting, promoting, or glorifying violence is strictly prohibited.
              </li>
              <li style={styles.infoItem}>
                <span style={styles.infoItemBullet}>•</span>
                <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO ADULT CONTENT:</span> Explicit, sexual, or adult-oriented content is absolutely forbidden.
              </li>
              <li style={styles.infoItem}>
                <span style={styles.infoItemBullet}>•</span>
                <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO HATE SPEECH:</span> Content that discriminates, harasses, or promotes hatred against any individual or group is prohibited.
              </li>
              <li style={styles.infoItem}>
                <span style={styles.infoItemBullet}>•</span>
                <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO ILLEGAL CONTENT:</span> Content that violates laws, promotes illegal activities, or infringes on intellectual property rights is not allowed.
              </li>
              <li style={styles.infoItem}>
                <span style={styles.infoItemBullet}>•</span>
                <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO MISLEADING INFORMATION:</span> False, deceptive, or misleading content that could harm students is strictly prohibited.
              </li>
              <li style={styles.infoItem}>
                <span style={styles.infoItemBullet}>•</span>
                <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO HARMFUL CONTENT:</span> Content that could cause physical, emotional, or psychological harm to students is forbidden.
              </li>
              <li style={styles.infoItem}>
                <span style={styles.infoItemBullet}>•</span>
                Violation of these guidelines will result in <span style={{ ...styles.highlightText, color: '#dc2626' }}>immediate course removal</span> and possible account termination.
              </li>
              <li style={styles.infoItem}>
                <span style={styles.infoItemBullet}>•</span>
                All content is <span style={styles.highlightText}>monitored and reviewed</span> by Schoolemy Admin before approval.
              </li>
            </ul>
          </InfoCard>
        ))}
      >
        <h2 style={styles.cardTitle}>⚠️ Strict Content Guidelines</h2>
        <InfoCard title="Prohibited Content - Zero Tolerance Policy" icon="🚫">
          <ul style={styles.infoList}>
            <li style={styles.infoItem}>
              <span style={styles.infoItemBullet}>•</span>
              <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO VIOLENCE:</span> Any content depicting, promoting, or glorifying violence is strictly prohibited.
            </li>
            <li style={styles.infoItem}>
              <span style={styles.infoItemBullet}>•</span>
              <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO ADULT CONTENT:</span> Explicit, sexual, or adult-oriented content is absolutely forbidden.
            </li>
            <li style={styles.infoItem}>
              <span style={styles.infoItemBullet}>•</span>
              <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO HATE SPEECH:</span> Content that discriminates, harasses, or promotes hatred against any individual or group is prohibited.
            </li>
            <li style={styles.infoItem}>
              <span style={styles.infoItemBullet}>•</span>
              <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO ILLEGAL CONTENT:</span> Content that violates laws, promotes illegal activities, or infringes on intellectual property rights is not allowed.
            </li>
            <li style={styles.infoItem}>
              <span style={styles.infoItemBullet}>•</span>
              <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO MISLEADING INFORMATION:</span> False, deceptive, or misleading content that could harm students is strictly prohibited.
            </li>
            <li style={styles.infoItem}>
              <span style={styles.infoItemBullet}>•</span>
              <span style={{ ...styles.highlightText, color: '#dc2626' }}>NO HARMFUL CONTENT:</span> Content that could cause physical, emotional, or psychological harm to students is forbidden.
            </li>
            <li style={styles.infoItem}>
              <span style={styles.infoItemBullet}>•</span>
              Violation of these guidelines will result in <span style={{ ...styles.highlightText, color: '#dc2626' }}>immediate course removal</span> and possible account termination.
            </li>
            <li style={styles.infoItem}>
              <span style={styles.infoItemBullet}>•</span>
              All content is <span style={styles.highlightText}>monitored and reviewed</span> by Schoolemy Admin before approval.
            </li>
          </ul>
        </InfoCard>
      </div>

      {/* Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={closeModal} 
        title={modalTitle}
      >
        {modalContent}
      </Modal>
    </div>
  );
};

export default TutorDashboard;