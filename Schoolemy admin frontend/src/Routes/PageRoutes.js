// DashboardContent
import React from "react";
import { Routes, Route } from "react-router-dom";
import DefaultDashboard from "../Components/Dashboard/DashboardWithData";
import { ProtectedRoute } from "./ProtectedRoutes";

//Sidebar routes
import Admin from "../Components/Pages/COT-dashboard/A-COT-dashboard";
import Course from "../Components/Pages/Course-dashboard/Course-dashboard";

// Admin - COT
import Admincreate from "../Components/Pages/COT-dashboard/CreateAdmin";
import AdminDetails from "../Components/Pages/COT-dashboard/Admindetail";
import Adminanalytics from "../Components/Pages/COT-dashboard/Analyticsadmin";
import Profile from "../Components/Dashboard/Profile";

//user
import Userdashboard from "../Components/Pages/User-dashboard/A-user-dashboard";
import UserDetails from "../Components/Pages/User-dashboard/Alluser-details";
import Payment from "../Components/Pages/User-dashboard/Paymentdetails";
import EmiDetails from "../Components/Pages/User-dashboard/Emi-details";
import UserLoginStatus from "../Components/Pages/User-dashboard/User-loginstatus";
import Studentdoc from "../Components/Pages/User-dashboard/StudentUploadeddoc";

// User Landing Page
import UserLandingPage from "../Components/Pages/User-Landingpage/Home";
import TopBannerSection from "../Components/Pages/User-Landingpage/TopBannerSection";
import HeroSection from "../Components/Pages/User-Landingpage/HeroSection";
import WhyChooseUsSection from "../Components/Pages/User-Landingpage/WhyChooseUsSection";
import CoursesSection from "../Components/Pages/User-Landingpage/CoursesSection";
import CategorySection from "../Components/Pages/User-Landingpage/CategorySection";
import WhatWeOfferSection from "../Components/Pages/User-Landingpage/WhatWeOfferSection";
import DemoVideoSection from "../Components/Pages/User-Landingpage/DemoVideoSection";
import FeedbackSection from "../Components/Pages/User-Landingpage/FeedbackSection";
import CtaSection from "../Components/Pages/User-Landingpage/CtaSection";

// Courses
import Createcourses from "../Components/Pages/Course-dashboard/Course/Createcourses";
import CourseName from "../Components/Pages/Course-dashboard/Course/Viewcourse1";
import Coursedetails from "../Components/Pages/Course-dashboard/Course/Viewcourse2";
import Editcourse from "../Components/Pages/Course-dashboard/Course/Viewcourseedit3";
import Quectionuplode from "../Components/Pages/Course-dashboard/Question/Questionuplode";
import Quectionpapaer from "../Components/Pages/Course-dashboard/Question/Questionpages";
import Coursebycatagery from "../Components/Pages/Course-dashboard/Course/Coursecatagery";
// Exam Answer Management
import ExamAnswerManagement from "../Components/Pages/User-dashboard/Examanswer/ExamAnswerManagement";
import ExamAnswerDashboard from "../Components/Pages/User-dashboard/Examanswer/ExamAnswerDashboard";
import UserExamStats from "../Components/Pages/User-dashboard/Examanswer/UserExamStats";
import CourseExamAnalytics from "../Components/Pages/User-dashboard/Examanswer/CourseExamAnalytics";
// BOS
import BOSdashboard from "../Components/Pages/BOS-dashboard/A-BOS-dashboard";
import BOSMembers from "../Components/Pages/BOS-dashboard/BOS-Members";
import BOSMeeting from "../Components/Pages/BOS-dashboard/BOS-Meeting";
import CourseProposalForm from "../Components/Pages/BOS-dashboard/CourseProposalForm";
import Coursedata from "../Components/Pages/BOS-dashboard/CourseProposal-data";
import CreateDecisionForm from "../Components/Pages/BOS-dashboard/uplodeRecentDecisions";
import DecisionsList from "../Components/Pages/BOS-dashboard/DecisionsList";
import CreateBOSMeeting from "../Components/Pages/BOS-dashboard/CreateMoM";
import ViewBOSMeeting from "../Components/Pages/BOS-dashboard/ViewMoM";
import AssignTask from "../Components/Pages/BOS-dashboard/AssignTask";
import TaskManagement from "../Components/Pages/BOS-dashboard/TaskManagement";

