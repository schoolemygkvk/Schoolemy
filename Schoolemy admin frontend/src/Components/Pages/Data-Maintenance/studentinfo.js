import React, { useEffect, useState, useCallback } from "react";
import axios from "../../../Utils/api";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

// Styled components
const PageWrapper = styled.div`
  padding: 2rem;
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

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 16px;
    height: 16px;
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

const Container = styled.div`
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  max-width: 1400px;
  margin: 2rem auto;
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
  position: relative;
  padding-bottom: 0.5rem;
  margin: 0;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #3498db, #9b59b6);
    border-radius: 2px;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex: 1;
  min-width: 150px;
`;

const CategoryCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
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

const CategoryIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
  font-weight: 600;
  margin: 0 auto 1rem;
`;

const CategoryName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
`;

const CategoryCount = styled.p`
  margin: 0;
  color: #6c757d;
  font-size: 14px;
`;

const CourseCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #6e8efb;
  }
`;

const CourseHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const CourseIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
`;

const CourseInfo = styled.div`
  flex: 1;
`;

const CourseName = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
`;

const CourseStudentCount = styled.p`
  margin: 0;
  color: #6c757d;
  font-size: 13px;
`;

const StatTitle = styled.div`
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
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
  background-color: white;

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

const UserGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const UserCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f8f9fa;
`;

const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
`;

const UserBasicInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
`;

const UserEmail = styled.p`
  margin: 0;
  color: #6c757d;
  font-size: 14px;
`;

const UserDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DetailLabel = styled.span`
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.span`
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  width: fit-content;

  ${props => props.status === 'active' ? `
    background-color: #d4edda;
    color: #155724;
  ` : props.status === 'inactive' ? `
    background-color: #f8d7da;
    color: #721c24;
  ` : props.status === 'logged-out' ? `
    background-color: #fff3cd;
    color: #856404;
  ` : `
    background-color: #e2e3e5;
    color: #383d41;
  `}
`;

const CourseSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #f8f9fa;
`;

const CourseCategoryTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CourseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CategoryGroupOld = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #6e8efb;
`;

const CategoryNameOld = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6e8efb;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CourseNameOld = styled.div`
  font-size: 13px;
  color: #495057;
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  
  &:last-child {
    margin-bottom: 0;
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

// Date formatting function
const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const StudentInfo = () => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewLevel, setViewLevel] = useState('categories'); // 'categories', 'courses', 'users'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    maleCount: 0,
    femaleCount: 0,
    activeCount: 0,
    inactiveCount: 0
  });

  const calculateStats = (users) => {
    const totalUsers = users.length;
    const maleCount = users.filter(user => user.gender?.toLowerCase() === 'male').length;
    const femaleCount = users.filter(user => user.gender?.toLowerCase() === 'female').length;
    const activeCount = users.filter(user => user.status?.toLowerCase() === 'active').length;
    const inactiveCount = users.filter(user => user.status?.toLowerCase() === 'inactive').length;

    return {
      totalUsers,
      maleCount,
      femaleCount,
      activeCount,
      inactiveCount
    };
  };

  const fetchData = useCallback(async () => {
    try {
      // Fetch all payments to build the course-user mapping
      const paymentsResponse = await axios.get("/payments", { params: { limit: 10000 } });
      const paymentData = paymentsResponse.data.data;
      
      // Build data structures
      const categoryMap = new Map(); // category -> { courses: Set, users: Set }
      const courseMap = new Map(); // courseName -> { category, users: Set }
      const userSet = new Set();
      
      paymentData.forEach(payment => {
        const user = payment.userId;
        const category = payment.courseId?.category;
        const courseName = payment.courseId?.coursename || payment.courseName;
        
        if (user && category && courseName) {
          const userId = user._id;
          
          // Track unique users
          if (!userSet.has(userId)) {
            userSet.add(userId);
          }
          
          // Build category map
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { courses: new Set(), users: new Set() });
          }
          categoryMap.get(category).courses.add(courseName);
          categoryMap.get(category).users.add(userId);
          
          // Build course map
          if (!courseMap.has(courseName)) {
            courseMap.set(courseName, { category, users: new Set(), userDetails: [] });
          }
          courseMap.get(courseName).users.add(userId);
          
          // Check if user already added to this course
          if (!courseMap.get(courseName).userDetails.some(u => u._id === userId)) {
            courseMap.get(courseName).userDetails.push(user);
          }
        }
      });
      
      // Convert to arrays
      const categoriesArray = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        courseCount: data.courses.size,
        studentCount: data.users.size,
        courses: Array.from(data.courses)
      }));
      
      const coursesArray = Array.from(courseMap.entries()).map(([name, data]) => ({
        name,
        category: data.category,
        studentCount: data.users.size,
        students: data.userDetails
      }));
      
      // Get unique users
      const uniqueUsers = [];
      const seenUserIds = new Set();
      paymentData.forEach(payment => {
        const user = payment.userId;
        if (user && !seenUserIds.has(user._id)) {
          seenUserIds.add(user._id);
          uniqueUsers.push(user);
        }
      });
      
      setCategories(categoriesArray);
      setCourses(coursesArray);
      setAllUsers(uniqueUsers);
      setStats(calculateStats(uniqueUsers));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setViewLevel('courses');
    setSearchTerm('');
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setDisplayedUsers(course.students);
    setViewLevel('users');
    setSearchTerm('');
  };

  const handleBackToCategories = () => {
    setViewLevel('categories');
    setSelectedCategory(null);
    setSelectedCourse(null);
    setSearchTerm('');
  };

  const handleBackToCourses = () => {
    setViewLevel('courses');
    setSelectedCourse(null);
    setDisplayedUsers([]);
    setSearchTerm('');
  };

  // Filter logic
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
    if (!searchTerm) return displayedUsers;
    return displayedUsers.filter(user =>
      Object.values(user).some(
        value => value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCategoryInitial = (name) => {
    if (!name) return "C";
    return name.charAt(0).toUpperCase();
  };

  const getCourseInitial = (name) => {
    if (!name) return "C";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) return <LoadingText>Loading student purchase information...</LoadingText>;

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
            {viewLevel === 'categories' && 'Course Categories'}
            {viewLevel === 'courses' && `${selectedCategory?.name} - Courses`}
            {viewLevel === 'users' && `${selectedCourse?.name} - Students`}
          </Heading>
          <SearchContainer>
            <SearchIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Stats Section */}
        {viewLevel === 'users' && (
          <StatsContainer>
            <StatCard>
              <StatTitle>Total Students</StatTitle>
              <StatValue>{filteredUsers.length}</StatValue>
            </StatCard>
            <StatCard>
              <StatTitle>Male Students</StatTitle>
              <StatValue>{filteredUsers.filter(u => u.gender?.toLowerCase() === 'male').length}</StatValue>
            </StatCard>
            <StatCard>
              <StatTitle>Female Students</StatTitle>
              <StatValue>{filteredUsers.filter(u => u.gender?.toLowerCase() === 'female').length}</StatValue>
            </StatCard>
            <StatCard>
              <StatTitle>Active Students</StatTitle>
              <StatValue>{filteredUsers.filter(u => u.status?.toLowerCase() === 'active').length}</StatValue>
            </StatCard>
            <StatCard>
              <StatTitle>Inactive Students</StatTitle>
              <StatValue>{filteredUsers.filter(u => u.status?.toLowerCase() === 'inactive').length}</StatValue>
            </StatCard>
          </StatsContainer>
        )}

        {/* Category View */}
        {viewLevel === 'categories' && (
          <CategoryGrid>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <CategoryCard key={category.name} onClick={() => handleCategoryClick(category)}>
                  <CategoryIcon>{getCategoryInitial(category.name)}</CategoryIcon>
                  <CategoryName>{category.name}</CategoryName>
                  <CategoryCount>{category.courseCount} Courses • {category.studentCount} Students</CategoryCount>
                </CategoryCard>
              ))
            ) : (
              <NoResults>No categories found</NoResults>
            )}
          </CategoryGrid>
        )}

        {/* Course View */}
        {viewLevel === 'courses' && (
          <CourseGrid>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <CourseCard key={course.name} onClick={() => handleCourseClick(course)}>
                  <CourseHeader>
                    <CourseIcon>{getCourseInitial(course.name)}</CourseIcon>
                    <CourseInfo>
                      <CourseName>{course.name}</CourseName>
                      <CourseStudentCount>{course.studentCount} Students enrolled</CourseStudentCount>
                    </CourseInfo>
                  </CourseHeader>
                </CourseCard>
              ))
            ) : (
              <NoResults>No courses found in this category</NoResults>
            )}
          </CourseGrid>
        )}

        {/* User View */}
        {viewLevel === 'users' && (
          <UserGrid>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UserCard key={user._id}>
                  <UserHeader>
                    <Avatar>
                      {getInitials(user.username)}
                    </Avatar>
                    <UserBasicInfo>
                      <UserName>{user.username || "N/A"}</UserName>
                      <UserEmail>{user.email || "N/A"}</UserEmail>
                    </UserBasicInfo>
                  </UserHeader>

                  <UserDetails>
                    <DetailItem>
                      <DetailLabel>Reg Number</DetailLabel>
                      <DetailValue>{user.studentRegisterNumber || "N/A"}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Mobile</DetailLabel>
                      <DetailValue>{user.mobile || "N/A"}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Gender</DetailLabel>
                      <DetailValue>{user.gender || "N/A"}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Date of Birth</DetailLabel>
                      <DetailValue>{formatDate(user.dateofBirth)}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Father Name</DetailLabel>
                      <DetailValue>{user.fatherName || "N/A"}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Blood Group</DetailLabel>
                      <DetailValue>{user.bloodGroup || "N/A"}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Nationality</DetailLabel>
                      <DetailValue>{user.Nationality || "N/A"}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Occupation</DetailLabel>
                      <DetailValue>{user.Occupation || "N/A"}</DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Address</DetailLabel>
                      <DetailValue>
                        {user.address ? `${user.address.city || ""}, ${user.address.state || ""}`.replace(/^, |, $/, "") || "N/A" : "N/A"}
                      </DetailValue>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Status</DetailLabel>
                      <StatusBadge status={user.status?.toLowerCase()}>
                        {user.status || "N/A"}
                      </StatusBadge>
                    </DetailItem>

                    <DetailItem>
                      <DetailLabel>Role</DetailLabel>
                      <DetailValue>{user.role || "N/A"}</DetailValue>
                    </DetailItem>
                  </UserDetails>
                </UserCard>
              ))
            ) : (
              <NoResults>No students found for this course</NoResults>
            )}
          </UserGrid>
        )}
      </Container>
    </PageWrapper>
  );
};

export default StudentInfo;