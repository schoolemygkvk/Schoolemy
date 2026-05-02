import React from "react";
import { useNavigate } from "react-router-dom";
import marketingAnnouncementImage from "../../../assets/images/marketing-dashboard/marketing-announcement.svg";
import marketingAdvertisementImage from "../../../assets/images/marketing-dashboard/marketing-advertisement.svg";
import marketingCampaignsImage from "../../../assets/images/marketing-dashboard/marketing-campaigns.svg";
import marketingAdAnalyticsImage from "../../../assets/images/marketing-dashboard/marketing-ad-analytics.svg";
import marketingBlogManagementImage from "../../../assets/images/marketing-dashboard/marketing-blog-management.svg";
import marketingBlogsCheckingImage from "../../../assets/images/marketing-dashboard/marketing-blogs-checking.svg";
import marketingEventManagementImage from "../../../assets/images/marketing-dashboard/marketing-event-management.svg";

const marketingTools = [
  {
    name: "Announcement",
    description: "Create a new global announcement for all users.",
    image: marketingAnnouncementImage,
    path: "/schoolemy/marketing/create-announcement",
    color: "linear-gradient(135deg, #007bff 0%, #00c6ff 100%)",
  },
//   {
//   name: "Notification",
//   description: "Send a new notification with a message and join link.",
//   image: marketingNotificationImage, // add asset if enabling this tile
//   path: "/schoolemy/marketing/create-notification",
//   color: "linear-gradient(135deg, #ff6b6b 0%, #ffc371 100%)",
// },
  {
    name: "Advertisement",
    description: "Upload ads, assign campaigns, and set the active banner.",
    image: marketingAdvertisementImage,
    path: "/schoolemy/marketing/create-advertisement",
    color: "linear-gradient(135deg, #007bff 0%, #00c6ff 100%)",
  },
  {
    name: "Campaigns",
    description: "Lifecycle: draft → scheduled → active → paused/completed. Optional webhooks on status change.",
    image: marketingCampaignsImage,
    path: "/schoolemy/marketing/campaigns",
    color: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
  },
  {
    name: "Ad analytics",
    description: "Impressions, clicks, CTR, and breakdown by campaign.",
    image: marketingAdAnalyticsImage,
    path: "/schoolemy/marketing/ad-analytics",
    color: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
  },
  {
    name: "Blog-Management",
    description: "Create and manage marketing campaigns and promotions.",
    image: marketingBlogManagementImage,
    path: "/schoolemy/blog-management",
    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    name: "Blogs Checking",
    description: "Design and send email campaigns to your subscribers.",
    image: marketingBlogsCheckingImage,
    path: "/schoolemy/blogs",
    color: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
  },
  {
    name: "Event Management",
    description: "View marketing performance metrics and insights.",
    image: marketingEventManagementImage,
    path: "/schoolemy/events",
    color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
];

const MarketingDashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          padding: "2rem 1rem",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1440px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <header
            style={{
              marginBottom: "3rem",
              textAlign: "center",
              padding: "0 1rem",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(2rem, 6vw, 3rem)",
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: "1.5rem",
                marginTop: "1rem",
                lineHeight: 1.2,
              }}
            >
              Marketing Dashboard
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#64748b",
                maxWidth: "700px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Powerful tools to manage all your marketing activities and campaigns
            </p>
          </header>

          {/* Main Content */}
          <main>

            
            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
                padding: "0 1rem",
              }}
            >
              {marketingTools.map((tool, index) => (
                <div
                  key={index}
                  onClick={() => navigate(tool.path)}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    border: "1px solid #e2e8f0",
                  }}
                   // மாற்றம் 3: Hover effect-ஐ JavaScript-ல் மாற்றியுள்ளோம்
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                  }}
                >
                  {/* Color accent */}
                  <div
                    style={{
                      height: "8px",
                      background: tool.color,
                      width: "100%",
                    }}
                  />

                  {/* Content */}
                  <div
                    style={{
                      padding: "1.75rem",
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* ... மீதமுள்ள கோட் அப்படியே இருக்கும் ... */}
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "1.5rem",
                        boxShadow:
                          "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      {tool.image ? (
                        <img
                          src={tool.image}
                          alt=""
                          width={56}
                          height={56}
                          decoding="async"
                          style={{
                            display: "block",
                            objectFit: "contain",
                          }}
                          aria-hidden={true}
                        />
                      ) : null}
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                      <h2
                        style={{
                          color: "#1e293b",
                          fontSize: "1.25rem",
                          fontWeight: 700,
                          margin: "0 0 0.75rem 0",
                          lineHeight: 1.3,
                        }}
                      >
                        {tool.name}
                      </h2>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "0.95rem",
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {tool.description}
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          fontWeight: 500,
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ marginRight: "6px" }}
                        >
                          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
                          <path d="M12 8l.01 0"></path>
                          <path d="M11 12l1 0l4 0"></path>
                        </svg>
                        Marketing Tool
                      </span>
                      <button
                        style={{
                          background: "transparent",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        Open
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ marginLeft: "6px" }}
                        >
                          <path d="M5 12h14"></path>
                          <path d="M13 18l6 -6"></path>
                          <path d="M13 6l6 6"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;