// Datamaintance
import Datamaintance from "../Components/Pages/Data-Maintenance/A-Data-dashboard";
import CourseCompletion from "../Components/Pages/Data-Maintenance/Course-Completion-Certificate";
import CertificatesVerification from "../Components/Pages/Data-Maintenance/certificates-verification";
import ExamMarkRecords from "../Components/Pages/Data-Maintenance/ExamMarkRecordsSystem";
import StaffDetailsManagement from "../Components/Pages/Data-Maintenance/Staff-Management";
import StudentComplaintRecords from "../Components/Pages/Data-Maintenance/StudentComplaint";
import StudentInfo from "../Components/Pages/Data-Maintenance/studentinfo";
import InstructorManagement from "../Components/Pages/Data-Maintenance/Instructor-Management";

// Course-based Meet Management (NEW SYSTEM)
import CreateCourseMeet from "../Components/Pages/DirectMeet-Management/CreateCourseMeet";
import ViewCourseMeets from "../Components/Pages/DirectMeet-Management/ViewCourseMeets";
// import CourseMeetAttendance from "../Components/Pages/DirectMeet-Management/CourseMeetAttendance";
import MeetDetailsView from "../Components/Pages/DirectMeet-Management/MeetDetailsView";
import MeetAttendance from "../Components/Pages/DirectMeet-Management/MeetAttendance";
import MeetMaterials from "../Components/Pages/DirectMeet-Management/MeetMaterials";

// Marketing-dashboard
import MarketingDashboard from "../Components/Pages/Marketing-dashboard/A-MarketingDashboard";
// document-verification
import DocumentVerificationDashboard from "../Components/Pages/Document-Verification/Document-Verification";
// certificate-maintenance
import CertificateMaintenanceDashboard from "../Components/Pages/Certificate-Maintenance/Certificate-Maintenance";
// vote
import VotingSystemDemo from "../Components/Pages/Voting-Dashboard/VotingSystemDemo";
import VoteDashboard from "../Components/Pages/Voting-Dashboard/A-Voting-Dashboard";
import CreateVoteSystem from "../Components/Pages/Voting-Dashboard/CreateVoteSystem";
import PollingSystem from "../Components/Pages/Voting-Dashboard/PollingSystem";
import ResultsDashboard from "../Components/Pages/Voting-Dashboard/ResultsDashboard";
import TotalVoteSystem from "../Components/Pages/Voting-Dashboard/TotalVoteSystem";
import LiveResultsDashboard from "../Components/Pages/Voting-Dashboard/LiveResultsDashboard";
// notifications
import NotificationDashboard from "../Components/Pages/Notification-Dashboard/Notification-Dashboard";
// feedback
import FeedbackDashboard from "../Components/Pages/Feedback-Dashboard/Feedback-Dashboard";
import CreateAnnouncement from "../Components/Pages/Marketing-dashboard/CreateAnnouncement";
import CreateAdvertisement from "../Components/Pages/Marketing-dashboard/CreateAdvertisement";
import CreateNotification from "../Components/Pages/Marketing-dashboard/CreateNotification";
import CourseListPage from "../Components/Pages/Data-Maintenance/CourseListPage";

// Tutor Management
import TutorTermsAndConditions from "../Components/Dashboard/Tutorterms&conditions";
import LandingPage from "../Components/Dashboard/Tutordashboard";
import TutorDashboard from "../Components/Tutor/Dashboard/Tutormainboard";
import CourseUpload from "../Components/Tutor/Courses/CourseUpload";
import CourseNametutor from "../Components/Tutor/Courses/Viewcourse1";
import Coursedetailstutor from "../Components/Tutor/Courses/Viewcourse2";
import Editcoursetutor from "../Components/Tutor/Courses/Viewcourseedit3";

