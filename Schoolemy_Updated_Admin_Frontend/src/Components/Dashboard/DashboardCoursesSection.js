import React, { memo, useCallback } from "react";
import { Card, Row, Col, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import {
  DASHBOARD_STYLES,
  headerLogoBoxStyle,
  headerLogoImgStyle,
} from "./dashboardContentStyles";

const { Title, Text } = Typography;

const COURSE_BLOCKS = [
  {
    title: "Yoga Courses",
    types: [
      "Hatha Yoga Certification",
      "Ashtanga Yoga Mastery",
      "Yoga Therapy",
      "Prenatal Yoga",
      "Yoga for Stress Management",
    ],
    icon: "",
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
    icon: "",
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
    icon: "",
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
    icon: "",
    count: "14 courses",
  },
];

function DashboardCoursesSection() {
  const navigate = useNavigate();
  const styles = DASHBOARD_STYLES;

  const handleMouseOver = useCallback((e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow =
      "0 8px 25px rgba(59, 130, 246, 0.15)";
  }, []);

  const handleMouseOut = useCallback((e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.02)";
  }, []);

  return (
    <Card
      headStyle={styles.cardHeader}
      bodyStyle={styles.cardBody}
      style={{
        ...styles.card,
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Title level={3} style={styles.cardTitle}>
            Our Course Offerings
          </Title>
          <div style={headerLogoBoxStyle}>
            <img src={logo} alt="Schoolemy Logo" style={headerLogoImgStyle} />
          </div>
        </div>
      }
      onClick={() => navigate("/schoolemy/courses")}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      hoverable
    >
      <Row gutter={[16, 16]}>
        {COURSE_BLOCKS.map((course) => (
          <Col xs={24} sm={12} md={6} key={course.title}>
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
                      key={type}
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
  );
}

export default memo(DashboardCoursesSection);
