import { Routes, Route } from "react-router-dom";
import RedirectToAuthModal from "./components/auth/RedirectToAuthModal";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/common/ErrorBoundary";

import Layout from "./pages/Homepage/Layout.js";
import HomePageContent from "./pages/Homepage/HomePageContent.js";
import MainDashBoard from "./pages/Dashboard/MainDashBoard.js";
import ProfilePage from "./pages/Dashboard/Porfile.js";
import CourseGrid from "./pages/Course/CourseGrid.js";
import CourseContent from "./pages/Course/CourseContent.js";
import EMIPaymentPage from "./pages/Course/EMIPaymentPage.js";
import PaymentPage from "./pages/Payment/Payment.js";
import PaymentPages from "./pages/Payment/User-Paymentpage.js";
import PaymentCallback from "./pages/Payment/PaymentCallback.js";
import CoursePage from "./pages/Course/CourseDetail.js";
// import CourseUpload from "./pages/Course-Upload/Course-Upload.js";
// import CourseManagement from "./pages/Course-Upload/CourseManagement.js";
// import CourseUpdate from "./pages/Course-Upload/Course-Update.js";

import ExamRecord from "./pages/Dashboard/ExamRecord.js";
import PurchasedCourses from "./pages/Dashboard/LessonStatus.js";
import TermsConditions from "./pages/Homepage/TermsConditions.js";
import PrivacyPolicy from "./pages/Homepage/PrivacyPolicy.js";
import CategoryCourses from "./pages/Course/CategoryCourses.js";
import Resources from "./components/Homepage/Resources.js";
import BlogList from "./pages/Homepage/BlogList.js";
import BlogDetail from "./pages/Homepage/BlogDetail.js";
import MyMaterials from "./pages/Dashboard/Practiceclassrecord.js";
import ContactUs from "./pages/Homepage/contactus.js";
import EventPage from "./pages/Homepage/eventpage.js";
import EventDetails from "./pages/Homepage/EventDetail.js";
import CookiePolicy from "./pages/Homepage/CookiePolicy.js";
import UserCourseMeets from "./components/DirectMeet/UserCourseMeets.js";
import UserMeetDetails from "./components/DirectMeet/UserMeetDetails.js";
import UserMeetMaterials from "./components/DirectMeet/UserMeetMaterials.js";
import UserNotifications from "./components/DirectMeet/UserNotifications.js";
import MeetPaymentCallback from "./components/DirectMeet/MeetPaymentCallback.js";
import Complaints from "./pages/Complaints.js";
import InvoiceList from "./components/Invoice/InvoiceList.js";
import InvoiceDetail from "./components/Invoice/InvoiceDetail.js";
import WishlistPage from "./pages/Wishlist/WishlistPage.jsx";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Auth uses Layout modals only — legacy paths redirect to home with ?auth= */}
        <Route path="/login" element={<RedirectToAuthModal auth="login" />} />
        <Route path="/signup" element={<RedirectToAuthModal auth="signup" />} />
        <Route path="/register" element={<RedirectToAuthModal auth="signup" />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />

        <Route path="/" element={<Layout />}>
          {/* SECURITY FIX 3.34.1: Wrap critical components in ErrorBoundary */}
          <Route path="Dashboard" element={<ErrorBoundary><MainDashBoard /></ErrorBoundary>} />
          <Route path="profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
          <Route index element={<HomePageContent />} />
          <Route path="course" element={<CourseGrid />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="course/:id" element={<CoursePage />} />
          <Route path="course/:id/content" element={<ErrorBoundary><CourseContent /></ErrorBoundary>} />
          <Route path="user/emi-payment/:courseId" element={<ErrorBoundary><EMIPaymentPage /></ErrorBoundary>} />
          <Route path="course/:courseId/payment" element={<ErrorBoundary><PaymentPage /></ErrorBoundary>} />
          <Route path="tutor-course/:id" element={<CoursePage />} />
          <Route path="tutor-course/:id/content" element={<ErrorBoundary><CourseContent /></ErrorBoundary>} />
          <Route path="user/payment/tutor-course/:courseId" element={<ErrorBoundary><PaymentPage /></ErrorBoundary>} />
          {/* SECURITY FIX 3.34.1: Wrap payment/financial pages in ErrorBoundary */}
          <Route path="user-payment" element={<ErrorBoundary><PaymentPages /></ErrorBoundary>} />
          <Route path="Examrecord" element={<ErrorBoundary><ExamRecord /></ErrorBoundary>} />
          <Route path="lesson-status" element={<ErrorBoundary><PurchasedCourses /></ErrorBoundary>} />
          <Route path="terms" element={<TermsConditions />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          {/* <Route path="admin/course-upload" element={<CourseUpload />} /> */}
          <Route path="courses/category/:categoryName" element={<CategoryCourses />} />
          <Route path="Resources" element={<Resources />} />
          <Route path="blogs" element={<BlogList />} />
          <Route path="blogs/:id" element={<BlogDetail />} />
          <Route path="practice" element={<MyMaterials />} />
          <Route path="contact" element={<ContactUs />} />
          <Route path="events" element={<EventPage />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="cookies" element={<CookiePolicy />} />
          {/* SECURITY FIX 3.34.1: Wrap meet/communication pages in ErrorBoundary */}
          <Route path="user/meets" element={<ErrorBoundary><UserCourseMeets/></ErrorBoundary>} />
          <Route path="user/meets/:id" element={<ErrorBoundary><UserMeetDetails/></ErrorBoundary>} />
          <Route path="user/meets/:id/materials" element={<ErrorBoundary><UserMeetMaterials/></ErrorBoundary>} />
          <Route path="user/meets/:id/payment-callback" element={<ErrorBoundary><MeetPaymentCallback/></ErrorBoundary>} />
          <Route path="user/notifications" element={<ErrorBoundary><UserNotifications /></ErrorBoundary>} />
          <Route path="complaints" element={<Complaints />} />
          {/* SECURITY FIX 3.34.1: Wrap invoice/financial pages in ErrorBoundary */}
          <Route path="user/invoices" element={<ErrorBoundary><InvoiceList /></ErrorBoundary>} />
          <Route path="user/invoice/:invoiceNumber" element={<ErrorBoundary><InvoiceDetail /></ErrorBoundary>} />


          {/* <Route
            path="/admin/course-management"
            element={<CourseManagement />}
          />
          <Route
            path="/admin/course-update/:courseId"
            element={<CourseUpdate />}
          /> */}
        </Route>
      </Routes>
    </>
  );
}

export default App;
