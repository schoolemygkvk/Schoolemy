import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCoursesByCategory, getApprovedTutorCoursesByCategory } from '../../service/courseApi';
import styled from 'styled-components';
import { FiArrowLeft, FiClock, FiBookOpen } from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: #EFEBE5;
  padding: 2rem 1rem;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 3rem;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #000000;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #000000;
  margin-bottom: 1rem;
`;

const CourseCount = styled.div`
  font-size: 1rem;
  color: #475569;
  font-weight: 600;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  background: #fee2e2;
  color: #991b1b;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #fca5a5;
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const CourseCard = styled(Link)`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const CourseImage = styled.div`
  width: 100%;
  height: 200px;
  background: ${props => props.bgColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  background-image: url(${props => props.image});
  background-size: cover;
  background-position: center;
  position: relative;
`;

const CourseCategory = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TutorBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(156, 39, 176, 0.95);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CourseContent = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CourseTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CourseDescription = styled.p`
  font-size: 0.9rem;
  color: #000000;
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
`;

const CourseFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`;

const CourseInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #000000;
  
  svg {
    color: #3b82f6;
  }
`;

const CoursePrice = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #10b981;
`;

const NoCoursesContainer = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  // background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: pulse 3s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.1) rotate(5deg); }
  }
`;

const NoCoursesIcon = styled.div`
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: bounce 2s ease-in-out infinite;
  position: relative;
  z-index: 1;
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
`;

const NoCoursesTitle = styled.h2`
  font-size: 2.5rem;
  color: #000000;
  margin-bottom: 1rem;
  font-weight: 800;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const NoCoursesText = styled.p`
  font-size: 1.2rem;
  color: #000000;
  margin-bottom: 2.5rem;
  line-height: 1.6;
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const BrowseAllButton = styled(Link)`
  display: inline-block;
  background: white;
  color: #667eea;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
  font-size: 1.1rem;

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, #ffffff, #f0f0f0);
  }
`;

const ComingSoonBadge = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #000000;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
`;

const CategoryCourses = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both regular courses and tutor courses in parallel
        const [regularResponse, tutorResponse] = await Promise.allSettled([
          getCoursesByCategory(categoryName),
          getApprovedTutorCoursesByCategory(categoryName)
        ]);
        
        const regularCoursesRaw =
          regularResponse.status === "fulfilled" ? regularResponse.value.data : null;
        const regularList = Array.isArray(regularCoursesRaw)
          ? regularCoursesRaw
          : Array.isArray(regularCoursesRaw?.data)
            ? regularCoursesRaw.data
            : [];
        const regularCourses = regularList.map((course) => ({
          ...course,
          isTutorCourse: false,
        }));
        
        const tutorCourses = tutorResponse.status === 'fulfilled'
          ? (tutorResponse.value.data || []).map(course => ({ ...course, isTutorCourse: true }))
          : [];
        
        // Merge both arrays
        const allCourses = [...regularCourses, ...tutorCourses];
        setCourses(allCourses);
        
        // Handle errors if both failed
        if (regularResponse.status === 'rejected' && tutorResponse.status === 'rejected') {
          const regularErr = regularResponse.reason;
          
          if (regularErr.response) {
            if (regularErr.response.status === 404) {
              // No courses found - this is not an error, just empty state
              setCourses([]);
            } else if (regularErr.response.status === 401 || regularErr.response.status === 403) {
              setCourses([]);
            } else if (regularErr.response.status >= 500) {
              setError('Server is temporarily unavailable. Please try again later.');
            } else {
              setError(regularErr.response?.data?.message || 'Failed to fetch courses');
            }
          } else if (regularErr.request) {
            setCourses([]);
            console.warn('Network error while fetching courses - showing empty state');
          } else {
            console.error('Unexpected error:', regularErr.message);
            setCourses([]);
          }
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryName) {
      fetchCourses();
    }
  }, [categoryName]);

  const handleBack = () => {
    navigate(-1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentWrapper>
          <BackButton onClick={handleBack}>
            <FiArrowLeft /> Back
          </BackButton>
          <ErrorContainer>
            <h2> Oops! Something went wrong</h2>
            <p>{error}</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              Please try again later or contact support if the problem persists.
            </p>
          </ErrorContainer>
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <BackButton onClick={handleBack}>
          <FiArrowLeft /> Back
        </BackButton>

        <Header>
          <Title>{categoryName} Courses</Title>
          <Subtitle>Explore our curated collection of {categoryName.toLowerCase()} courses</Subtitle>
          {courses.length > 0 && (
            <CourseCount>
              {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Available
            </CourseCount>
          )}
        </Header>

        {courses.length === 0 ? (
          <NoCoursesContainer>
            <ComingSoonBadge> Coming Soon</ComingSoonBadge>
            <NoCoursesIcon></NoCoursesIcon>
            <NoCoursesTitle>Exciting {categoryName} Courses on the Way!</NoCoursesTitle>
            <NoCoursesText>
              We're working hard to bring you amazing courses in {categoryName}.
              <br />
              Stay tuned! In the meantime, explore our other incredible categories.
            </NoCoursesText>
            <BrowseAllButton to="/course"> Explore All Courses</BrowseAllButton>
          </NoCoursesContainer>
        ) : (
          <CoursesGrid>
            {courses.map((course) => (
              <CourseCard 
                key={course._id} 
                to={course.isTutorCourse ? `/tutor-course/${course._id}` : `/course/${course._id}`}
              >
                <CourseImage 
                  image={course.thumbnail || course.thumbnail?.url}
                  bgColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                >
                  <CourseCategory>{course.category}</CourseCategory>
                  {course.isTutorCourse && (
                    <TutorBadge>
                      <FaChalkboardTeacher style={{ fontSize: '0.7rem' }} />
                      TUTOR
                    </TutorBadge>
                  )}
                </CourseImage>
                
                <CourseContent>
                  <CourseTitle>{course.coursename || course.title}</CourseTitle>
                  <CourseDescription>{course.description}</CourseDescription>
                  
                  <CourseFooter>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {course.duration && (
                        <CourseInfo>
                          <FiClock />
                          <span>{course.duration}</span>
                        </CourseInfo>
                      )}
                      {course.lessons && (
                        <CourseInfo>
                          <FiBookOpen />
                          <span>{course.lessons} lessons</span>
                        </CourseInfo>
                      )}
                    </div>
                    <CoursePrice>
                      {course.price?.finalPrice === 0 || course.price?.amount === 0 || course.price === 0
                        ? 'Free' 
                        : formatPrice(course.price?.finalPrice || course.price?.amount || course.price || 0)}
                    </CoursePrice>
                  </CourseFooter>
                </CourseContent>
              </CourseCard>
            ))}
          </CoursesGrid>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default CategoryCourses;
