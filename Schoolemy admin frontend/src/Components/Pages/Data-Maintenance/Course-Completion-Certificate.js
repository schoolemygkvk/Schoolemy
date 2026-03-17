import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "../../../Utils/api";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import certificateTemplate from "../../../assets/irai-aram-certificate.jpg";

// Styled Components
const PageWrapper = styled.div`
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
`;

const BackButton = styled.button`
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Heading = styled.h2`
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;

  &::after {
    content: '';
    display: block;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #3498db, #9b59b6);
    margin-top: 0.5rem;
    border-radius: 2px;
  }
`;

const BreadcrumbNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 14px;
  color: #6c757d;
  flex-wrap: wrap;
`;

const BreadcrumbItem = styled.span`
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  color: ${props => props.active ? '#2c3e50' : '#6e8efb'};
  font-weight: ${props => props.active ? '600' : '400'};
  
  &:hover {
    color: ${props => props.clickable ? '#a777e3' : props.active ? '#2c3e50' : '#6e8efb'};
    text-decoration: ${props => props.clickable ? 'underline' : 'none'};
  }
`;

const BreadcrumbSeparator = styled.span`
  color: #6c757d;
`;

const SearchContainer = styled.div`
  position: relative;
  min-width: 250px;
`;

const SearchInput = styled.input`
  padding: 10px 15px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 25px;
  width: 100%;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #6e8efb;
    box-shadow: 0 0 0 3px rgba(110, 142, 251, 0.1);
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${props => props.minWidth || '250px'}, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: ${props => props.padding || '2rem'};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  cursor: pointer;
  text-align: center;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #6e8efb;
  }
`;

const CardIcon = styled.div`
  width: ${props => props.size || '80px'};
  height: ${props => props.size || '80px'};
  border-radius: ${props => props.square ? '12px' : '50%'};
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${props => props.fontSize || '36px'};
  font-weight: 600;
  margin: ${props => props.centered ? '0 auto 1rem' : '0 0 1rem 0'};
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: ${props => props.fontSize || '20px'};
  font-weight: 600;
`;

const CardSubtitle = styled.p`
  margin: 0;
  color: #6c757d;
  font-size: 14px;
`;

const UserCard = styled(Card)`
  text-align: left;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f8f9fa;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
`;

const UserDetail = styled.p`
  margin: 0.25rem 0;
  color: #6c757d;
  font-size: 14px;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-top: auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const CertificatePreview = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const CertificateContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CertificateCanvas = styled.div`
  position: relative;
  width: 100%;
  max-width: 1000px;
  aspect-ratio: 1.414;
  background-image: url(${certificateTemplate});
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  margin: 0 auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
`;

const CertificateOverlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
`;

const CertificateName = styled.div`
  position: absolute;
  top: 48%;
  left: 35%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  font-weight: bold;
  color: #000;
  text-align: center;
  width: 70%;
  font-family: 'Times New Roman', serif;
  letter-spacing: 1px;
`;

const CertificateCourseName = styled.div`
  position: absolute;
  top: 55%;
  left: 62%;
  font-size: 1.1rem;
  color: #000;
  font-family: 'Times New Roman', serif;
  font-weight: normal;
  text-align: left;
`;

const CertificateYear = styled.div`
  position: absolute;
  top: 63%;
  left: 18%;
  font-size: 1.3rem;
  color: #000;
  font-family: 'Times New Roman', serif;
  text-align: left;
`;

const CertificateRegNo = styled.div`
  position: absolute;
  top: 48.5%;
  left: 58%;
  transform: translateX(-50%);
  font-size:1.3rem;
  font-weight: bold;
  color: #000;
  font-family: 'Times New Roman', serif;
  font-weight: normal;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const CloseButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #e9ecef;
  color: #2c3e50;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #dee2e6;
  }
`;

const DownloadButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const LoadingText = styled.p`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-size: 18px;
`;

const NoResults = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-size: 16px;
  background: white;
  border-radius: 8px;
  grid-column: 1 / -1;
