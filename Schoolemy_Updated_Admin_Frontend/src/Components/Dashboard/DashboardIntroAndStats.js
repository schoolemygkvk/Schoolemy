import React, { memo, useMemo } from "react";
import { Card, Row, Col, Typography, Avatar } from "antd";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  BookOutlined,
  DollarCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import logo from "../../assets/logo.png";
import { DASHBOARD_STYLES } from "./dashboardContentStyles";

const { Title, Text, Paragraph } = Typography;

function DashboardIntroAndStats({
  totalUsers,
  totalCourses,
  activeSubscriptions,
  totalTutors,
  completionRateState,
}) {
  const navigate = useNavigate();
  const styles = DASHBOARD_STYLES;

  const statItems = useMemo(
    () => [
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
        count:
          totalTutors > 0
            ? totalTutors.toLocaleString()
            : (activeSubscriptions || 0).toLocaleString(),
        icon: <DollarCircleOutlined />,
        trend: "92% renewal rate",
        clickable: true,
        path: "/schoolemy/tutor-details",
      },
      {
        title: "Course Completion",
        count: `${completionRateState}%`,
        icon: <CheckCircleOutlined />,
        trend: `${completionRateState > 0 ? "+" : ""}${completionRateState}%`,
        clickable: false,
      },
    ],
    [
      totalUsers,
      totalCourses,
      totalTutors,
      activeSubscriptions,
      completionRateState,
    ]
  );

  return (
    <Card
      headStyle={styles.cardHeader}
      bodyStyle={styles.cardBody}
      style={styles.card}
      className="dashboard-card"
      title={
        <div className="dashboard-header-title-container">
          <Title
            level={2}
            className="dashboard-card-title"
            style={styles.cardTitle}
          >
            Schoolemy Admin Dashboard
          </Title>
          <div className="dashboard-header-logo-container">
            <img src={logo} alt="Schoolemy Logo" className="dashboard-logo-img" />
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

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        {statItems.map((stat) => (
          <Col xs={24} sm={12} md={6} key={stat.title}>
            <div
              className="dashboard-stat-card"
              style={stat.clickable ? styles.clickableStatCard : styles.statCard}
              onClick={
                stat.clickable ? () => navigate(stat.path) : undefined
              }
              title={
                stat.clickable
                  ? `Click to view ${stat.title.toLowerCase()}`
                  : undefined
              }
            >
              <Avatar
                icon={stat.icon}
                size={48}
                className="dashboard-stat-avatar"
                style={styles.avatar}
              />
              <div>
                <Text className="dashboard-stat-text" style={styles.statText}>
                  {stat.title}
                </Text>
                <div className="dashboard-stat-value" style={styles.statValue}>
                  {stat.count}
                </div>
                <Text style={{ color: "#64748b", fontSize: "12px" }}>
                  {stat.trend}
                </Text>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

export default memo(DashboardIntroAndStats);
