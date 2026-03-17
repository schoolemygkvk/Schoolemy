import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from '../../../Utils/api';
import { Link } from 'react-router-dom';
import { FaChalkboardTeacher, FaChevronRight, FaTasks } from 'react-icons/fa';

// --- Professional Styling ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  margin-bottom: 2.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
`;

const Title = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const CourseCard = styled(Link)`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.07);
  border: 1px solid #e9ecef;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  color: #343a40;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: ${fadeIn} 0.5s ease-out forwards;
  animation-delay: ${props => props.delay * 50}ms;
  opacity: 0;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }
`;

const CourseInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconWrapper = styled.div`
  background-color: #e7f5ff;
  color: #007bff;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const CourseName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const ArrowIcon = styled(FaChevronRight)`
  color: #adb5bd;
  font-size: 1.2rem;
  transition: transform 0.2s;
  ${CourseCard}:hover & {
    transform: translateX(5px);
  }
`;

const StatusText = styled.div`
  text-align: center;
  padding: 4rem;
  font-size: 1.2rem;
  color: #6c757d;
`;

// --- Component ---
const CourseListPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('/api/join-requests/courses', config);
                setCourses(data);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) return <StatusText>Loading Courses...</StatusText>;

    return (
        <PageContainer>
            <Header>
                <Title><FaTasks /> Manage Course Attendance</Title>
            </Header>
            
            {courses.length === 0 ? (
                <StatusText>No courses with enrollments found yet.</StatusText>
            ) : (
                <CourseGrid>
                    {courses.map((course, index) => (
                        <CourseCard 
                            key={course} 
                            to={`/schoolemy/practice-class-list/${encodeURIComponent(course)}`}
                            delay={index}
                        >
                            <CourseInfo>
                                <IconWrapper>
                                    <FaChalkboardTeacher />
                                </IconWrapper>
                                <CourseName>{course}</CourseName>
                            </CourseInfo>
                            <ArrowIcon />
                        </CourseCard>
                    ))}
                </CourseGrid>
            )}
        </PageContainer>
    );
};

export default CourseListPage;