`;


const CourseCompletionCertificate = () => {
  const navigate = useNavigate();
  const certificateRef = useRef(null);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [viewLevel, setViewLevel] = useState('categories'); // 'categories', 'courses', 'users'
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data states
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Selection states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Certificate modal
  const [showCertificate, setShowCertificate] = useState(false);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get("/payments", { params: { limit: 10000 } });
      const paymentData = response.data.data;
      
      const categoryMap = new Map();
      const courseMap = new Map();
      
      paymentData.forEach(payment => {
        const user = payment.userId;
        const category = payment.courseId?.category;
        const courseName = payment.courseId?.coursename || payment.courseName;
        
        if (user && category && courseName) {
          const userId = user._id;
          
          // Build category map
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { courses: new Set(), users: new Set() });
          }
          categoryMap.get(category).courses.add(courseName);
          categoryMap.get(category).users.add(userId);
          
          // Build course map
          if (!courseMap.has(courseName)) {
            courseMap.set(courseName, { 
              category, 
              users: new Set(), 
              userDetails: [] 
            });
          }
          courseMap.get(courseName).users.add(userId);
          
          // Add user details if not already added
          if (!courseMap.get(courseName).userDetails.some(u => u._id === userId)) {
            courseMap.get(courseName).userDetails.push({
              ...user,
              courseName: courseName,
              category: category,
              paymentDate: payment.createdAt
            });
          }
        }
      });
      
      // Convert to arrays
      const categoriesArray = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        courseCount: data.courses.size,
        studentCount: data.users.size
      }));
      
      const coursesArray = Array.from(courseMap.entries()).map(([name, data]) => ({
        name,
        category: data.category,
        studentCount: data.users.size,
        students: data.userDetails
      }));
      
      setCategories(categoriesArray);
      setCourses(coursesArray);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigation handlers
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setViewLevel('courses');
    setSearchTerm('');
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setUsers(course.students);
    setViewLevel('users');
    setSearchTerm('');
  };

  const handleBackToCategories = () => {
    setViewLevel('categories');
    setSelectedCategory(null);
    setSelectedCourse(null);
    setUsers([]);
    setSearchTerm('');
  };

  const handleBackToCourses = () => {
    setViewLevel('courses');
    setSelectedCourse(null);
    setUsers([]);
    setSearchTerm('');
  };

  const handleGenerateCertificate = (user) => {
    setSelectedUser(user);
    setShowCertificate(true);
  };

  const handleCloseCertificate = () => {
    setShowCertificate(false);
    setSelectedUser(null);
  };

  const handleDownloadCertificate = async () => {
    if (certificateRef.current) {
      try {
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const link = document.createElement('a');
        link.download = `certificate_${selectedUser?.username}_${selectedUser?.courseName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error("Error generating certificate:", error);
        alert("Error generating certificate. Please try again.");
      }
    }
  };

  // Filter functions
  const getFilteredCategories = () => {
    if (!searchTerm) return categories;
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredCourses = () => {
    const categoryCoursesArray = courses.filter(course => 
      course.category === selectedCategory?.name
    );
    
    if (!searchTerm) return categoryCoursesArray;
    return categoryCoursesArray.filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredUsers = () => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.studentRegisterNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Helper functions
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().getFullYear();
    return new Date(dateString).getFullYear();
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) return <LoadingText>Loading certificate data...</LoadingText>;

  const filteredCategories = getFilteredCategories();
  const filteredCourses = getFilteredCourses();
  const filteredUsers = getFilteredUsers();

  return (
    <PageWrapper>
      <BackButton onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </BackButton>

      <Container>
        <HeaderSection>
          <Heading>
            {viewLevel === 'categories' && 'Course Certificates - Categories'}
            {viewLevel === 'courses' && `${selectedCategory?.name} - Courses`}
            {viewLevel === 'users' && `${selectedCourse?.name} - Students`}
          </Heading>
          <SearchContainer>
            <SearchIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder={
                viewLevel === 'categories' ? 'Search categories...' :
                viewLevel === 'courses' ? 'Search courses...' :
                'Search students...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
        </HeaderSection>

        {/* Breadcrumb Navigation */}
        <BreadcrumbNav>
          <BreadcrumbItem 
            clickable={viewLevel !== 'categories'} 
            active={viewLevel === 'categories'}
            onClick={handleBackToCategories}
          >
            Categories
          </BreadcrumbItem>
          {viewLevel !== 'categories' && (
            <>
              <BreadcrumbSeparator>›</BreadcrumbSeparator>
              <BreadcrumbItem 
                clickable={viewLevel === 'users'} 
                active={viewLevel === 'courses'}
                onClick={viewLevel === 'users' ? handleBackToCourses : undefined}
              >
                {selectedCategory?.name}
              </BreadcrumbItem>
            </>
          )}
          {viewLevel === 'users' && (
            <>
              <BreadcrumbSeparator>›</BreadcrumbSeparator>
              <BreadcrumbItem active={true}>
                {selectedCourse?.name}
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbNav>

        {/* Category View */}
        {viewLevel === 'categories' && (
          <Grid minWidth="250px">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <Card key={category.name} onClick={() => handleCategoryClick(category)}>
                  <CardIcon centered>
                    {category.name.charAt(0).toUpperCase()}
                  </CardIcon>
                  <CardTitle>{category.name}</CardTitle>
                  <CardSubtitle>{category.courseCount} Courses • {category.studentCount} Students</CardSubtitle>
                </Card>
              ))
            ) : (
              <NoResults>No categories found</NoResults>
            )}
          </Grid>
        )}

        {/* Course View */}
        {viewLevel === 'courses' && (
          <Grid minWidth="300px">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <Card key={course.name} onClick={() => handleCourseClick(course)}>
                  <CardIcon centered size="60px" square fontSize="24px">
                    {getInitials(course.name)}
                  </CardIcon>
                  <CardTitle fontSize="18px">{course.name}</CardTitle>
                  <CardSubtitle>{course.studentCount} Students enrolled</CardSubtitle>
                </Card>
              ))
            ) : (
              <NoResults>No courses found in this category</NoResults>
            )}
          </Grid>
        )}

        {/* Users View */}
        {viewLevel === 'users' && (
          <Grid minWidth="350px">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UserCard key={user._id}>
                  <UserHeader>
                    <CardIcon size="50px" fontSize="20px">
                      {getInitials(user.username)}
                    </CardIcon>
                    <UserInfo>
                      <UserName>{user.username || "N/A"}</UserName>
                      <UserDetail>{user.email || "N/A"}</UserDetail>
                    </UserInfo>
                  </UserHeader>
                  <UserDetail><strong>Reg No:</strong> {user.studentRegisterNumber || "N/A"}</UserDetail>
                  <UserDetail><strong>Mobile:</strong> {user.mobile || "N/A"}</UserDetail>
                  <UserDetail><strong>Course:</strong> {user.courseName || selectedCourse?.name}</UserDetail>
                  <UserDetail><strong>Category:</strong> {user.category || selectedCategory?.name}</UserDetail>
                  <ActionButton onClick={() => handleGenerateCertificate(user)}>
                    Generate Certificate
                  </ActionButton>
                </UserCard>
              ))
            ) : (
              <NoResults>No students found for this course</NoResults>
            )}
          </Grid>
        )}
      </Container>

      {/* Certificate Modal */}
      {showCertificate && selectedUser && (
        <CertificatePreview onClick={handleCloseCertificate}>
          <CertificateContainer onClick={(e) => e.stopPropagation()}>
            <CertificateCanvas ref={certificateRef}>
              <CertificateOverlay>
                <CertificateName>
                  {selectedUser.username || "Student Name"}
                </CertificateName>
                <CertificateCourseName>
                  {selectedUser.courseName || selectedCourse?.name || "Course Name"}
                </CertificateCourseName>
                <CertificateYear>
                  {formatDate(selectedUser.paymentDate)}
                </CertificateYear>
                <CertificateRegNo>
                  {selectedUser.studentRegisterNumber || "N/A"}
                </CertificateRegNo>
              </CertificateOverlay>
            </CertificateCanvas>
            <ButtonGroup>
              <CloseButton onClick={handleCloseCertificate}>Close</CloseButton>
              <DownloadButton onClick={handleDownloadCertificate}>Download Certificate</DownloadButton>
            </ButtonGroup>
          </CertificateContainer>
        </CertificatePreview>
      )}
    </PageWrapper>
  );
};


export default CourseCompletionCertificate;
