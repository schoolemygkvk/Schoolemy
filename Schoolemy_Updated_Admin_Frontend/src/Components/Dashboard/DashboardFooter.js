import React from "react";
import { Layout, Row, Col, Typography } from "antd";
import { FaGraduationCap } from "react-icons/fa";
import Icon from "../../assets/icon.png";
import { scrollToTop } from "../Common/ScrollToTop";

const { Footer } = Layout;
const { Title, Text } = Typography;

const DashboardFooter = () => {
  const currentYear = new Date().getFullYear();
  const SUPPORT_EMAIL = process.env.REACT_APP_SUPPORT_EMAIL || 'support@schoolemy.com';
  
  return (
    <Footer
      style={{
        background: "#1a5f99",
        color: "white",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Row gutter={24} justify="space-between">
          <Col xs={24} sm={24} md={12} lg={12}>
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onClick={scrollToTop}
                onMouseEnter={(e) => {
                  const container = e.currentTarget;
                  const cap = container.querySelector('.graduation-cap');
                  const particles = container.querySelectorAll('.knowledge-particle');
                  
                  if (cap) {
                    cap.style.transform = "translateY(-8px) rotate(15deg)";
                    cap.style.opacity = "1";
                  }
                  
                  particles.forEach((particle, index) => {
                    particle.style.opacity = "1";
                    particle.style.transform = `translateY(-${5 + index * 2}px)`;
                  });
                  
                  container.style.boxShadow = "0 0 30px rgba(74, 144, 226, 0.8)";
                  container.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  const container = e.currentTarget;
                  const cap = container.querySelector('.graduation-cap');
                  const particles = container.querySelectorAll('.knowledge-particle');
                  
                  if (cap) {
                    cap.style.transform = "translateY(0) rotate(0deg)";
                    cap.style.opacity = "0.8";
                  }
                  
                  particles.forEach((particle) => {
                    particle.style.opacity = "0";
                    particle.style.transform = "translateY(0)";
                  });
                  
                  container.style.boxShadow = "none";
                  container.style.transform = "scale(1)";
                }}
              >
                {/* Main Icon */}
                <img
                  src={Icon}
                  alt="Schoolemy Icon"
                  style={{
                    width: "60%",
                    height: "60%",
                    objectFit: "contain",
                    borderRadius: "50%",
                    zIndex: 2,
                    position: "relative",
                  }}
                />
                
                {/* Graduation Cap Overlay */}
                <div
                  className="graduation-cap"
                  style={{
                    position: "absolute",
                    top: "-15px",
                    right: "-10px",
                    transition: "all 0.5s ease-in-out",
                    transform: "translateY(0) rotate(0deg)",
                    opacity: 0.8,
                    zIndex: 3,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                  }}
                >
                  <FaGraduationCap 
                    style={{ 
                      fontSize: "32px", 
                      color: "#1a5f99",
                      background: "white",
                      borderRadius: "50%",
                      padding: "4px",
                    }} 
                  />
                </div>
                
                {/* Floating knowledge particles */}
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="knowledge-particle"
                      style={{
                        position: "absolute",
                        width: "3px",
                        height: "3px",
                        background: "#ffd700",
                        borderRadius: "50%",
                        opacity: 0,
                        top: `${30 + Math.random() * 40}%`,
                        left: `${20 + Math.random() * 60}%`,
                        transition: `all 0.6s ease-in-out ${i * 0.1}s`,
                        boxShadow: "0 0 6px #ffd700",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Title level={4} style={{ color: "white" }}>
              About Schoolemy
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.85)" }}>
              Schoolemy is a platform dedicated to preserving and propagating
              traditional knowledge systems through modern technology.
            </Text>
          </Col>
          {/* <Col span={6}>
            <Title level={4} style={{ color: "white" }}>
              Quick Links
            </Title>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {["Home", "Courses", "Instructors", "Pricing", "Blog"].map(
                (item, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <a 
                      href="/" 
                      style={{ 
                        color: "rgba(255,255,255,0.85)",
                        textDecoration: "none",
                        transition: "color 0.3s ease"
                      }}
                      onMouseOver={(e) => e.target.style.color = "#ffd700"}
                      onMouseOut={(e) => e.target.style.color = "rgba(255,255,255,0.85)"}
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </Col>
          <Col span={6}>
            <Title level={4} style={{ color: "white" }}>
              Support
            </Title>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {[

              ].map((item, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <a 
                    href="/" 
                    style={{ 
                      color: "rgba(255,255,255,0.85)",
                      textDecoration: "none",
                      transition: "color 0.3s ease"
                    }}
                    onMouseOver={(e) => e.target.style.color = "#ffd700"}
                    onMouseOut={(e) => e.target.style.color = "rgba(255,255,255,0.85)"}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </Col> */}
          <Col xs={24} sm={24} md={12} lg={8} style={{ textAlign: "right" }}>
            <Title level={4} style={{ color: "white" }}>
              Contact Us
            </Title>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                color: "rgba(255,255,255,0.85)",
                textAlign: "right",
              }}
            >
              <li style={{ marginBottom: 8 }}>Email: {SUPPORT_EMAIL}</li>
              <li style={{ marginBottom: 8 }}>Phone: +91 9344596648</li>
              <li style={{ marginBottom: 8 }}>
                Tamilnadu, India
              </li>
              <li style={{ marginTop: 16 }}>
                {/* <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { icon: <FaFacebookF />, name: "Facebook", url: "https://facebook.com", color: "#1877F2" },
                    { icon: <FaXTwitter />, name: "X", url: "https://x.com", color: "#000000" },
                    { icon: <FaInstagram />, name: "Instagram", url: "https://instagram.com", color: "#E4405F" },
                    { icon: <FaYoutube />, name: "YouTube", url: "https://youtube.com", color: "#FF0000" }
                  ].map((social, i) => (
                    <a
                      key={i}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 32,
                        height: 32,
                        background: social.color,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        textDecoration: "none",
                        transition: "all 0.3s ease",
                        opacity: 0.9,
                      }}
                      onMouseOver={(e) => {
                        e.target.style.opacity = "1";
                        e.target.style.transform = "scale(1.1)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.opacity = "0.9";
                        e.target.style.transform = "scale(1)";
                      }}
                      title={social.name}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div> */}
              </li>
            </ul>
          </Col>
        </Row>
        
        {/* Copyright Section */}
        <Row style={{ marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "24px" }}>
          <Col span={12}>
            <Text style={{ color: "rgba(255,255,255,0.85)" }}>
              © {currentYear} Schoolemy. Made by LOGICAL MINDS IT
            </Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              style={{
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                transition: "color 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.color = "#ffd700"}
              onMouseOut={(e) => e.target.style.color = "rgba(255,255,255,0.85)"}
            >
              {SUPPORT_EMAIL}
            </a>
          </Col>
        </Row>
      </div>
    </Footer>
  );
};

export default DashboardFooter;