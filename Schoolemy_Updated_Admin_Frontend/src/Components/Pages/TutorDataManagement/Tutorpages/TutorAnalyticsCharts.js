import React from "react";
import { Card, Typography, Timeline, Row, Col } from "antd";
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
  Legend,
} from "recharts";
import { LineChartOutlined } from "@ant-design/icons";

const { Text } = Typography;

const COLORS = [
  "#1890ff",
  "#40a9ff",
  "#69c0ff",
  "#91d5ff",
  "#bae7ff",
  "#52c41a",
  "#73d13d",
  "#95de64",
  "#b7eb8f",
  "#d9f7be",
];


const TutorAnalyticsCharts = ({ loginDataPerDay, roleDistribution, courseStatusData, topEarners }) => {
  return (
    <>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LineChartOutlined style={{ color: "#1890ff" }} />
                <Text strong>Logins This Week</Text>
              </div>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
              height: "100%",
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={loginDataPerDay}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0050b3" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e6f7ff",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LineChartOutlined style={{ color: "#722ed1" }} />
                <Text strong>Role Distribution</Text>
              </div>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
              height: "100%",
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
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
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
                    border: "1px solid #f9f0ff",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LineChartOutlined style={{ color: "#722ed1" }} />
                <Text strong>Course Status Overview</Text>
              </div>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
              height: "100%",
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseStatusData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e6f7ff",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                  }}
                />
                <Legend />
                <Bar dataKey="courses" name="Courses" fill="#1890ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="students" name="Students" fill="#52c41a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LineChartOutlined style={{ color: "#fa8c16" }} />
                <Text strong>Top Tutors by Earnings</Text>
              </div>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
              height: "100%",
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topEarners || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e6f7ff",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                  }}
                  formatter={(value) => `₹${value.toLocaleString("en-IN")}`}
                />
                <Bar dataKey="totalCommission" name="Commission (30%)" fill="#fa8c16" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={24}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LineChartOutlined style={{ color: "#fa8c16" }} />
                <Text strong>Login Activity Timeline</Text>
              </div>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.1)",
              height: "100%",
            }}
          >
            <Timeline mode="alternate" style={{ padding: "20px 0" }}>
              {loginDataPerDay.map((day, index) => (
                <Timeline.Item
                  key={day.key}
                  color={index % 2 === 0 ? "#1890ff" : "#52c41a"}
                  label={
                    <Text
                      strong
                      style={{
                        color:
                          index === loginDataPerDay.length - 1
                            ? "#1890ff"
                            : "#595959",
                        fontSize: 14,
                      }}
                    >
                      {day.label}
                    </Text>
                  }
                >
                  <div
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#e6f7ff" : "#f6ffed",
                      padding: "8px 12px",
                      borderRadius: 6,
                      marginTop: -8,
                    }}
                  >
                    <Text strong style={{ fontSize: 16 }}>
                      {day.logins}
                    </Text>
                    <Text type="secondary"> logins</Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default TutorAnalyticsCharts;
