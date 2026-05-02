import React from "react";
import { hasAccess, getRoleDisplayName } from "../Utils/roleBasedAccess";
import { secureStorage } from "../Utils/security";
import useDynamicRBAC from "../Hooks/useDynamicRBAC";


export const routeAccessConfig = {
  // Dashboard and Main Routes
  dashboard: {
    path: "/",
    roles: [
      "superadmin",
      "admin",
      "committeeoftrustees",
      "boscontroller",
      "bosmembers",
      "coursemanagement",
      "tutormanagement",
      "usermanagement",
      "documentverification",
      "marketing",
      "auditor",
      "Financial",
    ],
  },

  // Admin/COT Routes
  "admin-users": {
    path: "admin-users",
    roles: ["superadmin", "admin", "committeeoftrustees"],
  },
  "create-admin": {
    path: "create-admin",
    roles: ["superadmin", "admin", "committeeoftrustees"],
  },
  "admin-details": {
    path: "admin-details",
    roles: ["superadmin", "admin", "committeeoftrustees"],
  },
  "admin-analytics": {
    path: "admin-analytics",
    roles: ["superadmin", "admin", "committeeoftrustees"],
  },
  "create-tutors": {
    path: "create-tutors",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-details": {
    path: "tutor-details",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-analytics": {
    path: "tutor-analytics",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-list": {
    path: "tutor-list",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-courses": {
    path: "tutor-courses/:tutorname",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-course-detail": {
    path: "tutor-course-detail/:coursename",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-course-review": {
    path: "tutor-course-review",
    roles: ["superadmin", "admin", "coursemanagement"],
  },
  "tutor-payment-details": {
    path: "tutor-payment-details",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement", "auditor"],
  },

  // Role Access Management
  "rbac-dashboard": {
    path: "rbac-dashboard",
    roles: ["superadmin", "admin"],
  },
  "role-creation": {
    path: "role-creation",
    roles: ["superadmin"],
  },
  "page-permissions": {
    path: "page-permissions",
    roles: ["superadmin"],
  },
  "role-management": {
    path: "role-management",
    roles: ["superadmin"],
  },
  "getcourses-tutors": {
    path: "getcourses-tutors/:tutorname",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "tutor-course-payments": {
    path: "tutor-course-payments",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "tutor-payment-history": {
    path: "tutor-payment-history",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement", "auditor"],
  },
  "tutor-commission-due": {
    path: "tutor-commission-due",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement", "auditor"],
  },

  // User Routes
  users: {
    path: "users",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "user-details": {
    path: "user-details",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "Payment-record": {
    path: "Payment-record",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement","auditor"],
  },
  "emi-details": {
    path: "emi-details",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "login-status": {
    path: "login-status",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "student-documents": {
    path: "student-documents",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },

  // Course Routes
  courses: {
    path: "courses",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "add-course": {
    path: "add-course",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "course-list": {
    path: "course-list",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "course-details": {
    path: "course-list/:coursename",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "edit-course": {
    path: "edit-course/:coursename",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "view-courses-by-category": {
    path: "view-courses-by-category",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },

  // Question Paper Routes
  "add-question-paper": {
    path: "add-question-paper",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "view-question-papers": {
    path: "view-question-papers",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },

  // Exam Answer Management Routes
  "exam-answers": {
    path: "exam-answers",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "exam-dashboard": {
    path: "exam-dashboard",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "student-stats": {
    path: "student-stats",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "course-analytics": {
    path: "course-analytics",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },

  // BOS Routes
  bos: {
    path: "bos",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "bos-members": {
    path: "bos-members",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "create-meeting": {
    path: "create-meeting",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "submit-course-proposal": {
    path: "submit-course-proposal",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "pending-proposals": {
    path: "pending-proposals",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "cot-course-proposals": {
    path: "cot-course-proposals",
    roles: ["superadmin", "admin", "committeeoftrustees"],
  },
  "create-decision": {
    path: "create-decision",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "recent-decision": {
    path: "recent-decision",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "cot-decision-list": {
    path: "cot-decision-list",
    roles: ["superadmin", "admin", "committeeoftrustees"],
  },
  "create-bos-meeting": {
    path: "create-bos-meeting",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "view-bos-meeting": {
    path: "view-bos-meeting",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "assign-task": {
    path: "assign-task",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "task-status": {
    path: "task-status",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },

  // Data Maintenance Routes
  "data-maintenance": {
    path: "data-maintenance",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "completion-certificates": {
    path: "completion-certificates",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "certificates-verification": {
    path: "completion-certificates",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "exam-marks-records": {
    path: "exam-marks-records",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "staff-management": {
    path: "staff-management",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "instructors-management": {
    path: "instructors-management",
    roles: ["superadmin"],
  },
  "student-complaints": {
    path: "student-complaints",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "student-details-management": {
    path: "student-details-management",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
  "practice-class-list": {
    path: "practice-class-list",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },
   "Financial": {
    path: "Financial",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement","Financial"],
  },


  // Course-based Meet Management Routes (NEW SYSTEM)
  "create-course-meet": {
    path: "create-course-meet",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "edit-course-meet/:id": {
    path: "edit-course-meet/:id",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "course-meets": {
    path: "course-meets",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  "course-meet-attendance/:id": {
    path: "course-meet-attendance/:id",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
    "course-meet-details/:id": {
    path: "course-meet-details/:id",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
    "course-meet-materials/:id": {
    path: "course-meet-materials/:id",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
   "DM_Dashboard": {
    path: "DM_Dashboard",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
  
  
  // Marketing Routes
  "marketing-dashboard": {
    path: "marketing-dashboard",
    roles: ["superadmin", "admin", "committeeoftrustees", "marketing"],
  },
  "marketing-create-announcement": {
    path: "marketing/create-announcement",
    roles: ["superadmin", "admin", "committeeoftrustees", "marketing"],
  },
  "marketing-create-advertisement": {
    path: "marketing/create-advertisement",
    roles: ["superadmin", "admin", "committeeoftrustees", "marketing"],
  },
  "marketing-create-notification": {
    path: "marketing/create-notification",
    roles: ["superadmin", "admin", "committeeoftrustees", "marketing"],
  },
  "marketing-campaigns": {
    path: "marketing/campaigns",
    roles: ["superadmin", "admin", "committeeoftrustees", "marketing"],
  },
  "marketing-ad-analytics": {
    path: "marketing/ad-analytics",
    roles: ["superadmin", "admin", "committeeoftrustees", "marketing"],
  },

  // Document Verification Routes
  "document-verification": {
    path: "document-verification",
    roles: ["superadmin", "admin", "committeeoftrustees", "documentverification"],
  },

  // Certificate Maintenance Routes
  "certificate-maintenance": {
    path: "certificate-maintenance",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },

  // Voting Routes
  "vote-demo": {
    path: "demo",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  vote: {
    path: "vote",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "vote-create": {
    path: "create",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  polling: {
    path: "polling",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  results: {
    path: "results",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  total: {
    path: "total",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },
  "live-results": {
    path: "live-results",
    roles: ["superadmin", "admin", "committeeoftrustees", "boscontroller",
      "bosmembers",],
  },

  // Notification Routes
  notifications: {
    path: "notifications",
    roles: [
      "superadmin",
      "admin",
      "committeeoftrustees",
      "boscontroller",
      "bosmembers",
      "coursemanagement",
      "tutormanagement",
      "usermanagement",
      "documentverification",
      "marketing",
      "auditor",
    ],
  },

  // Profile Routes
  profile: {
    path: "profile",
    roles: [
      "superadmin",
      "admin",
      "committeeoftrustees",
      "boscontroller",
      "bosmembers",
      "coursemanagement",
      "tutormanagement",
      "usermanagement",
      "documentverification",
      "marketing",
      "auditor",
      "tutor",
      "Financial",
    ],
  },

  // Feedback Routes
  feedback: {
    path: "feedback",
    roles: ["superadmin", "admin", "committeeoftrustees", "usermanagement"],
  },

  // User Landing Page Routes
  "user-landing-page": {
    path: "user-landing-page",
    roles: [
      "superadmin",
      "admin",
      "boscontroller",
      "bosmembers",
      "datamaintenance",
      "coursecontroller",
      "marketing",
    ],
  },

  // Tutor Routes
  "tutor-terms-and-conditions": {
    path: "tutor-terms-and-conditions",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-dashboard": {
    path: "tutor/dashboard",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutors-management": {
    path: "tutors-management",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-upload-course": {
    path: "tutor-upload-course",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-course-list": {
    path: "tutor-course-list",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-course-details": {
    path: "tutor-course-list/:coursename",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-edit-course": {
    path: "tutor-edit-course/:coursename",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },
  "tutor-revenue": {
    path: "tutor-revenue",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },

  // PCM Routes
  "pcm-dashboard": {
    path: "pcm-dashboard",
    roles: [
      "superadmin",
      "admin",
      "committeeoftrustees",
     "boscontroller",
      "bosmembers",
      "coursemanagement",
      "tutormanagement",
      "usermanagement",
      "marketing",
    ],
  },
  "create-pcm-class": {
    path: "create-pcm-class",
    roles: [
      "superadmin",
      "admin",
      "committeeoftrustees",
      "coursemanagement",
    ],
  },
  "pcm-class-details": {
    path: "pcm-class-details",
    roles: [
      "superadmin",
      "admin",
      "committeeoftrustees",
      "coursemanagement",
    ],
  },
  "pcm-subjects": {
    path: "pcm-subjects",
    roles: [
      "superadmin",
      "admin",
      "committeeoftrustees",
      "coursemanagement",
    ],
  },

  // Blog Routes
  "blog-management": {
    path: "blog-management",
    roles: ["superadmin", "admin", "committeeoftrustees", "marketing"],
  },
  blogs: {
    path: "blogs",
    roles: [
      "superadmin",
      "admin",
      "committeeoftrustees",
      "boscontroller",
      "bosmembers",
      "coursemanagement",
      "tutormanagement",
      "usermanagement",
      "marketing",
      "tutor",
    ],
  },

  //tutor dashboard
  "tutor-data-management": {
    path: "tutor-data-management",
    roles: ["superadmin", "admin", "committeeoftrustees", "tutormanagement"],
  },

  // Financial Management Routes
  "financial-auditing": {
    path: "financial-auditing",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "donation-new": {
    path: "donation/new",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "donation-edit": {
    path: "donation/edit/:donationId",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "donation-detail": {
    path: "donation/:donationId",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "expense-new": {
    path: "expense/new",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "expense-edit": {
    path: "expense/edit/:expenseId",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "expense-detail": {
    path: "expense/:expenseId",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
    "direct-meet-fees-AUD": {
    path: "direct-meet-fees-AUD",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "monthly-fees-AUD": {
    path: "monthly-fees-AUD",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "payment-records-AUD": {
    path: "payment-records-AUD",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "invoice-detail": {
    path: "invoice/:invoiceNumber",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
  "auditor-invoice-detail": {
    path: "auditor/invoice/:invoiceNumber",
    roles: ["superadmin", "admin", "committeeoftrustees", "auditor"],
  },
};


export const canAccessRoute = (role, routeKey) => {
  const routeConfig = routeAccessConfig[routeKey];
  if (!routeConfig) return false;
  return hasAccess(role, routeConfig.roles);
};


export const getAccessibleRoutes = (role) => {
  const accessible = {};
  Object.entries(routeAccessConfig).forEach(([key, config]) => {
    if (hasAccess(role, config.roles)) {
      accessible[key] = config;
    }
  });
  return accessible;
};


export const ProtectedRoute = ({ element, routeKey }) => {
  const { canAccessRoute, role } = useDynamicRBAC();

  // Get fallback roles from config (for when DB not seeded)
  const routeConfig = routeAccessConfig[routeKey];
  const fallbackRoles = routeConfig?.roles || [];

  // Check access: primary = DB dynamic, fallback = hardcoded
  if (!canAccessRoute(routeKey, fallbackRoles)) {
    return <AccessDeniedFallback routeKey={routeKey} userRole={role} />;
  }

  return element;
};


export const AccessDeniedFallback = ({ routeKey, userRole }) => {
  const routeConfig = routeAccessConfig[routeKey];
  const allowedRoles = routeConfig?.roles || [];

  return (
    <div
      style={{
        padding: "3rem 2rem",
        textAlign: "center",
        color: "#ef4444",
        fontSize: "1.2rem",
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div>
        <h2
          style={{ fontSize: "2rem", marginBottom: "1rem", color: "#dc2626" }}
        >
          Access Denied
        </h2>
        <p
          style={{ fontSize: "1rem", marginBottom: "1.5rem", color: "#6b7280" }}
        >
          You don't have permission to access this page.
        </p>
        <div
          style={{
            backgroundColor: "#fef2f2",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            border: "1px solid #fee2e2",
          }}
        >
          <p
            style={{
              color: "#991b1b",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
            }}
          >
            <strong>Required roles:</strong>
          </p>
          <p style={{ color: "#7f1d1d", fontSize: "0.85rem" }}>
            {allowedRoles.map((r) => getRoleDisplayName(r)).join(", ")}
          </p>
          <p
            style={{
              color: "#7f1d1d",
              fontSize: "0.85rem",
              marginTop: "0.5rem",
              borderTop: "1px solid #fecaca",
              paddingTop: "0.5rem",
            }}
          >
            <strong>Your role:</strong> {getRoleDisplayName(userRole)}
          </p>
        </div>
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          Please contact your administrator if you believe this is an error.
        </p>
      </div>
    </div>
  );
};

export default ProtectedRoute;
