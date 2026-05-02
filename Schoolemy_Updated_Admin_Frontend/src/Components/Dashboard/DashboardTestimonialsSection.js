import React, { memo, useCallback } from "react";
import { Card, Row, Col, Typography } from "antd";
import { StarFilled } from "@ant-design/icons";
import logo from "../../assets/logo.png";
import {
  DASHBOARD_STYLES,
  headerLogoBoxStyle,
  headerLogoImgStyle,
} from "./dashboardContentStyles";

const { Title, Text } = Typography;

function DashboardTestimonialsSection({ displayedTestimonials }) {
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
            What Our Students Say
          </Title>
          <div style={headerLogoBoxStyle}>
            <img src={logo} alt="Schoolemy Logo" style={headerLogoImgStyle} />
          </div>
        </div>
      }
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      hoverable
    >
      <Row gutter={[16, 16]}>
        {displayedTestimonials.map((testimonial, index) => (
          <Col
            xs={24}
            sm={12}
            md={6}
            key={testimonial._id || testimonial.id || index}
          >
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
  );
}

export default memo(DashboardTestimonialsSection);
