import React, { memo, useState, useCallback } from "react";
import { Card, Row, Col, Typography, Spin } from "antd";
import logo from "../../assets/logo.png";
import {
  DASHBOARD_STYLES,
  headerLogoBoxStyle,
  headerLogoImgStyle,
} from "./dashboardContentStyles";

const { Title, Text, Paragraph } = Typography;

const AVATAR_COLORS = [
  { bg: "#1e40af", text: "#ffffff" },
  { bg: "#3b82f6", text: "#ffffff" },
  { bg: "#10b981", text: "#ffffff" },
  { bg: "#f59e0b", text: "#ffffff" },
  { bg: "#8b5cf6", text: "#ffffff" },
  { bg: "#ec4899", text: "#ffffff" },
];

function DashboardInstructorsSection({
  instructors,
  loadingInstructors,
  checkIsSuperAdmin,
  onInstructorCardClick,
}) {
  const styles = DASHBOARD_STYLES;
  const [failedImages, setFailedImages] = useState(() => new Set());

  const handleImageError = useCallback((index) => {
    setFailedImages((prev) => new Set([...prev, index]));
  }, []);

  const handleMouseOver = useCallback((e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow =
      "0 8px 25px rgba(59, 130, 246, 0.15)";
  }, []);

  const handleMouseOut = useCallback((e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.02)";
  }, []);

  const handleEmptyCtaClick = useCallback(
    (e) => {
      e.stopPropagation();
      onInstructorCardClick?.(e);
    },
    [onInstructorCardClick]
  );

  const showEmptyInstructors =
    !loadingInstructors && (!instructors || instructors.length === 0);

  return (
    <Card
      headStyle={styles.cardHeader}
      bodyStyle={styles.cardBody}
      style={{
        ...styles.card,
        cursor: checkIsSuperAdmin() ? "pointer" : "default",
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
            Our Esteemed Instructors
          </Title>
          <div style={headerLogoBoxStyle}>
            <img src={logo} alt="Schoolemy Logo" style={headerLogoImgStyle} />
          </div>
        </div>
      }
      onClick={onInstructorCardClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      hoverable
    >
      {!showEmptyInstructors && (
        <Paragraph style={{ color: "#475569", marginBottom: "24px" }}>
          Schoolemy works with <Text strong>certified experts</Text> in each
          discipline to ensure authentic knowledge transmission.
        </Paragraph>
      )}

      {loadingInstructors ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ marginBottom: "16px" }}>
            <Spin size="large" />
          </div>
          <Text style={{ color: "#64748b", fontSize: "14px" }}>Loading instructors...</Text>
        </div>
      ) : showEmptyInstructors ? (
        <div
          style={{
            textAlign: "center",
            padding: "24px 16px 40px",
            maxWidth: 420,
            margin: "0 auto",
          }}
        >
          <Title
            level={4}
            style={{
              color: "#334155",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            No instructors available yet
          </Title>
          <Paragraph
            style={{
              color: "#64748b",
              fontSize: 14,
              marginBottom: 16,
              marginTop: 0,
            }}
          >
            Instructors will appear here once they are added to the system.
          </Paragraph>
          <Text
            role="button"
            tabIndex={0}
            onClick={handleEmptyCtaClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleEmptyCtaClick(e);
              }
            }}
            style={{
              color: "#2563eb",
              fontSize: 14,
              cursor: "pointer",
              display: "block",
            }}
          >
            Go to Data Maintenance → Instructor Management to add instructors
          </Text>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {instructors.map((instructor, index) => {
            const hasImage =
              instructor.image && instructor.image.trim() !== "";
            const imageFailed = failedImages.has(index);
            const showFallback = !hasImage || imageFailed;
            const firstLetter =
              instructor.name?.charAt(0)?.toUpperCase() || "?";
            const colorIndex = index % AVATAR_COLORS.length;
            const avatarColor = AVATAR_COLORS[colorIndex];

            return (
              <Col
                xs={24}
                sm={12}
                md={8}
                lg={8}
                key={instructor._id || instructor.id || index}
              >
                <div
                  className="dashboard-instructor-card"
                  style={styles.instructorCard}
                >
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
                      backgroundColor: showFallback
                        ? avatarColor.bg
                        : "transparent",
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
                        onError={() => handleImageError(index)}
                      />
                    )}
                  </div>
                  <Title
                    level={4}
                    style={{ color: "#1e40af", marginBottom: "8px" }}
                  >
                    {instructor.name}
                  </Title>
                  <Text
                    strong
                    style={{
                      color: "#1e293b",
                      display: "block",
                      fontSize: "13px",
                    }}
                  >
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
  );
}

export default memo(DashboardInstructorsSection);
