import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
import {
  Card,
  Typography,
  Input,
  Timeline,
  Row,
  Col,
  Tag,
  Spin,
  Empty,
  Statistic,
  Avatar,
  Divider
} from "antd";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import { 
  ClockCircleOutlined, 
  LogoutOutlined, 
  UserOutlined,
  SearchOutlined,
  TeamOutlined,
  CalendarOutlined,
  LineChartOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Updated color palette with blue and green theme
const COLORS = [
  "#1890ff", "#40a9ff", "#69c0ff", "#91d5ff", "#bae7ff", 
  "#52c41a", "#73d13d", "#95de64", "#b7eb8f", "#d9f7be"
];

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

const AdminAnalyticsActivityDashboard = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeAdmins, setActiveAdmins] = useState(0);
  const [avgSession, setAvgSession] = useState(0);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await axios.get("/get-admins", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmins(res.data);
        
        // Calculate active admins
        const active = res.data.filter(admin => 
          admin.loginHistory?.some(log => !log.logoutTime)
        ).length;
        setActiveAdmins(active);
        
        // Calculate average session time
        const sessions = res.data.flatMap(admin => 
          admin.loginHistory?.map(log => log.sessionDuration || 0).filter(d => d > 0) || []
        );
        const avg = sessions.length > 0 
          ? Math.floor(sessions.reduce((a, b) => a + b, 0) / sessions.length) 
          : 0;
        setAvgSession(avg);
      } catch (err) {
        console.error("Error fetching admins:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, [token]); // Fixed: Added token to dependency array

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleDistribution = Object.values(
    admins.reduce((acc, admin) => {
      acc[admin.role] = acc[admin.role] || { name: admin.role, value: 0 };
      acc[admin.role].value++;
      return acc;
    }, {})
  );

  const loginDataPerDay = (() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const currentDay = today.getDay(); // 0-6 (Sun-Sat)
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((currentDay + 6) % 7)); // Back to Monday

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        label: days[i], // Use index i directly since we start from Monday
        key: date.toISOString().split("T")[0], // YYYY-MM-DD
        logins: 0,
      };
    });

    admins.forEach((admin) => {
      admin.loginHistory?.forEach((log) => {
        const logDate = new Date(log.loginTime).toISOString().split("T")[0];
        const match = weekDates.find((d) => d.key === logDate);
        if (match) match.logins++;
      });
    });

    return weekDates;
  })();

  return (
    <div style={{ 
      padding: 24, 
      backgroundColor: "#f5f9ff", 
      minHeight: "100vh",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          marginBottom: '16px',
          backgroundColor: 'white',
          color: '#374151',
          border: '1px solid #e0e7ff',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-4px)';
          e.currentTarget.style.backgroundColor = '#f0f9ff';
          e.currentTarget.style.borderColor = '#69c0ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#e0e7ff';
        }}
      >
        <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.1)'
      }}>
        <div>
          <Title level={2} style={{ 
            color: "#003366", 
            margin: 0,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
          Admin Analytics & Activity Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Monitor admin activities and system usage patterns
          </Text>
        </div>
        <div style={{
          backgroundColor: '#e6f7ff',
          padding: '8px 16px',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <TeamOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <Text strong style={{ color: '#1890ff' }}>{activeAdmins} Active Admins</Text>
        </div>
      </div>

      {/* ========== ANALYTICS CARDS ========== */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: 12, 
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)',
              background: 'linear-gradient(135deg, #f0f9ff, #e6f7ff)'
            }}
          >
            <Statistic
              title="Total Admins"
              value={admins.length}
              valueStyle={{ color: '#1890ff', fontSize: 32 }}
              prefix={<TeamOutlined style={{ color: '#69c0ff' }} />}
              suffix={<Text type="secondary">users</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: 12, 
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)',
              background: 'linear-gradient(135deg, #f6ffed, #f0ffe6)'
            }}
          >
            <Statistic
              title="Active Sessions"
              value={activeAdmins}
              valueStyle={{ color: '#52c41a', fontSize: 32 }}
              prefix={<UserOutlined style={{ color: '#95de64' }} />}
              suffix={<Text type="secondary">now</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: 12, 
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)',
              background: 'linear-gradient(135deg, #fff0f6, #fff2e8)'
            }}
          >
            <Statistic
              title="Avg. Session"
              value={formatDuration(avgSession)}
              valueStyle={{ color: '#fa8c16', fontSize: 32 }}
              prefix={<ClockCircleOutlined style={{ color: '#ffc069' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: 12, 
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)',
              background: 'linear-gradient(135deg, #f9f0ff, #f0f5ff)'
            }}
          >
            <Statistic
              title="Logins Today"
              value={(() => {
                const today = new Date().toISOString().split("T")[0];
                const todayData = loginDataPerDay.find(day => day.key === today);
                return todayData?.logins || 0;
              })()}
              valueStyle={{ color: '#722ed1', fontSize: 32 }}
              prefix={<CalendarOutlined style={{ color: '#b37feb' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* ========== CHARTS SECTION ========== */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LineChartOutlined style={{ color: '#1890ff' }} />
                <Text strong>Logins This Week</Text>
              </div>
            }
            bordered={false}
            style={{ 
              borderRadius: 12, 
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.1)',
              height: '100%'
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={loginDataPerDay}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0050b3" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 8, 
                    border: '1px solid #e6f7ff',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                  }}
                />
                <Bar 
                  dataKey="logins" 
                  name="Login Count" 
                  fill="url(#barGradient)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LineChartOutlined style={{ color: '#722ed1' }} />
                <Text strong>Role Distribution</Text>
              </div>
            }
            bordered={false}
            style={{ 
              borderRadius: 12, 
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.1)',
              height: '100%'
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {roleDistribution.map((_, index) => (
                    <Cell 
                      key={index} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 8, 
                    border: '1px solid #f9f0ff',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LineChartOutlined style={{ color: '#fa8c16' }} />
                <Text strong>Login Activity Timeline</Text>
              </div>
            }
            bordered={false}
            style={{ 
              borderRadius: 12, 
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.1)',
              height: '100%'
            }}
          >
            <Timeline mode="alternate" style={{ padding: '20px 0' }}>
              {loginDataPerDay.map((day, index) => (
                <Timeline.Item 
                  key={index}
                  color={index % 2 === 0 ? "#1890ff" : "#52c41a"}
                  label={
                    <Text strong style={{ 
                      color: index === loginDataPerDay.length - 1 ? '#1890ff' : '#595959',
                      fontSize: 14
                    }}>
                      {day.label}
                    </Text>
                  }
                >
                  <div style={{ 
                    backgroundColor: index % 2 === 0 ? '#e6f7ff' : '#f6ffed',
                    padding: '8px 12px',
                    borderRadius: 6,
                    marginTop: -8
                  }}>
                    <Text strong style={{ fontSize: 16 }}>{day.logins}</Text>
                    <Text type="secondary"> logins</Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* ========== SEARCH AND FILTER SECTION ========== */}
      <Card
        style={{ 
          borderRadius: 12, 
          marginBottom: 24,
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <Input
              placeholder="Search admin by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
              style={{
                borderRadius: 8,
                backgroundColor: "#fff",
                border: "1px solid #d9e7ff",
                height: 42
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tag color="blue" style={{ padding: '4px 12px', borderRadius: 6 }}>
              Total: {admins.length}
            </Tag>
            <Tag color="green" style={{ padding: '4px 12px', borderRadius: 6 }}>
              Active: {activeAdmins}
            </Tag>
            <Tag color="gold" style={{ padding: '4px 12px', borderRadius: 6 }}>
              Avg. Session: {formatDuration(avgSession)}
            </Tag>
          </div>
        </div>
      </Card>

      {/* ========== ADMIN ACTIVITY CARDS ========== */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: 16 }}>Loading admin activity data...</Text>
        </div>
      ) : filteredAdmins.length === 0 ? (
        <Empty 
          description="No matching admins found" 
          imageStyle={{ height: 120 }}
          style={{ 
            padding: 40, 
            backgroundColor: 'white', 
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.1)'
          }}
        >
          <Text type="secondary">Try a different search term</Text>
        </Empty>
      ) : (
        <Row gutter={[24, 24]}>
          {filteredAdmins.map((admin) => (
            <Col xs={24} key={admin._id}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar 
                      style={{ 
                        backgroundColor: admin.loginHistory?.some(log => !log.logoutTime) 
                          ? '#52c41a' : '#f0f0f0',
                        color: admin.loginHistory?.some(log => !log.logoutTime) 
                          ? 'white' : '#595959'
                      }}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <Text strong style={{ fontSize: 16 }}>{admin.name}</Text>
                      <div style={{ fontSize: 14, color: '#8c8c8c' }}>{admin.email}</div>
                    </div>
                  </div>
                }
                extra={
                  <Tag 
                    color="blue" 
                    style={{ 
                      borderRadius: 20, 
                      padding: '4px 12px',
                      fontWeight: 500,
                      border: '1px solid #d9e7ff'
                    }}
                  >
                    {admin.role}
                  </Tag>
                }
                headStyle={{ 
                  backgroundColor: '#f0f9ff', 
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  padding: '16px 24px',
                  borderBottom: '1px solid #e6f7ff'
                }}
                bodyStyle={{ padding: '16px 24px' }}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e6f7ff",
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(24, 144, 255, 0.08)",
                }}
              >
                {admin.loginHistory?.length > 0 ? (
                  <Timeline mode="left">
                    {[...admin.loginHistory].reverse().slice(0, 3).map((log, index) => (
                      <Timeline.Item
                        key={index}
                        dot={
                          <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: log.logoutTime ? '#e6f7ff' : '#f6ffed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${log.logoutTime ? '#69c0ff' : '#95de64'}`
                          }}>
                            {log.logoutTime ? (
                              <ClockCircleOutlined style={{ color: '#1890ff' }} />
                            ) : (
                              <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#52c41a'
                              }} />
                            )}
                          </div>
                        }
                        color={log.logoutTime ? "blue" : "green"}
                      >
                        <div style={{ 
                          backgroundColor: log.logoutTime ? '#f0f9ff' : '#f6ffed',
                          padding: 12,
                          borderRadius: 8,
                          marginLeft: 12
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong style={{ color: '#262626' }}>
                              {formatDate(log.loginTime)}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              {formatTime(log.loginTime)}
                            </Text>
                          </div>
                          
                          <Divider style={{ margin: '8px 0', backgroundColor: '#e8e8e8' }} />
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              {log.logoutTime ? (
                                <>
                                  <Text>
                                    <b>Logout:</b> {formatTime(log.logoutTime)}
                                  </Text>
                                  <br />
                                  <Text type="success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <LogoutOutlined /> Session: {formatDuration(log.sessionDuration)}
                                  </Text>
                                </>
                              ) : (
                                <Text type="warning" style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: 4,
                                  backgroundColor: '#f6ffed',
                                  padding: '4px 8px',
                                  borderRadius: 4
                                }}>
                                  <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#52c41a'
                                  }} />
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
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 20,
                    backgroundColor: '#fafafa',
                    borderRadius: 8
                  }}>
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

export default AdminAnalyticsActivityDashboard;