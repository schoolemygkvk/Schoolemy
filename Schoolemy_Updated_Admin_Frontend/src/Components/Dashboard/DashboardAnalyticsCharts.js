import React, { memo } from "react";
import { Card, Row, Col, Typography } from "antd";
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
import logo from "../../assets/logo.png";
import { POLLING_CONFIG } from "./dashboardConstants";
import {
  DASHBOARD_STYLES,
  headerLogoBoxStyle,
  headerLogoImgStyle,
} from "./dashboardContentStyles";

const { Title, Text } = Typography;

function DashboardAnalyticsCharts({
  emiData,
  enrollmentData,
  isLoadingCharts,
  chartError,
  retryCount,
}) {
  const styles = DASHBOARD_STYLES;

  return (
    <Card
      headStyle={styles.cardHeader}
      bodyStyle={styles.cardBody}
      style={styles.card}
      className="dashboard-card"
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
            Performance Analytics
          </Title>
          <div style={headerLogoBoxStyle}>
            <img src={logo} alt="Schoolemy Logo" style={headerLogoImgStyle} />
          </div>
        </div>
      }
    >
      {chartError && (
        <div
          style={{
            padding: "12px",
            marginBottom: "16px",
            background: "#fef3c7",
            borderRadius: "8px",
            border: "1px solid #f59e0b",
            color: "#92400e",
          }}
        >
          <Text>{chartError}</Text>
          {retryCount < POLLING_CONFIG.MAX_RETRIES && (
            <Text style={{ marginLeft: "8px", fontSize: "12px" }}>
              (Retrying... {retryCount + 1}/{POLLING_CONFIG.MAX_RETRIES})
            </Text>
          )}
        </div>
      )}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <div style={styles.chartTitle}>Monthly EMI vs Paid (in thousands)</div>
          <div className="dashboard-chart-container">
            {isLoadingCharts && emiData.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Text style={{ color: "#64748b" }}>Loading EMI data...</Text>
              </div>
            ) : emiData.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Text style={{ color: "#64748b" }}>No EMI data available</Text>
              </div>
            ) : (
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
                    formatter={(value) => [`₹${value}K`, ""]}
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
            )}
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div style={styles.chartTitle}>Course Enrollments Trend</div>
          <div className="dashboard-chart-container">
            {isLoadingCharts && enrollmentData.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Text style={{ color: "#64748b" }}>
                  Loading enrollment data...
                </Text>
              </div>
            ) : enrollmentData.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Text style={{ color: "#64748b" }}>
                  No enrollment data available
                </Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={enrollmentData}
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
                  {enrollmentData[0]?.newUsers !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="newUsers"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#059669", strokeWidth: 2 }}
                      name="New Users"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
}

export default memo(DashboardAnalyticsCharts);
