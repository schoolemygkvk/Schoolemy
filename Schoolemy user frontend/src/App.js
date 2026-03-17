import { Routes, Route } from "react-router-dom";
import LoginPage from "./components/page/LoginPage";
import SignupPage from "./components/page/SignupPage";
import ScrollToTop from "./components/ScrollToTop";

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

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Routes without layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />

        <Route path="/" element={<Layout />}>
          <Route path="Dashboard" element={<MainDashBoard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route index element={<HomePageContent />} />
          <Route path="course" element={<CourseGrid />} />
          <Route path="course/:id" element={<CoursePage />} />
          <Route path="course/:id/content" element={<CourseContent />} />
          <Route path="user/emi-payment/:courseId" element={<EMIPaymentPage />} />
          <Route path="course/:courseId/payment" element={<PaymentPage />} />
          <Route path="tutor-course/:id" element={<CoursePage />} />
          <Route path="tutor-course/:id/content" element={<CourseContent />} />
          <Route path="user/payment/tutor-course/:courseId" element={<PaymentPage />} />
          <Route path="user-payment" element={<PaymentPages />} />
          <Route path="Examrecord" element={<ExamRecord />} />
          <Route path="lesson-status" element={<PurchasedCourses />} />
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
          <Route path="user/meets" element={<UserCourseMeets/>} />
          <Route path="user/meets/:id" element={<UserMeetDetails/>} />
          <Route path="user/meets/:id/materials" element={<UserMeetMaterials/>} />
          <Route path="user/meets/:id/payment-callback" element={<MeetPaymentCallback/>} />
          <Route path="user/notifications" element={<UserNotifications />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="user/invoices" element={<InvoiceList />} />
          <Route path="user/invoice/:invoiceNumber" element={<InvoiceDetail />} />


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
