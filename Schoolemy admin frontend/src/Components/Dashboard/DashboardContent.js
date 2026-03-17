import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Avatar, message } from "antd";
import { useNavigate } from "react-router-dom";

import {
  UserOutlined,
  BookOutlined,
  DollarCircleOutlined,
  StarFilled,
  CheckCircleOutlined
} from "@ant-design/icons";
import logo from "../../assets/logo.png";
import api from "../../Utils/api";
import { secureStorage } from "../../Utils/security";
// eslint-disable-next-line no-unused-vars
import {
  getCachedData,
  setCachedData,
  CACHE_KEYS,
  setupAutoRefresh,
  clearAutoRefresh,
} from "../../Utils/dashboardCache";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import "./DashboardContent.css";

const { Title, Text, Paragraph } = Typography;

// Sample data for the charts
const emiData = [
  { month: "Jan", EMI: 40, Paid: 30 },
  { month: "Feb", EMI: 45, Paid: 35 },
  { month: "Mar", EMI: 50, Paid: 40 },
  { month: "Apr", EMI: 42, Paid: 38 },
  { month: "May", EMI: 48, Paid: 45 },
  { month: "Jun", EMI: 52, Paid: 49 },
];

const enrollmentsData = [
  { month: "Jan", enrollments: 120 },
  { month: "Feb", enrollments: 150 },
  { month: "Mar", enrollments: 160 },
  { month: "Apr", enrollments: 140 },
  { month: "May", enrollments: 175 },
  { month: "Jun", enrollments: 190 },
];

