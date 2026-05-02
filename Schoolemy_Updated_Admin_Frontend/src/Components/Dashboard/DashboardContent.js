import React, { lazy, Suspense } from "react";
import { Spin } from "antd";
import "./DashboardContent.css";
import { DASHBOARD_STYLES } from "./dashboardContentStyles";
import { useDashboardContentData } from "./useDashboardContentData";
import DashboardIntroAndStats from "./DashboardIntroAndStats";
import DashboardInstructorsSection from "./DashboardInstructorsSection";
import DashboardCoursesSection from "./DashboardCoursesSection";
import DashboardTestimonialsSection from "./DashboardTestimonialsSection";

const DashboardAnalyticsCharts = lazy(() => import("./DashboardAnalyticsCharts"));

const chartsFallback = (
  <div
    className="dashboard-card"
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: 320,
      marginBottom: 24,
    }}
  >
    <Spin size="large" tip="Loading charts..." />
  </div>
);

const DashboardContent = ({
  totalUsers,
  totalCourses,
  activeSubscriptions,
  completionRate,
}) => {
  const styles = DASHBOARD_STYLES;

  const {
    checkIsSuperAdmin,
    handleInstructorCardClick,
    displayedTestimonials,
    emiData,
    enrollmentData,
    completionRateState,
    totalTutors,
    instructors,
    loadingInstructors,
    isLoadingCharts,
    chartError,
    retryCount,
  } = useDashboardContentData(completionRate);

  return (
    <div className="dashboard-container" style={styles.container}>
      <div
        className="dashboard-content-wrapper"
        style={styles.contentWrapper}
      >
        <DashboardIntroAndStats
          totalUsers={totalUsers}
          totalCourses={totalCourses}
          activeSubscriptions={activeSubscriptions}
          totalTutors={totalTutors}
          completionRateState={completionRateState}
        />

        <Suspense fallback={chartsFallback}>
          <DashboardAnalyticsCharts
            emiData={emiData}
            enrollmentData={enrollmentData}
            isLoadingCharts={isLoadingCharts}
            chartError={chartError}
            retryCount={retryCount}
          />
        </Suspense>

        <DashboardInstructorsSection
          instructors={instructors}
          loadingInstructors={loadingInstructors}
          checkIsSuperAdmin={checkIsSuperAdmin}
          onInstructorCardClick={handleInstructorCardClick}
        />

        <DashboardCoursesSection />

        <DashboardTestimonialsSection
          displayedTestimonials={displayedTestimonials}
        />
      </div>
    </div>
  );
};

export default DashboardContent;
