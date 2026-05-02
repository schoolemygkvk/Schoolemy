import React, { useEffect, useState, useMemo, Suspense } from "react";
import axios from "../../../../Utils/api";
import {
  Card,
  Typography,
  Input,
  Row,
  Col,
  Tag,
  Spin,
  Empty,
  Statistic,
  Avatar,
  Divider,
  Timeline,
} from "antd";
import {
  ClockCircleOutlined,
  LogoutOutlined,
  UserOutlined,
  SearchOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useToken } from "../../../../Hooks/useToken";

const TutorAnalyticsCharts = React.lazy(() => import("./TutorAnalyticsCharts"));

const { Title, Text } = Typography;

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return "Ongoing";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const chartsFallback = (
  <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
    <Col span={24} style={{ textAlign: "center", padding: 48 }}>
      <Spin size="large" />
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">Loading charts…</Text>
      </div>
    </Col>
  </Row>
);

const TutorAnalyticsActivityDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [courseStats, setCourseStats] = useState(null);
  const [courseStatsLoading, setCourseStatsLoading] = useState(true);

  // useToken() does not expose `token` (httpOnly cookies); use isAuthenticated.
  // The shared axios instance adds `Authorization: Bearer` from secureStorage when present.
  const { isAuthenticated } = useToken();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setCourseStatsLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchAnalytics = async () => {
      setLoading(true);
      setCourseStatsLoading(true);
      setError(null);
      try {
        const [lightResult, courseResult] = await Promise.allSettled([
          axios.get("/tutor-analytics-light", {
            params: {
              ...(debouncedSearch ? { search: debouncedSearch } : {}),
            },
          }),
          axios.get("/tutor-analytics-courses"),
        ]);
        if (cancelled) return;

        if (lightResult.status === "fulfilled") {
          setData(lightResult.value.data?.data ?? null);
        } else {
          console.error("Tutor analytics light failed:", lightResult.reason);
          setData(null);
        }
        if (courseResult.status === "fulfilled") {
          setCourseStats(courseResult.value.data?.data ?? null);
        } else {
          console.error("Tutor course stats failed:", courseResult.reason);
          setCourseStats(null);
        }

        const failed = [];
        if (lightResult.status === "rejected")
          failed.push("tutor activity");
        if (courseResult.status === "rejected")
          failed.push("course statistics");
        if (failed.length) {
          const fromLight =
            lightResult.status === "rejected"
              ? lightResult.reason?.response?.data?.message
              : undefined;
          const fromCourse =
            courseResult.status === "rejected"
              ? courseResult.reason?.response?.data?.message
              : undefined;
          const apiMsg = fromLight ?? fromCourse;
          setError(
            apiMsg != null && String(apiMsg).length
              ? String(apiMsg)
              : `Could not load ${failed.join(" and ")}`,
          );
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching tutor analytics:", err);
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load analytics");
          setData(null);
          setCourseStats(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCourseStatsLoading(false);
        }
      }
    };

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, debouncedSearch]);

  const tutors = data?.tutors ?? [];
  const totalTutors = data?.totalTutors ?? 0;
  const activeTutors = data?.activeTutors ?? 0;
  const avgSession = data?.avgSessionSeconds ?? 0;
  const loginsToday = data?.loginsToday ?? 0;
  const loginDataPerDay = data?.loginsThisWeek ?? [];
  const roleDistribution = useMemo(
    () => data?.roleDistribution ?? [],
    [data],
  );

  const hasOpenSession = (tutor) =>
    tutor.loginHistory?.some((log) => !log.logoutTime);

  return (
    <div
      style={{
        padding: 24,
        backgroundColor: "#f5f9ff",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          backgroundColor: "white",
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              color: "#003366",
              margin: 0,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            Tutor Analytics & Activity Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Monitor tutor activities and system usage patterns
          </Text>
        </div>
        <div
          style={{
            backgroundColor: "#e6f7ff",
            padding: "8px 16px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TeamOutlined style={{ color: "#1890ff", fontSize: 18 }} />
          <Text strong style={{ color: "#1890ff" }}>
            {activeTutors} Active Tutors
          </Text>
        </div>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
              background: "linear-gradient(135deg, #f0f9ff, #e6f7ff)",
            }}
          >
            <Statistic
              title="Total Tutors"
              value={totalTutors}
              valueStyle={{ color: "#1890ff", fontSize: 32 }}
              prefix={<TeamOutlined style={{ color: "#69c0ff" }} />}
              suffix={<Text type="secondary">users</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
              background: "linear-gradient(135deg, #f6ffed, #f0ffe6)",
            }}
          >
            <Statistic
              title="Active Sessions"
              value={activeTutors}
              valueStyle={{ color: "#52c41a", fontSize: 32 }}
              prefix={<UserOutlined style={{ color: "#95de64" }} />}
              suffix={<Text type="secondary">now</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
              background: "linear-gradient(135deg, #fff0f6, #fff2e8)",
            }}
          >
            <Statistic
              title="Avg. Session"
              value={formatDuration(avgSession)}
              valueStyle={{ color: "#fa8c16", fontSize: 32 }}
              prefix={<ClockCircleOutlined style={{ color: "#ffc069" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
              background: "linear-gradient(135deg, #f9f0ff, #f0f5ff)",
            }}
          >
            <Statistic
              title="Logins Today"
              value={loginsToday}
              valueStyle={{ color: "#722ed1", fontSize: 32 }}
              prefix={<CalendarOutlined style={{ color: "#b37feb" }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(168, 85, 247, 0.15)",
              background: "linear-gradient(135deg, #f3e5f5, #ede7f6)",
            }}
          >
            <Statistic
              title="Total Courses"
              value={courseStats?.summary?.totalCourses ?? 0}
              valueStyle={{ color: "#a855f7", fontSize: 32 }}
              prefix={<TeamOutlined style={{ color: "#d8b4fe" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(249, 115, 22, 0.15)",
              background: "linear-gradient(135deg, #fff7ed, #fed7aa)",
            }}
          >
            <Statistic
              title="Total Enrollments"
              value={courseStats?.summary?.totalStudentEnrollments ?? 0}
              valueStyle={{ color: "#f97316", fontSize: 32 }}
              prefix={<UserOutlined style={{ color: "#fdba74" }} />}
              suffix={<Text type="secondary">students</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.15)",
              background: "linear-gradient(135deg, #f0fdf4, #dbeafe)",
            }}
          >
            <Statistic
              title="Total Revenue"
              value={courseStats?.summary?.totalRevenue ? `₹${courseStats.summary.totalRevenue.toLocaleString("en-IN")}` : "₹0"}
              valueStyle={{ color: "#22c55e", fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(6, 182, 212, 0.15)",
              background: "linear-gradient(135deg, #ecf0f1, #e0f2fe)",
            }}
          >
            <Statistic
              title="Commission (30%)"
              value={courseStats?.summary?.totalCommission ? `₹${courseStats.summary.totalCommission.toLocaleString("en-IN")}` : "₹0"}
              valueStyle={{ color: "#06b6d4", fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      {!loading && error && (
        <Card style={{ marginBottom: 24, borderColor: "#ffccc7" }}>
          <Text type="danger">{error}</Text>
        </Card>
      )}

      {error && !data && !courseStats ? null : !data && !courseStats && loading ? (
        chartsFallback
      ) : (
        <Suspense fallback={chartsFallback}>
          <TutorAnalyticsCharts
            loginDataPerDay={loginDataPerDay}
            roleDistribution={roleDistribution}
            courseStatusData={courseStats?.courseStatusChartData ?? []}
            topEarners={courseStats?.topEarners ?? []}
          />
        </Suspense>
      )}

      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, minWidth: 300 }}>
            <Input
              placeholder="Search tutor by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined style={{ color: "#1890ff" }} />}
              style={{
                borderRadius: 8,
                backgroundColor: "#fff",
                border: "1px solid #d9e7ff",
                height: 42,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Tag color="blue" style={{ padding: "4px 12px", borderRadius: 6 }}>
              Total: {totalTutors}
            </Tag>
            <Tag color="green" style={{ padding: "4px 12px", borderRadius: 6 }}>
              Active: {activeTutors}
            </Tag>
            <Tag color="gold" style={{ padding: "4px 12px", borderRadius: 6 }}>
              Avg. Session: {formatDuration(avgSession)}
            </Tag>
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: 16 }}>
            Loading tutor activity data...
          </Text>
        </div>
      ) : tutors.length === 0 ? (
        <Empty
          description="No matching tutors found"
          imageStyle={{ height: 120 }}
          style={{
            padding: 40,
            backgroundColor: "white",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
          }}
        >
          <Text type="secondary">Try a different search term</Text>
        </Empty>
      ) : (
        <Row gutter={[24, 24]}>
          {tutors.map((tutor) => (
            <Col xs={24} key={tutor._id}>
              <Card
                title={
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <Avatar
                      style={{
                        backgroundColor: hasOpenSession(tutor)
                          ? "#52c41a"
                          : "#f0f0f0",
                        color: hasOpenSession(tutor) ? "white" : "#595959",
                      }}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {tutor.name}
                      </Text>
                      <div style={{ fontSize: 14, color: "#8c8c8c" }}>
                        {tutor.email}
                      </div>
                    </div>
                  </div>
                }
                extra={
                  <Tag
                    color="blue"
                    style={{
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontWeight: 500,
                      border: "1px solid #d9e7ff",
                    }}
                  >
                    {tutor.role}
                  </Tag>
                }
                headStyle={{
                  backgroundColor: "#f0f9ff",
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  padding: "16px 24px",
                  borderBottom: "1px solid #e6f7ff",
                }}
                bodyStyle={{ padding: "16px 24px" }}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e6f7ff",
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(24, 144, 255, 0.08)",
                }}
              >
                {courseStats?.perTutorStats && courseStats.perTutorStats[tutor._id] && (
                  <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #e6f7ff" }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <Tag color="purple" style={{ borderRadius: 4 }}>
                        Courses: {courseStats.perTutorStats[tutor._id].totalCourses}
                      </Tag>
                      <Tag color="orange" style={{ borderRadius: 4 }}>
                        Students: {courseStats.perTutorStats[tutor._id].studentEnrollments}
                      </Tag>
                      <Tag color="green" style={{ borderRadius: 4 }}>
                        Earnings: ₹{courseStats.perTutorStats[tutor._id].totalRevenue.toLocaleString("en-IN")}
                      </Tag>
                    </div>
                  </div>
                )}
                {tutor.loginHistory?.length > 0 ? (
                  <Timeline mode="left">
                    {[...tutor.loginHistory].reverse().map((log, index) => (
                      <Timeline.Item
                        key={`${tutor._id}-${index}-${log.loginTime}`}
                        dot={
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              backgroundColor: log.logoutTime
                                ? "#e6f7ff"
                                : "#f6ffed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: `2px solid ${
                                log.logoutTime ? "#69c0ff" : "#95de64"
                              }`,
                            }}
                          >
                            {log.logoutTime ? (
                              <ClockCircleOutlined
                                style={{ color: "#1890ff", fontSize: 12 }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: "#52c41a",
                                }}
                              />
                            )}
                          </div>
                        }
                        color={log.logoutTime ? "blue" : "green"}
                      >
                        <div
                          style={{
                            backgroundColor: log.logoutTime
                              ? "#f0f9ff"
                              : "#f6ffed",
                            padding: 12,
                            borderRadius: 8,
                            marginLeft: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text strong style={{ color: "#262626" }}>
                              {formatDate(log.loginTime)}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              {formatTime(log.loginTime)}
                            </Text>
                          </div>

                          <Divider
                            style={{
                              margin: "8px 0",
                              backgroundColor: "#e8e8e8",
                            }}
                          />

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              {log.logoutTime ? (
                                <>
                                  <Text>
                                    <b>Logout:</b>{" "}
                                    {formatTime(log.logoutTime)}
                                  </Text>
                                  <br />
                                  <Text
                                    type="success"
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <LogoutOutlined /> Session:{" "}
                                    {formatDuration(log.sessionDuration)}
                                  </Text>
                                </>
                              ) : (
                                <Text
                                  type="warning"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    backgroundColor: "#f6ffed",
                                    padding: "4px 8px",
                                    borderRadius: 4,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      backgroundColor: "#52c41a",
                                    }}
                                  />
                                  Active Session
                                </Text>
                              )}
                            </div>
                            {log.logoutTime && (
                              <Tag color="cyan" style={{ borderRadius: 4 }}>
                                {formatDuration(log.sessionDuration)}
                              </Tag>
                            )}
                          </div>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 20,
                      backgroundColor: "#fafafa",
                      borderRadius: 8,
                    }}
                  >
                    <Text type="secondary">No login history recorded</Text>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default TutorAnalyticsActivityDashboard;