const DashboardContent = ({
  totalUsers,
  totalCourses,
  activeSubscriptions,
  completionRate,
}) => {
  const navigate = useNavigate();
  const [displayedTestimonials, setDisplayedTestimonials] = useState([]);
  const [totalTutors, setTotalTutors] = useState(0);
  const [failedImages, setFailedImages] = useState(new Set());
  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  // Check if user is superadmin
  const checkIsSuperAdmin = () => {
    try {
      // Check secureStorage first (preferred method)
      const roleFromSecure = secureStorage.getItem("role");
      if (roleFromSecure) {
        return roleFromSecure.toLowerCase() === "superadmin";
      }
      
      // Fallback to localStorage
      const roleFromLocal = localStorage.getItem("role");
      if (roleFromLocal) {
        return roleFromLocal.toLowerCase() === "superadmin";
      }
      
      // Try to get role from token if available
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.role) {
              return payload.role.toLowerCase() === "superadmin";
            }
          }
        } catch (err) {
          console.error('Error parsing token:', err);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  };

  // Handle instructor card click
  const handleInstructorCardClick = () => {
    if (checkIsSuperAdmin()) {
      navigate("/schoolemy/instructors-management");
    } else {
      message.warning("Only Super Admin can access Instructor Management");
    }
  };

  // Randomly select 4 testimonials on component mount


  // Fetch tutor count from API with cache
  useEffect(() => {
    // Load from cache first for instant display
    const cachedTutors = getCachedData(CACHE_KEYS.TUTORS);
    if (cachedTutors !== null) {
      setTotalTutors(cachedTutors);
    }

    const fetchTutorCount = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (!token) {
          // Try cache if no token
          if (cachedTutors !== null) {
            return;
          }
          return;
        }

        const headers = token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : {};

        const response = await api.get('/all-tutors', {
          headers,
          params: {
            page: 1,
            limit: 1, // We only need the count, so minimal data
          },
        });

        if (response.data?.success && response.data.data?.pagination) {
          const tutorCount = response.data.data.pagination.totalTutors || 0;
          setTotalTutors(tutorCount);
          // Update cache
          setCachedData(CACHE_KEYS.TUTORS, tutorCount);
        }
      } catch (err) {
        console.error('Error fetching tutor count:', err);
        // Fallback to cache if available
        const cachedTutors = getCachedData(CACHE_KEYS.TUTORS);
        if (cachedTutors !== null) {
          setTotalTutors(cachedTutors);
        }
        // Otherwise keep default value of 0
      }
    };

    fetchTutorCount();
    
    // Setup auto-refresh
    setupAutoRefresh(CACHE_KEYS.TUTORS, fetchTutorCount);

    // Cleanup on unmount
    return () => {
      clearAutoRefresh(CACHE_KEYS.TUTORS);
    };
  }, []);

  // Fetch instructors from API with cache
  useEffect(() => {
    // Load from cache first for instant display
    const cachedInstructors = getCachedData(CACHE_KEYS.INSTRUCTORS);
    if (cachedInstructors !== null && Array.isArray(cachedInstructors)) {
      setInstructors(cachedInstructors);
      setLoadingInstructors(false);
    }

    const fetchInstructors = async () => {
      try {
        setLoadingInstructors(true);
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (!token) {
          // Try cache if no token
          if (cachedInstructors !== null && Array.isArray(cachedInstructors)) {
            setInstructors(cachedInstructors);
            setLoadingInstructors(false);
          }
          return;
        }

        const headers = token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : {};

        const response = await api.get('/get-instructors-all', {
          headers,
        });

        let instructorsData = [];

        if (response.data?.success && response.data.instructors) {
          // Map imageUrl to image for component compatibility and sort by order
          instructorsData = response.data.instructors
            .map(instructor => ({
              ...instructor,
              image: instructor.imageUrl || instructor.image || '',
            }))
            .sort((a, b) => {
              // Sort by order field: items with order come first, then by order value
              const orderA = a.order !== undefined && a.order !== null ? a.order : Number.MAX_SAFE_INTEGER;
              const orderB = b.order !== undefined && b.order !== null ? b.order : Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            });
        } else if (response.data?.success && response.data.data) {
          // Handle alternative response structure
          instructorsData = (Array.isArray(response.data.data) 
            ? response.data.data
            : (response.data.data.instructors || []))
            .map(instructor => ({
              ...instructor,
              image: instructor.imageUrl || instructor.image || '',
            }))
            .sort((a, b) => {
              const orderA = a.order !== undefined && a.order !== null ? a.order : Number.MAX_SAFE_INTEGER;
              const orderB = b.order !== undefined && b.order !== null ? b.order : Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            });
        } else if (Array.isArray(response.data)) {
          // Handle case where API returns array directly
          instructorsData = response.data
            .map(instructor => ({
              ...instructor,
              image: instructor.imageUrl || instructor.image || '',
            }))
            .sort((a, b) => {
              const orderA = a.order !== undefined && a.order !== null ? a.order : Number.MAX_SAFE_INTEGER;
              const orderB = b.order !== undefined && b.order !== null ? b.order : Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            });
        }

        if (instructorsData.length > 0) {
          setInstructors(instructorsData);
          // Update cache
          setCachedData(CACHE_KEYS.INSTRUCTORS, instructorsData);
        }
      } catch (err) {
        console.error('Error fetching instructors:', err);
        // Fallback to cache if available
        const cachedInstructors = getCachedData(CACHE_KEYS.INSTRUCTORS);
        if (cachedInstructors !== null && Array.isArray(cachedInstructors)) {
          setInstructors(cachedInstructors);
        } else {
          setInstructors([]); // Set empty array only if no cache
        }
      } finally {
        setLoadingInstructors(false);
      }
    };

    fetchInstructors();
    
    // Setup auto-refresh
    setupAutoRefresh(CACHE_KEYS.INSTRUCTORS, fetchInstructors);

    // Cleanup on unmount
    return () => {
      clearAutoRefresh(CACHE_KEYS.INSTRUCTORS);
    };
  }, []);

  // Styles
  const styles = {
    container: {
      // Responsive styles moved to CSS file
    },
    contentWrapper: {
      // Responsive styles moved to CSS file
    },
    card: {
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.02)",
      background: "white",
    },
    cardHeader: {
      borderBottom: "1px solid #e2e8f0",
      background: "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)",
      borderRadius: "12px 12px 0 0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTitle: {
      color: "white",
      margin: 0,
      fontWeight: 600,
    },
    cardBody: {
      // Responsive padding moved to CSS file
    },
    statCard: {
      display: "flex",
      alignItems: "center",
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      height: "100%",
      transition: "all 0.3s ease",
      ":hover": {
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
        transform: "translateY(-2px)",
      },
    },
    clickableStatCard: {
      display: "flex",
      alignItems: "center",
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      height: "100%",
      transition: "all 0.3s ease",
      cursor: "pointer",
      ":hover": {
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
        transform: "translateY(-2px)",
        borderColor: "#3b82f6",
      },
    },
    avatar: {
      backgroundColor: "#eff6ff",
      color: "#1e40af",
      flexShrink: 0,
    },
    statText: {
      color: "#1e293b",
      fontWeight: 500,
    },
    statValue: {
      color: "#1e40af",
      fontWeight: 600,
      marginTop: "4px",
    },
    chartTitle: {
      color: "#1e293b",
      fontSize: "16px",
      fontWeight: 600,
      marginBottom: "16px",
    },
    instructorCard: {
      textAlign: "center",
      border: "1px solid #e2e8f0",
      background: "white",
      borderRadius: "8px",
      height: "100%",
      transition: "all 0.3s ease",
      ":hover": {
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
      },
    },
    courseCard: {
      border: "1px solid #e2e8f0",
      background: "white",
      borderRadius: "8px",
      height: "100%",
      transition: "all 0.3s ease",
      ":hover": {
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
      },
    },
    testimonialCard: {
      height: "100%",
      border: "1px solid #e2e8f0",
      background: "white",
      borderRadius: "8px",
      padding: "16px",
    },
    testimonialQuote: {
      padding: "16px",
      background: "#f8fafc",
      borderRadius: "8px",
      marginBottom: "16px",
      borderLeft: "4px solid #3b82f6",
    },
    sectionTitle: {
      color: "#1e40af",
      marginBottom: "24px",
      fontWeight: 600,
    },
    blueText: {
      color: "#1e40af",
    },
    lightBlueBg: {
      background: "#eff6ff",
    },
  };

  return (
    <div className="dashboard-container" style={styles.container}>
      <div className="dashboard-content-wrapper" style={styles.contentWrapper}>
        {/* About Section */}
        <Card
          headStyle={styles.cardHeader}
          bodyStyle={styles.cardBody}
          style={styles.card}
          className="dashboard-card"
          title={
            <div className="dashboard-header-title-container">
              <Title level={2} className="dashboard-card-title" style={styles.cardTitle}>
                Schoolemy Admin Dashboard
              </Title>
              <div className="dashboard-header-logo-container">
                <img
                  src={logo}
                  alt="Schoolemy Logo"
                  className="dashboard-logo-img"
                />
              </div>
            </div>
          }
        >
          <Paragraph style={{ fontSize: "16px", color: "#475569" }}>
            <Text strong style={styles.blueText}>
              Schoolemy
            </Text>{" "}
            is a comprehensive LMS designed to bring ancient wisdom to modern
            learners through cutting-edge technology.
          </Paragraph>

          {/* Stats Section */}
          <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
            {[
              {
                title: "Total Users",
                count: (totalUsers || 0).toLocaleString(),
                icon: <UserOutlined />,
                trend: "+12% this month",
                clickable: true,
                path: "/schoolemy/user-details",
              },
              {
                title: "Total Courses",
                count: (totalCourses || 0).toString(),
                icon: <BookOutlined />,
                trend: "+5 new courses",
                clickable: true,
                path: "/schoolemy/course-list",
              },
              {
                title: "Total Tutors",
                count: totalTutors > 0 ? totalTutors.toLocaleString() : (activeSubscriptions || 0).toLocaleString(),
                icon: <DollarCircleOutlined />,
                trend: "92% renewal rate",
                clickable: true,
                path: "/schoolemy/tutor-details",
              },
              {
                title: "Course Completion",
                count: "0%",
                icon: <CheckCircleOutlined />,
                trend: "0%",
                clickable: false,
              },
            ].map((stat, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <div
                  className={stat.clickable ? "dashboard-stat-card" : "dashboard-stat-card"}
                  style={
                    stat.clickable ? styles.clickableStatCard : styles.statCard
                  }
                  onClick={
                    stat.clickable ? () => navigate(stat.path) : undefined
                  }
                  title={
                    stat.clickable
                      ? `Click to view ${stat.title.toLowerCase()}`
                      : undefined
                  }
                >
                  <Avatar icon={stat.icon} size={48} className="dashboard-stat-avatar" style={styles.avatar} />
                  <div>
                    <Text className="dashboard-stat-text" style={styles.statText}>{stat.title}</Text>
                    <div className="dashboard-stat-value" style={styles.statValue}>{stat.count}</div>
                    <Text style={{ color: "#64748b", fontSize: "12px" }}>
                      {stat.trend}
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Charts Section */}
        <Card
          headStyle={styles.cardHeader}
          bodyStyle={styles.cardBody}
          style={styles.card}
          className="dashboard-card"
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <Title level={3} style={styles.cardTitle}>
                Performance Analytics
              </Title>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <img
                  src={logo}
                  alt="Schoolemy Logo"
                  style={{
                    height: "30px",
                    width: "auto",
                    maxWidth: "100px",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          }
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div style={styles.chartTitle}>Monthly EMI vs Paid</div>
              <div className="dashboard-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={emiData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="EMI"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="EMI Due"
                  />
                  <Bar
                    dataKey="Paid"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Amount Paid"
                  />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div style={styles.chartTitle}>Course Enrollments Trend</div>
              <div className="dashboard-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={enrollmentsData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#1e40af", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#1e40af" }}
                    name="Enrollments"
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Instructors Section */}
        <Card
          headStyle={styles.cardHeader}
          bodyStyle={styles.cardBody}
          style={{
            ...styles.card,
            cursor: checkIsSuperAdmin() ? "pointer" : "default",
            transition: "all 0.3s ease",
          }}
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <Title level={3} style={styles.cardTitle}>
                Our Esteemed Instructors
              </Title>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <img
                  src={logo}
                  alt="Schoolemy Logo"
                  style={{
                    height: "30px",
                    width: "auto",
                    maxWidth: "100px",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          }
          onClick={handleInstructorCardClick}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow =
              "0 8px 25px rgba(59, 130, 246, 0.15)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.02)";
          }}
          hoverable
        >
          <Paragraph style={{ color: "#475569", marginBottom: "24px" }}>
            Schoolemy works with <Text strong>certified experts</Text> in each
            discipline to ensure authentic knowledge transmission.
          </Paragraph>

          {loadingInstructors ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Text style={{ color: "#64748b" }}>Loading instructors...</Text>
            </div>
          ) : instructors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Text style={{ color: "#64748b" }}>No instructors available.</Text>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {instructors.map((instructor, index) => {
              const hasImage = instructor.image && instructor.image.trim() !== "";
              const imageFailed = failedImages.has(index);
              const showFallback = !hasImage || imageFailed;
              const firstLetter = instructor.name?.charAt(0)?.toUpperCase() || "?";
              
              // Generate a color based on the name for consistent avatar colors
              const colors = [
                { bg: "#1e40af", text: "#ffffff" },
                { bg: "#3b82f6", text: "#ffffff" },
                { bg: "#10b981", text: "#ffffff" },
                { bg: "#f59e0b", text: "#ffffff" },
                { bg: "#8b5cf6", text: "#ffffff" },
                { bg: "#ec4899", text: "#ffffff" },
              ];
              const colorIndex = index % colors.length;
              const avatarColor = colors[colorIndex];

              return (
              <Col xs={24} sm={12} md={8} lg={8} key={instructor._id || instructor.id || index}>
                <div className="dashboard-instructor-card" style={styles.instructorCard}>
                  <div
                    className="dashboard-instructor-image-container"
                    style={{
                      height: "200px",
                      margin: "0 auto 16px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "3px solid #eff6ff",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: showFallback ? avatarColor.bg : "transparent",
                    }}
                  >
                    {showFallback ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "72px",
                          fontWeight: "bold",
                          color: avatarColor.text,
                          backgroundColor: avatarColor.bg,
                        }}
                      >
                        {firstLetter}
                      </div>
                    ) : (
                      <img
                        src={instructor.image}
                        alt={instructor.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={() => {
                          setFailedImages((prev) => new Set([...prev, index]));
                        }}
                      />
                    )}
                  </div>
                  <Title
                    level={4}
                    style={{ color: "#1e40af", marginBottom: "8px" }}
                  >
                    {instructor.name}
                  </Title>
                  <Text strong style={{ color: "#1e293b", display: "block", fontSize: "13px" }}>
                    {instructor.designation}
                  </Text>
                  <Text
                    style={{
                      color: "#64748b",
                      display: "block",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  >
                    Tenure: {instructor.tenure}
                  </Text>
                  <Text
                    style={{
                      color: "#3b82f6",
                      display: "block",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  >
                    Remuneration: {instructor.remuneration}
                  </Text>
                  <Text
                    style={{
                      color: "#475569",
                      display: "block",
                      marginTop: "4px",
                      fontSize: "12px",
                    }}
                  >
                    Qualification: {instructor.qualification}
                  </Text>
                </div>
              </Col>
              );
            })}
            </Row>
          )}
        </Card>

        {/* Courses Section */}
        <Card
          headStyle={styles.cardHeader}
          bodyStyle={styles.cardBody}
          style={{
            ...styles.card,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <Title level={3} style={styles.cardTitle}>
                Our Course Offerings
              </Title>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <img
                  src={logo}
                  alt="Schoolemy Logo"
                  style={{
                    height: "30px",
                    width: "auto",
                    maxWidth: "100px",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          }
          onClick={() => navigate("/schoolemy/courses")}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow =
              "0 8px 25px rgba(59, 130, 246, 0.15)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.02)";
          }}
          hoverable
        >
          <Row gutter={[16, 16]}>
            {[
              {
                title: "Yoga Courses",
                types: [
                  "Hatha Yoga Certification",
                  "Ashtanga Yoga Mastery",
                  "Yoga Therapy",
                  "Prenatal Yoga",
                  "Yoga for Stress Management",
                ],
                icon: "🧘",
                count: "24 courses",
              },
              {
                title: "Siddha Courses",
                types: [
                  "Fundamentals of Siddha Medicine",
                  "Siddha Nutrition",
                  "Siddha Pharmacology",
                  "Siddha Diagnosis Techniques",
                  "Advanced Siddha Practices",
                ],
                icon: "🌿",
                count: "18 courses",
              },
              {
                title: "Ayurveda Courses",
                types: [
                  "Ayurvedic Lifestyle",
                  "Panchakarma Therapy",
                  "Ayurvedic Nutrition",
                  "Herbal Medicine",
                  "Ayurvedic Beauty Treatments",
                ],
                icon: "💆",
                count: "22 courses",
              },
              {
                title: "Special Programs",
                types: [
                  "Yoga & Ayurveda Integration",
                  "Meditation Retreats",
                  "Teacher Training",
                  "Corporate Wellness",
                  "Customized Learning Paths",
                ],
                icon: "✨",
                count: "14 courses",
              },
            ].map((course, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <div style={styles.courseCard}>
                  <div
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{course.icon}</span>
                    <div>
                      <Text
                        strong
                        style={{ color: "#1e40af", fontSize: "16px" }}
                      >
                        {course.title}
                      </Text>
                      <Text
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                          display: "block",
                        }}
                      >
                        {course.count}
                      </Text>
                    </div>
                  </div>
                  <div style={{ padding: "16px" }}>
                    <ul
                      style={{
                        paddingLeft: "20px",
                        color: "#475569",
                        margin: 0,
                      }}
                    >
                      {course.types.map((type, i) => (
                        <li
                          key={i}
                          style={{ marginBottom: "8px", fontSize: "14px" }}
                        >
                          {type}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Testimonials Section */}
        <Card
          headStyle={styles.cardHeader}
          bodyStyle={styles.cardBody}
          style={{
            ...styles.card,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <Title level={3} style={styles.cardTitle}>
                What Our Students Say - TestimonialsData
              </Title>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <img
                  src={logo}
                  alt="Schoolemy Logo"
                  style={{
                    height: "30px",
                    width: "auto",
                    maxWidth: "100px",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          }
          
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow =
              "0 8px 25px rgba(59, 130, 246, 0.15)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.02)";
          }}
          hoverable
        >
          <Row gutter={[16, 16]}>
            {displayedTestimonials.map((testimonial, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <div style={styles.testimonialCard}>
                  <div style={styles.testimonialQuote}>
                    <Text
                      style={{
                        fontSize: "14px",
                        fontStyle: "italic",
                        color: "#475569",
                      }}
                    >
                      "{testimonial.quote}"
                    </Text>
                  </div>
                  <Text strong style={{ color: "#1e293b" }}>
                    {testimonial.author}
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "4px",
                    }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <StarFilled
                        key={i}
                        style={{
                          color:
                            i < Math.floor(parseFloat(testimonial.rating))
                              ? "#f59e0b"
                              : "#cbd5e1",
                          fontSize: "14px",
                          marginRight: "2px",
                        }}
                      />
                    ))}
                    <Text
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                        marginLeft: "4px",
                      }}
                    >
                      {testimonial.rating}
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default DashboardContent;