// Tutor Data Management
import TutorDataDashboard from "../Components/Pages/TutorDataManagement/A-tutor-Dashboard";
import Tutorcreate from "../Components/Pages/TutorDataManagement/Tutorpages/Createtutor";
import Tutorsdata from "../Components/Pages/TutorDataManagement/Tutorpages/Tutordetails";
import Tutoranalytics from "../Components/Pages/TutorDataManagement/Tutorpages/Analyticstutor";
import TutorRevenue from "../Components/Tutor/Payment/Tutor-revenue";
import TutorList from "../Components/Pages/TutorDataManagement/Tutorcourses/Tutorlist";
import TutorCoursesView from "../Components/Pages/TutorDataManagement/Tutorcourses/TutorCoursesView";
import TutorCourseDetail from "../Components/Pages/TutorDataManagement/Tutorcourses/TutorCourseDetail";
import TutorCourseReview from "../Components/Pages/TutorDataManagement/Tutorcourses/TutorCourseReview";
import TutorPaymentList from "../Components/Pages/TutorDataManagement/TutorPayment/Tutorslist";
import TutorPaymentCourses from "../Components/Pages/TutorDataManagement/TutorPayment/TutorPaymentCourses";
import TutorCoursePayments from "../Components/Pages/TutorDataManagement/TutorPayment/TutorCoursePayments";
import Paymenthistory from "../Components/Pages/TutorDataManagement/TutorPayment/Paymenthistory";
import TutorCommissionDue from "../Components/Pages/TutorDataManagement/TutorPayment/TutorCommissionDue";

// PCM Routes
import PCMRoutes from "../Components/Pages/PCM-Classes/A-PCM-Dashboard";
import CreatePCM from "../Components/Pages/PCM-Classes/Create-class";
import PCMclassDetails from "../Components/Pages/PCM-Classes/PCM-class-details";

// Blog Management Routes
import BlogManagement from "../Components/Pages/Blog/BlogManagement";
import BlogList from "../Components/Pages/Blog/BlogList";

// Event Management
import EventList from "../Components/Pages/Event-Management/EventList";
import EventDetail from "../Components/Pages/Event-Management/EventDetail";
import EventForm from "../Components/Pages/Event-Management/EventForm";

// Financial Management
import FinancialAuditingScreen from "../Components/Pages/Financial/FinancialAuditingScreen";
import DonationForm from "../Components/Pages/Financial/DonationForm";
import DonationDetail from "../Components/Pages/Financial/DonationDetail";
import ExpenseForm from "../Components/Pages/Financial/ExpenseForm";
import ExpenseDetail from "../Components/Pages/Financial/ExpenseDetail";
import InvoiceDetail from "../Components/Pages/Financial/invoice";
import TokenDebug from "../Components/Pages/Financial/TokenDebug";
import FinancialDashboard from "../Components/Pages/Financial-Epn/Financial";
import WrappedDirectMeetFeesManagement from "../Components/Pages/Financial/DirectMeetFeesManagement";
import MonthlyFeesManagementAUD from "../Components/Pages/Financial/Monthlyfees-Record";
import PaymentRecordScreen from "../Components/Pages/Financial/PaymentRecordScreen";
import DirectMeetDashboard from "../Components/Pages/DirectMeet-Management/DirectMeet-Dashboard";

const PageRoutes = () => {
  return (
    <Routes>
      {/* Sidebar routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute element={<DefaultDashboard />} routeKey="dashboard" />
        }
      />
      <Route
        path="admin-users"
        element={<ProtectedRoute element={<Admin />} routeKey="admin-users" />}
      />
      <Route
        path="courses"
        element={<ProtectedRoute element={<Course />} routeKey="courses" />}
      />

      {/* Page routs Admin */}
      <Route
        path="create-admin"
        element={
          <ProtectedRoute element={<Admincreate />} routeKey="create-admin" />
        }
      />
      <Route
        path="admin-details"
        element={
          <ProtectedRoute element={<AdminDetails />} routeKey="admin-details" />
        }
      />
      <Route
        path="admin-analytics"
        element={
          <ProtectedRoute
            element={<Adminanalytics />}
            routeKey="admin-analytics"
          />
        }
      />
      <Route
        path="profile"
        element={<ProtectedRoute element={<Profile />} routeKey="profile" />}
      />

      {/* Page routs User */}
      <Route
        path="users"
        element={
          <ProtectedRoute element={<Userdashboard />} routeKey="users" />
        }
      />
      <Route
        path="user-details"
        element={
          <ProtectedRoute element={<UserDetails />} routeKey="user-details" />
        }
      />
      <Route
        path="Payment-record"
        element={
          <ProtectedRoute element={<Payment />} routeKey="Payment-record" />
        }
      />
      <Route
        path="emi-details"
        element={
          <ProtectedRoute element={<EmiDetails />} routeKey="emi-details" />
        }
      />
      <Route
        path="login-status"
        element={
          <ProtectedRoute
            element={<UserLoginStatus />}
            routeKey="login-status"
          />
        }
      />
      <Route
        path="student-documents"
        element={
          <ProtectedRoute
            element={<Studentdoc />}
            routeKey="student-documents"
          />
        }
      />

      {/* Page routes Courses */}
      <Route
        path="add-course"
        element={
          <ProtectedRoute element={<Createcourses />} routeKey="add-course" />
        }
      />
      <Route
        path="course-list"
        element={
          <ProtectedRoute element={<CourseName />} routeKey="course-list" />
        }
      />
      <Route
        path="course-list/:coursename"
        element={
          <ProtectedRoute
            element={<Coursedetails />}
            routeKey="course-details"
          />
        }
      />
      <Route
        path="edit-course/:coursename"
        element={
          <ProtectedRoute element={<Editcourse />} routeKey="edit-course" />
        }
      />
      <Route
        path="view-courses-by-category"
        element={
          <ProtectedRoute
            element={<Coursebycatagery />}
            routeKey="view-courses-by-category"
          />
        }
      />

      {/* BOS Routes */}
      <Route
        path="add-question-paper"
        element={
          <ProtectedRoute
            element={<Quectionuplode />}
            routeKey="add-question-paper"
          />
        }
      />
      <Route
        path="view-question-papers"
        element={
          <ProtectedRoute
            element={<Quectionpapaer />}
            routeKey="view-question-papers"
          />
        }
      />

      {/* Exam Answer Management Routes */}
      <Route
        path="exam-answers"
        element={
          <ProtectedRoute
            element={<ExamAnswerManagement />}
            routeKey="exam-answers"
          />
        }
      />
      <Route
        path="exam-dashboard"
        element={
          <ProtectedRoute
            element={<ExamAnswerDashboard />}
            routeKey="exam-dashboard"
          />
        }
      />
      <Route
        path="student-stats"
        element={
          <ProtectedRoute
            element={<UserExamStats />}
            routeKey="student-stats"
          />
        }
      />
      <Route
        path="course-analytics"
        element={
          <ProtectedRoute
            element={<CourseExamAnalytics />}
            routeKey="course-analytics"
          />
        }
      />

      {/* Page routes BOS */}
      <Route
        path="bos"
        element={<ProtectedRoute element={<BOSdashboard />} routeKey="bos" />}
      />
      <Route
        path="bos-members"
        element={
          <ProtectedRoute element={<BOSMembers />} routeKey="bos-members" />
        }
      />
      <Route
        path="create-meeting"
        element={
          <ProtectedRoute element={<BOSMeeting />} routeKey="create-meeting" />
        }
      />
      <Route
        path="submit-course-proposal"
        element={
          <ProtectedRoute
            element={<CourseProposalForm />}
            routeKey="submit-course-proposal"
          />
        }
      />
      <Route
        path="pending-proposals"
        element={
          <ProtectedRoute
            element={<Coursedata showApproveReject={false} />}
            routeKey="pending-proposals"
          />
        }
      />
      <Route
        path="cot-course-proposals"
        element={
          <ProtectedRoute
            element={<Coursedata showApproveReject />}
            routeKey="cot-course-proposals"
          />
        }
      />
      <Route
        path="create-decision"
        element={
          <ProtectedRoute
            element={<CreateDecisionForm />}
            routeKey="create-decision"
          />
        }
      />
      <Route
        path="recent-decision"
        element={
          <ProtectedRoute
            element={<DecisionsList showApproveReject={false} />}
            routeKey="recent-decision"
          />
        }
      />
      <Route
        path="cot-decision-list"
        element={
          <ProtectedRoute
            element={<DecisionsList showApproveReject />}
            routeKey="cot-decision-list"
          />
        }
      />
      <Route
        path="create-bos-meeting"
        element={
          <ProtectedRoute
            element={<CreateBOSMeeting />}
            routeKey="create-bos-meeting"
          />
        }
      />
      <Route
        path="view-bos-meeting"
        element={
          <ProtectedRoute
            element={<ViewBOSMeeting />}
            routeKey="view-bos-meeting"
          />
        }
      />
      <Route
        path="assign-task"
        element={
          <ProtectedRoute element={<AssignTask />} routeKey="assign-task" />
        }
      />
      <Route
        path="task-status"
        element={
          <ProtectedRoute element={<TaskManagement />} routeKey="task-status" />
        }
      />

      {/* Page routes Datamaintance */}
      <Route
        path="data-maintenance"
        element={
          <ProtectedRoute
            element={<Datamaintance />}
            routeKey="data-maintenance"
          />
        }
      />
      <Route
        path="Financial"
        element={
          <ProtectedRoute
            element={<FinancialDashboard />}
            routeKey="Financial"
          />
        }
      />
      <Route
        path="completion-certificates"
        element={
          <ProtectedRoute
            element={<CourseCompletion />}
            routeKey="completion-certificates"
          />
        }
      />
      <Route
        path="certificates-verification"
        element={
          <ProtectedRoute
            element={<CertificatesVerification />}
            routeKey="certificates-verification"
          />
        }
      />
      <Route
        path="exam-marks-records"
        element={
          <ProtectedRoute
            element={<ExamMarkRecords />}
            routeKey="exam-marks-records"
          />
        }
      />
      <Route
        path="staff-management"
        element={
          <ProtectedRoute
            element={<StaffDetailsManagement />}
            routeKey="staff-management"
          />
        }
      />
      <Route
        path="instructors-management"
        element={
          <ProtectedRoute
            element={<InstructorManagement />}
            routeKey="instructors-management"
          />
        }
      />
      <Route
        path="student-complaints"
        element={
          <ProtectedRoute
            element={<StudentComplaintRecords />}
            routeKey="student-complaints"
          />
        }
      />
      <Route
        path="student-details-management"
        element={
          <ProtectedRoute
            element={<StudentInfo />}
            routeKey="student-details-management"
          />
        }
      />

      {/* Course-based Meet Management (NEW SYSTEM) */}
      {/* DirectMeet Course-Based Management */}
      <Route
        path="create-course-meet"
        element={
          <ProtectedRoute
            element={<CreateCourseMeet />}
            routeKey="create-course-meet"
          />
        }
      />
      <Route
        path="edit-course-meet/:id"
        element={
          <ProtectedRoute
            element={<CreateCourseMeet />}
            routeKey="edit-course-meet/:id"
          />
        }
      />
      <Route
        path="course-meets"
        element={
          <ProtectedRoute
            element={<ViewCourseMeets />}
            routeKey="course-meets"
          />
        }
      />
      <Route
        path="course-meet-details/:id"
        element={
          <ProtectedRoute
            element={<MeetDetailsView />}
            routeKey="course-meet-details/:id"
          />
        }
      />
      <Route
        path="course-meet-attendance/:id"
        element={
          <ProtectedRoute
            element={<MeetAttendance />}
            routeKey="course-meet-attendance/:id"
          />
        }
      />
      <Route
        path="course-meet-materials/:id"
        element={
          <ProtectedRoute
            element={<MeetMaterials />}
            routeKey="course-meet-materials/:id"
          />
        }
      />
      <Route
        path="DM_Dashboard"
        element={
          <ProtectedRoute
            element={<DirectMeetDashboard />}
            routeKey="DM_Dashboard"
          />
        }
      />

      {/* Page routes Marketing-dashboard */}
      <Route
        path="marketing-dashboard"
        element={
          <ProtectedRoute
            element={<MarketingDashboard />}
            routeKey="marketing-dashboard"
          />
        }
      />

      {/* Page routes document-verification */}
      <Route
        path="document-verification"
        element={
          <ProtectedRoute
            element={<DocumentVerificationDashboard />}
            routeKey="document-verification"
          />
        }
      />

      {/* Page routes certificate-maintenance */}
      <Route
        path="certificate-maintenance"
        element={
          <ProtectedRoute
            element={<CertificateMaintenanceDashboard />}
            routeKey="certificate-maintenance"
          />
        }
      />
      <Route
        path="practice-class-list"
        element={
          <ProtectedRoute
            element={<CourseListPage />}
            routeKey="practice-class-list"
          />
        }
      />

      {/* Page routes vote */}
      <Route
        path="demo"
        element={
          <ProtectedRoute element={<VotingSystemDemo />} routeKey="vote-demo" />
        }
      />
      <Route
        path="vote"
        element={<ProtectedRoute element={<VoteDashboard />} routeKey="vote" />}
      />
      <Route
        path="create"
        element={
          <ProtectedRoute
            element={<CreateVoteSystem />}
            routeKey="vote-create"
          />
        }
      />
      <Route
        path="polling"
        element={
          <ProtectedRoute element={<PollingSystem />} routeKey="polling" />
        }
      />
      <Route
        path="results"
        element={
          <ProtectedRoute element={<ResultsDashboard />} routeKey="results" />
        }
      />
      <Route
        path="total"
        element={
          <ProtectedRoute element={<TotalVoteSystem />} routeKey="total" />
        }
      />
      <Route
        path="live-results"
        element={
          <ProtectedRoute
            element={<LiveResultsDashboard />}
            routeKey="live-results"
          />
        }
      />
      {/* Page routes notifications */}
      <Route
        path="notifications"
        element={
          <ProtectedRoute
            element={<NotificationDashboard />}
            routeKey="notifications"
          />
        }
      />

      {/* Page routes feedback */}
      <Route
        path="feedback"
        element={
          <ProtectedRoute element={<FeedbackDashboard />} routeKey="feedback" />
        }
      />

      {/* User Landing Page */}
      <Route
        path="user-landing-page"
        element={
          <ProtectedRoute
            element={<UserLandingPage />}
            routeKey="user-landing-page"
          />
        }
      />
      <Route
        path="top-banner"
        element={
          <ProtectedRoute
            element={<TopBannerSection />}
            routeKey="user-landing-page"
          />
        }
      />
      <Route
        path="hero"
        element={
          <ProtectedRoute
            element={<HeroSection />}
            routeKey="user-landing-page"
          />
        }
      />
      <Route
        path="why-choose-us"
        element={
          <ProtectedRoute
            element={<WhyChooseUsSection />}
            routeKey="user-landing-page"
          />
        }
      />
      <Route
        path="landing-courses"
        element={
          <ProtectedRoute
            element={<CoursesSection />}
            routeKey="user-landing-page"
          />
        }
      />
      <Route
        path="category"
        element={
          <ProtectedRoute
            element={<CategorySection />}
            routeKey="user-landing-page"
          />
        }
      />
      <Route
        path="what-we-offer"
        element={
          <ProtectedRoute
            element={<WhatWeOfferSection />}
            routeKey="user-landing-page"
          />
        }
      />
      <Route
        path="demo-video"
        element={
          <ProtectedRoute
            element={<DemoVideoSection />}
            routeKey="user-landing-page"
          />
        }
      />
      <Route
        path="landing-feedback"
        element={
          <ProtectedRoute
            element={<FeedbackSection />}
            routeKey="user-landing-page"
          />
        }
      />
      <Route
        path="cta"
        element={
          <ProtectedRoute
            element={<CtaSection />}
            routeKey="user-landing-page"
          />
        }
      />

      {/*page route - marketing */}
      <Route
        path="marketing-dashboard"
        element={
          <ProtectedRoute
            element={<MarketingDashboard />}
            routeKey="marketing-dashboard"
          />
        }
      />
      <Route
        path="marketing/create-announcement"
        element={
          <ProtectedRoute
            element={<CreateAnnouncement />}
            routeKey="marketing-create-announcement"
          />
        }
      />
      <Route
        path="marketing/create-advertisement"
        element={
          <ProtectedRoute
            element={<CreateAdvertisement />}
            routeKey="marketing-create-advertisement"
          />
        }
      />
      <Route
        path="marketing/create-notification"
        element={
          <ProtectedRoute
            element={<CreateNotification />}
            routeKey="marketing-create-notification"
          />
        }
      />

      {/* Tutor Management Routes */}
      <Route
        path="tutor-terms-and-conditions"
        element={
          <ProtectedRoute
            element={<TutorTermsAndConditions />}
            routeKey="tutor-terms-and-conditions"
          />
        }
      />
      <Route
        path="tutor/dashboard"
        element={
          <ProtectedRoute
            element={<LandingPage />}
            routeKey="tutor-dashboard"
          />
        }
      />
      <Route
        path="tutors-management"
        element={
          <ProtectedRoute
            element={<TutorDashboard />}
            routeKey="tutors-management"
          />
        }
      />
      <Route
        path="tutor-upload-course"
        element={
          <ProtectedRoute
            element={<CourseUpload />}
            routeKey="tutor-upload-course"
          />
        }
      />
      <Route
        path="tutor-course-list"
        element={
          <ProtectedRoute
            element={<CourseNametutor />}
            routeKey="tutor-course-list"
          />
        }
      />
      <Route
        path="tutor-course-list/:coursename"
        element={
          <ProtectedRoute
            element={<Coursedetailstutor />}
            routeKey="tutor-course-details"
          />
        }
      />
      <Route
        path="tutor-edit-course/:coursename"
        element={
          <ProtectedRoute
            element={<Editcoursetutor />}
            routeKey="tutor-edit-course"
          />
        }
      />
      <Route
        path="tutor-revenue"
        element={
          <ProtectedRoute element={<TutorRevenue />} routeKey="tutor-revenue" />
        }
      />

      {/* Tutor Data Management Routes */}
      <Route
        path="tutor-data-management"
        element={
          <ProtectedRoute
            element={<TutorDataDashboard />}
            routeKey="tutor-data-management"
          />
        }
      />
      <Route
        path="create-tutors"
        element={
          <ProtectedRoute element={<Tutorcreate />} routeKey="create-tutors" />
        }
      />
      {/* editing existing tutor reuses same permission as creation */}
      <Route
        path="create-tutors/:tutorId"
        element={
          <ProtectedRoute element={<Tutorcreate />} routeKey="create-tutors" />
        }
      />
      <Route
        path="tutor-details"
        element={
          <ProtectedRoute element={<Tutorsdata />} routeKey="tutor-details" />
        }
      />
      <Route
        path="tutor-analytics"
        element={
          <ProtectedRoute
            element={<Tutoranalytics />}
            routeKey="tutor-analytics"
          />
        }
      />
      <Route
        path="tutor-list"
        element={
          <ProtectedRoute element={<TutorList />} routeKey="tutor-list" />
        }
      />
      <Route
        path="tutor-courses/:tutorname"
        element={
          <ProtectedRoute
            element={<TutorCoursesView />}
            routeKey="tutor-courses"
          />
        }
      />
      <Route
        path="tutor-course-detail/:coursename"
        element={
          <ProtectedRoute
            element={<TutorCourseDetail />}
            routeKey="tutor-course-detail"
          />
        }
      />
      <Route
        path="tutor-course-review"
        element={
          <ProtectedRoute
            element={<TutorCourseReview />}
            routeKey="tutor-course-review"
          />
        }
      />
      <Route
        path="tutor-payment-details"
        element={
          <ProtectedRoute
            element={<TutorPaymentList />}
            routeKey="tutor-payment-details"
          />
        }
      />
      <Route
        path="getcourses-tutors/:tutorname"
        element={
          <ProtectedRoute
            element={<TutorPaymentCourses />}
            routeKey="getcourses-tutors"
          />
        }
      />
      <Route
        path="tutor-course-payments"
        element={
          <ProtectedRoute
            element={<TutorCoursePayments />}
            routeKey="tutor-course-payments"
          />
        }
      />
      <Route
        path="tutor-payment-history"
        element={
          <ProtectedRoute
            element={<Paymenthistory />}
            routeKey="tutor-payment-history"
          />
        }
      />
      <Route
        path="tutor-commission-due"
        element={
          <ProtectedRoute
            element={<TutorCommissionDue />}
            routeKey="tutor-commission-due"
          />
        }
      />

      {/* PCM Routes */}
      <Route
        path="pcm-dashboard"
        element={
          <ProtectedRoute element={<PCMRoutes />} routeKey="pcm-dashboard" />
        }
      />
      <Route
        path="create-pcm-class"
        element={
          <ProtectedRoute element={<CreatePCM />} routeKey="create-pcm-class" />
        }
      />
      <Route
        path="pcm-class-details"
        element={
          <ProtectedRoute
            element={<PCMclassDetails />}
            routeKey="pcm-class-details"
          />
        }
      />

      {/* Blog Management (Admin Only) */}
      <Route
        path="blog-management"
        element={
          <ProtectedRoute
            element={<BlogManagement />}
            routeKey="blog-management"
          />
        }
      />

      {/* Public Blog Routes */}
      <Route
        path="blogs"
        element={<ProtectedRoute element={<BlogList />} routeKey="blogs" />}
      />

      {/* Event Management */}
      <Route path="events" element={<EventList />} />
      <Route path="events/create" element={<EventForm />} />
      <Route path="events/edit/:eventId" element={<EventForm />} />
      <Route path="edit/:eventId" element={<EventForm />} />
      <Route path="events/:eventId" element={<EventDetail />} />

      {/* Financial Management - Donations & Expenses */}
      <Route
        path="financial-auditing"
        element={
          <ProtectedRoute
            element={<FinancialAuditingScreen />}
            routeKey="financial-auditing"
          />
        }
      />
      <Route
        path="donation/new"
        element={
          <ProtectedRoute element={<DonationForm />} routeKey="donation-new" />
        }
      />
      <Route
        path="donation/edit/:donationId"
        element={
          <ProtectedRoute element={<DonationForm />} routeKey="donation-edit" />
        }
      />
      <Route
        path="donation/:donationId"
        element={
          <ProtectedRoute
            element={<DonationDetail />}
            routeKey="donation-detail"
          />
        }
      />
      <Route
        path="expense/new"
        element={
          <ProtectedRoute element={<ExpenseForm />} routeKey="expense-new" />
        }
      />
      <Route
        path="expense/edit/:expenseId"
        element={
          <ProtectedRoute element={<ExpenseForm />} routeKey="expense-edit" />
        }
      />
      <Route
        path="expense/:expenseId"
        element={
          <ProtectedRoute
            element={<ExpenseDetail />}
            routeKey="expense-detail"
          />
        }
      />
      <Route
        path="invoice/:invoiceNumber"
        element={
          <ProtectedRoute
            element={<InvoiceDetail />}
            routeKey="invoice-detail"
          />
        }
      />
      <Route
        path="auditor/invoice/:invoiceNumber"
        element={
          <ProtectedRoute
            element={<InvoiceDetail />}
            routeKey="auditor-invoice-detail"
          />
        }
      />
      <Route
        path="direct-meet-fees-AUD"
        element={
          <ProtectedRoute
            element={<WrappedDirectMeetFeesManagement />}
            routeKey="direct-meet-fees-AUD"
          />
        }
      />
      <Route
        path="monthly-fees-AUD"
        element={
          <ProtectedRoute
            element={<MonthlyFeesManagementAUD />}
            routeKey="monthly-fees-AUD"
          />
        }
      />
      <Route
        path="payment-records-AUD"
        element={
          <ProtectedRoute
            element={<PaymentRecordScreen />}
            routeKey="payment-records-AUD"
          />
        }
      />
      <Route path="token-debug" element={<TokenDebug />} />
    </Routes>
  );
};

export default PageRoutes;
