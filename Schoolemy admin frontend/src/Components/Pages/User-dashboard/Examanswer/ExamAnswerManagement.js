import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../../../Utils/api';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import marksheetTemplate from '../../../../assets/IRAI-ARAM-MARKSHEET.jpg';


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
  padding: ${props => props.$padding || '2rem'};
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
  width: ${props => props.$size || '80px'};
  height: ${props => props.$size || '80px'};
  border-radius: ${props => props.$square ? '12px' : '50%'};
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${props => props.$fontSize || '36px'};
  font-weight: 600;
  margin: ${props => props.$centered ? '0 auto 1rem' : '0 0 1rem 0'};
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: ${props => props.$fontSize || '20px'};
  font-weight: 600;
`;

const CardSubtitle = styled.p`
  margin: 0;
  color: #6c757d;
  font-size: 14px;
`;

const StudentCard = styled(Card)`
  text-align: left;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StudentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f8f9fa;
`;

const StudentInfo = styled.div`
  flex: 1;
`;

const StudentName = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
`;

const StudentDetail = styled.p`
  margin: 0.25rem 0;
  color: #6c757d;
  font-size: 14px;
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

const ActionButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: ${props => props.$variant === 'view' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'linear-gradient(135deg, #10B981, #059669)'};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-top: 0.5rem;
  width: 100%;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: modalSlideIn 0.3s ease-out;

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f9fa;
    color: #2c3e50;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const DetailSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #667eea;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 2px;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const DetailItem = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid ${props => props.$color || '#667eea'};
`;

const DetailLabel = styled.div`
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.25rem;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.div`
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  background: ${props => {
    if (props.$status === 'Pass' || props.$status === 'Passed') return 'linear-gradient(135deg, #10B981, #059669)';
    if (props.$status === 'Fail' || props.$status === 'Failed') return 'linear-gradient(135deg, #EF4444, #DC2626)';
    return 'linear-gradient(135deg, #6c757d, #495057)';
  }};
  color: white;
`;

const GradeDisplay = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 32px;
  font-weight: 700;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
`;

const PercentageCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  margin: 1rem 0;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-size: 16px;
  background: #fff3cd;
  border: 2px dashed #ffc107;
  border-radius: 8px;
`;

const DownloadButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-top: 0.5rem;
  width: 100%;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HiddenCanvas = styled.canvas`
  display: none;
`;

const PreviewButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-top: 0.5rem;
  width: 100%;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const PreviewModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 1rem;
  backdrop-filter: blur(4px);
`;

const PreviewModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 95vw;
  max-height: 95vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: modalSlideIn 0.3s ease-out;

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const PreviewImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const PreviewActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: center;
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;


const ExamAnswerManagement = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [viewLevel, setViewLevel] = useState('categories');
  const [searchTerm, setSearchTerm] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Data states
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [examRecords, setExamRecords] = useState([]);
  
  // Selection states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Modal state
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedStudentExam, setSelectedStudentExam] = useState(null);
  
  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewStudent, setPreviewStudent] = useState(null);
  
  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      console.log("🔄 Fetching payments and exam records...");
      
      const [paymentsResponse, examRecordsResponse] = await Promise.all([
        axios.get("/payments", { params: { limit: 10000 } }),
        axios.get("/api/exam-records/all", { params: { limit: 10000 } })
      ]);
      
      const paymentData = paymentsResponse.data.data;
      const examRecordsData = examRecordsResponse.data.data || [];
      
      setExamRecords(examRecordsData);
      
      const categoryMap = new Map();
      const courseMap = new Map();
      
      paymentData.forEach(payment => {
        const user = payment.userId;
        const category = payment.courseId?.category;
        const courseName = payment.courseId?.coursename || payment.courseName;
        
        if (user && category && courseName) {
          const userId = user._id;
          
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { courses: new Set(), students: new Set() });
          }
          categoryMap.get(category).courses.add(courseName);
          categoryMap.get(category).students.add(userId);
          
          if (!courseMap.has(courseName)) {
            courseMap.set(courseName, { 
              category, 
              students: new Set(), 
              studentDetails: [] 
            });
          }
          courseMap.get(courseName).students.add(userId);
          
          if (!courseMap.get(courseName).studentDetails.some(s => s._id === userId)) {
            const studentExamRecord = examRecordsData.find(record => {
              const studentIdMatch = record.studentId === user.studentRegisterNumber;
              const courseMatch = !record.courseName || record.courseName === courseName;
              return studentIdMatch && courseMatch;
            });
            
            courseMap.get(courseName).studentDetails.push({
              ...user,
              courseName: courseName,
              category: category,
              paymentDate: payment.createdAt,
              examRecord: studentExamRecord || null
            });
          }
        }
      });
      
      const categoriesArray = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        courseCount: data.courses.size,
        studentCount: data.students.size
      }));
      
      const coursesArray = Array.from(courseMap.entries()).map(([name, data]) => ({
        name,
        category: data.category,
        studentCount: data.students.size,
        students: data.studentDetails
      }));
      
      setCategories(categoriesArray);
      setCourses(coursesArray);
      
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      alert(`Error loading exam records: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper functions
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      const today = new Date();
      return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    }
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Certificate Generation Function - Shared logic for both preview and download
  const generateMarksheetCanvas = async (student, isPreview = false) => {
    if (isPreview) {
      setGenerating(true);
    } else {
      setDownloading(true);
    }
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Load the marksheet template image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Set canvas dimensions to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the template image
          ctx.drawImage(img, 0, 0);
          
          // Set text properties
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'left';
          ctx.font = 'bold 24px Arial';
          
          // Calculate positions based on image dimensions
          const width = img.width;
          const height = img.height;
          
          // Move content to the right by adding offset (10% more to the right)
          const rightOffset = 0.10; // Adjust this value to move more or less to the right
          
          // NAME OF THE CANDIDATE - positioned in the left box at top (moved right) - Times New Roman, bigger
          ctx.font = 'bold 32px "Times New Roman"';
          ctx.fillText(student.username || 'N/A', width * (0.08 + rightOffset), height * 0.265);
          
          // NAME OF THE COURSE - positioned in the right box at top (moved right) - Times New Roman, bigger
          ctx.fillText(student.courseName || selectedCourse?.name || 'N/A', width * (0.52 + rightOffset), height * 0.265);
          
          // REGISTER NUMBER - positioned in first row, first column (moved right) - Times New Roman, bigger
          ctx.font = 'bold 26px "Times New Roman"';
          ctx.fillText(student.studentRegisterNumber || 'N/A', width * (0.06 + rightOffset), height * 0.34);
          
          // DATE OF ISSUED - positioned in first row, second column (moved right) - Times New Roman, bigger
          // Show current date instead of exam date
          const today = new Date();
          const currentDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
          ctx.fillText(currentDate, width * (0.28 + rightOffset), height * 0.34);
          
          // YEAR OF THE COURSE CONDUCTED - positioned in first row, third column (moved right) - Times New Roman, bigger
          const currentYear = new Date().getFullYear();
          ctx.fillText(currentYear.toString(), width * (0.5 + rightOffset), height * 0.35);
          
          // Certificate No removed as requested
          
          // If exam record exists, add subject details
          if (student.examRecord) {
            let yPosition = height * 0.42;
            const lineHeight = 40; // Increased for bigger font
            
            // Add subject rows - Times New Roman, bigger
            ctx.font = '24px "Times New Roman"';
            
            const subjects = student.examRecord.subjects || [
              {
                name: student.examRecord.lessonName || student.courseName || 'Lesson Name',
                maxMarks: student.examRecord.totalMarks || 100,
                marksAwarded: student.examRecord.mark || 0
              }
            ];
            
            subjects.forEach((subject, index) => {
              const y = yPosition + (index * lineHeight);
              
              // SNO (keep on left - original position) - Times New Roman, bigger
              ctx.fillText((index + 1).toString(), width * 0.070, y);
              
              // LESSON NAME / SUBJECT - Now showing again
              ctx.fillText(subject.name || 'Lesson Name', width * (0.15 + rightOffset), y);
              
              // MAXIMUM MARKS (moved right) - Times New Roman, bigger
              ctx.fillText((subject.maxMarks || 100).toString(), width * (0.52 + rightOffset), y);
              
              // MARKS AWARDED (moved right) - Times New Roman, bigger
              ctx.fillText((subject.marksAwarded || 0).toString(), width * (0.64 + rightOffset), y);
              
              // Grade column removed as requested
            });
            
            // TOTAL - positioned at the bottom row (moved down slightly) - Times New Roman, bigger
            ctx.font = 'bold 26px "Times New Roman"';
            const totalDownOffset = 0.02; // Move total row down by 2%
            const totalY = height * (0.87 + totalDownOffset); // Changed from minus to plus to move down
            ctx.fillText((student.examRecord.mark || 0).toString(), width * (0.64 + rightOffset), totalY);
            
            // Add "NEXT EXAM ATTEND" text below the total - Times New Roman, bigger
            ctx.font = '24px "Times New Roman"';
            const nextExamY = totalY + 50; // Position below the total
            ctx.fillText('  ', width * (0.15 + rightOffset), nextExamY);
            
            // Grade removed as requested
          }
          
          resolve();
        };
        
        img.onerror = (error) => {
          console.error('Error loading image:', error);
          reject(error);
        };
        
        img.src = marksheetTemplate;
      });
      
      if (isPreview) {
        // Convert to data URL for preview
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setPreviewImage(dataUrl);
        setPreviewStudent(student);
        setShowPreviewModal(true);
        setGenerating(false);
      } else {
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Marksheet_${student.username}_${student.studentRegisterNumber}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setDownloading(false);
        }, 'image/jpeg', 0.95);
      }
      
    } catch (error) {
      console.error('Error generating marksheet:', error);
      alert('Failed to generate marksheet. Please try again.');
      setDownloading(false);
      setGenerating(false);
    }
  };

  // Preview marksheet
  const handlePreviewMarksheet = (student) => {
    generateMarksheetCanvas(student, true);
  };

  // Download marksheet
  const handleDownloadMarksheet = (student) => {
    generateMarksheetCanvas(student, false);
  };

  // Download from preview
  const handleDownloadFromPreview = () => {
    if (previewStudent) {
      setShowPreviewModal(false);
      handleDownloadMarksheet(previewStudent);
    }
  };

  // Close preview modal
  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewImage(null);
    setPreviewStudent(null);
  };

  // Filter functions - MOVED HERE BEFORE THEY ARE USED
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

  const getFilteredStudents = () => {
    if (!searchTerm) return students;
    return students.filter(student =>
      student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentRegisterNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Navigation handlers
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setViewLevel('courses');
    setSearchTerm('');
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setStudents(course.students);
    setViewLevel('students');
    setSearchTerm('');
  };

  const handleBackToCategories = () => {
    setViewLevel('categories');
    setSelectedCategory(null);
    setSelectedCourse(null);
    setStudents([]);
    setSearchTerm('');
  };

  const handleBackToCourses = () => {
    setViewLevel('courses');
    setSelectedCourse(null);
    setStudents([]);
    setSearchTerm('');
  };

  const handleViewExam = (student) => {
    setSelectedStudentExam(student);
    setShowExamModal(true);
  };

  const handleCloseModal = () => {
    setShowExamModal(false);
    setSelectedStudentExam(null);
  };

  if (loading) return <LoadingText>Loading exam records data...</LoadingText>;

  const filteredCategories = getFilteredCategories();
  const filteredCourses = getFilteredCourses();
  const filteredStudents = getFilteredStudents();

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
            {viewLevel === 'categories' && 'Exam Mark Records - Categories'}
            {viewLevel === 'courses' && `${selectedCategory?.name} - Courses`}
            {viewLevel === 'students' && `${selectedCourse?.name} - Students`}
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
                clickable={viewLevel === 'students'} 
                active={viewLevel === 'courses'}
                onClick={viewLevel === 'students' ? handleBackToCourses : undefined}
              >
                {selectedCategory?.name}
              </BreadcrumbItem>
            </>
          )}
          {viewLevel === 'students' && (
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
                  <CardIcon $centered>
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
                  <CardIcon $centered $size="60px" $square $fontSize="24px">
                    {getInitials(course.name)}
                  </CardIcon>
                  <CardTitle $fontSize="18px">{course.name}</CardTitle>
                  <CardSubtitle>{course.studentCount} Students enrolled</CardSubtitle>
                </Card>
              ))
            ) : (
              <NoResults>No courses found in this category</NoResults>
            )}
          </Grid>
        )}

        {/* Students View */}
        {viewLevel === 'students' && (
          <Grid minWidth="350px">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <StudentCard key={student._id}>
                  <StudentHeader>
                    <CardIcon $size="50px" $fontSize="20px">
                      {getInitials(student.username)}
                    </CardIcon>
                    <StudentInfo>
                      <StudentName>{student.username || "N/A"}</StudentName>
                      <StudentDetail>{student.email || "N/A"}</StudentDetail>
                    </StudentInfo>
                  </StudentHeader>
                  <StudentDetail><strong>Reg No:</strong> {student.studentRegisterNumber || "N/A"}</StudentDetail>
                  <StudentDetail><strong>Course:</strong> {student.courseName || selectedCourse?.name}</StudentDetail>
                  <StudentDetail><strong>Category:</strong> {student.category || selectedCategory?.name}</StudentDetail>
                  {student.examRecord ? (
                    <>
                      <StudentDetail style={{color: '#10B981', fontWeight: '600'}}>
                        ✅ Exam Record Available
                      </StudentDetail>
                      <StudentDetail><strong>Grade:</strong> {student.examRecord.grade || "N/A"}</StudentDetail>
                      <StudentDetail><strong>Percentage:</strong> {student.examRecord.percentage || "N/A"}%</StudentDetail>
                      <StudentDetail><strong>Status:</strong> {student.examRecord.status || "N/A"}</StudentDetail>
                      <StudentDetail><strong>Total Marks:</strong> {student.examRecord.mark || "0"} / {student.examRecord.totalMarks || "100"}</StudentDetail>
                      {student.examRecord.examDate && (
                        <StudentDetail><strong>Exam Date:</strong> {formatDate(student.examRecord.examDate)}</StudentDetail>
                      )}
                      <ActionButton 
                        $variant="view" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewExam(student);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Exam Details
                      </ActionButton>
                      <ButtonGroup>
                        <PreviewButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewMarksheet(student);
                          }}
                          disabled={generating || downloading}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          {generating ? 'Loading...' : 'Preview'}
                        </PreviewButton>
                        <DownloadButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadMarksheet(student);
                          }}
                          disabled={downloading || generating}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          {downloading ? 'Downloading...' : 'Download'}
                        </DownloadButton>
                      </ButtonGroup>
                    </>
                  ) : (
                    <StudentDetail style={{color: '#EF4444', fontWeight: '600'}}>
                      ❌ No Exam Record Found
                    </StudentDetail>
                  )}
                </StudentCard>
              ))
            ) : (
              <NoResults>No students found for this course</NoResults>
            )}
          </Grid>
        )}
      </Container>

      {/* Exam Review Modal */}
      {showExamModal && selectedStudentExam && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Exam Review Details</ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </CloseButton>
            </ModalHeader>

            {/* Student Information */}
            <DetailSection>
              <SectionTitle>Student Information</SectionTitle>
              <DetailGrid>
                <DetailItem $color="#667eea">
                  <DetailLabel>Name</DetailLabel>
                  <DetailValue>{selectedStudentExam.username || "N/A"}</DetailValue>
                </DetailItem>
                <DetailItem $color="#764ba2">
                  <DetailLabel>Register Number</DetailLabel>
                  <DetailValue>{selectedStudentExam.studentRegisterNumber || "N/A"}</DetailValue>
                </DetailItem>
                <DetailItem $color="#10B981">
                  <DetailLabel>Email</DetailLabel>
                  <DetailValue style={{fontSize: '14px'}}>{selectedStudentExam.email || "N/A"}</DetailValue>
                </DetailItem>
                <DetailItem $color="#f59e0b">
                  <DetailLabel>Phone</DetailLabel>
                  <DetailValue>{selectedStudentExam.phoneNumber || "N/A"}</DetailValue>
                </DetailItem>
              </DetailGrid>
            </DetailSection>

            {/* Course Information */}
            <DetailSection>
              <SectionTitle>Course Information</SectionTitle>
              <DetailGrid>
                <DetailItem $color="#3b82f6">
                  <DetailLabel>Course Name</DetailLabel>
                  <DetailValue>{selectedStudentExam.courseName || selectedCourse?.name || "N/A"}</DetailValue>
                </DetailItem>
                <DetailItem $color="#8b5cf6">
                  <DetailLabel>Category</DetailLabel>
                  <DetailValue>{selectedStudentExam.category || selectedCategory?.name || "N/A"}</DetailValue>
                </DetailItem>
                <DetailItem $color="#ec4899">
                  <DetailLabel>Enrollment Date</DetailLabel>
                  <DetailValue>{formatDate(selectedStudentExam.paymentDate)}</DetailValue>
                </DetailItem>
              </DetailGrid>
            </DetailSection>

            {/* Exam Results */}
            {selectedStudentExam.examRecord ? (
              <>
                <DetailSection>
                  <SectionTitle>Exam Performance</SectionTitle>
                  <PercentageCircle>
                    <GradeDisplay>{selectedStudentExam.examRecord.grade || 'N/A'}</GradeDisplay>
                    <div>
                      <DetailItem $color="#10B981" style={{marginBottom: '0.5rem'}}>
                        <DetailLabel>Percentage</DetailLabel>
                        <DetailValue>{selectedStudentExam.examRecord.percentage || 'N/A'}%</DetailValue>
                      </DetailItem>
                      <DetailItem $color="#3b82f6">
                        <DetailLabel>Status</DetailLabel>
                        <DetailValue>
                          <StatusBadge $status={selectedStudentExam.examRecord.status}>
                            {selectedStudentExam.examRecord.status || 'N/A'}
                          </StatusBadge>
                        </DetailValue>
                      </DetailItem>
                    </div>
                  </PercentageCircle>
                  
                  <DetailGrid>
                    <DetailItem $color="#667eea">
                      <DetailLabel>Marks Obtained</DetailLabel>
                      <DetailValue>{selectedStudentExam.examRecord.mark || "0"} / {selectedStudentExam.examRecord.totalMarks || "100"}</DetailValue>
                    </DetailItem>
                    <DetailItem $color="#f59e0b">
                      <DetailLabel>Exam Date</DetailLabel>
                      <DetailValue>{formatDate(selectedStudentExam.examRecord.examDate)}</DetailValue>
                    </DetailItem>
                  </DetailGrid>

                  {/* Preview and Download Marksheet Buttons */}
                  <ButtonGroup style={{marginTop: '1rem'}}>
                    <PreviewButton 
                      onClick={() => handlePreviewMarksheet(selectedStudentExam)}
                      disabled={generating || downloading}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      {generating ? 'Generating Preview...' : 'Preview Marksheet'}
                    </PreviewButton>
                    <DownloadButton 
                      onClick={() => handleDownloadMarksheet(selectedStudentExam)}
                      disabled={downloading || generating}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      {downloading ? 'Downloading...' : 'Download Marksheet'}
                    </DownloadButton>
                  </ButtonGroup>
                </DetailSection>

                {/* Additional Details */}
                {(selectedStudentExam.examRecord.remarks || selectedStudentExam.examRecord.comments) && (
                  <DetailSection>
                    <SectionTitle>Additional Information</SectionTitle>
                    <DetailItem $color="#64748b">
                      <DetailLabel>Remarks / Comments</DetailLabel>
                      <DetailValue style={{fontSize: '14px', lineHeight: '1.6'}}>
                        {selectedStudentExam.examRecord.remarks || selectedStudentExam.examRecord.comments || "No remarks available"}
                      </DetailValue>
                    </DetailItem>
                  </DetailSection>
                )}
              </>
            ) : (
              <NoDataMessage>
                <div style={{fontSize: '48px', marginBottom: '1rem'}}>📝</div>
                <div style={{fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem'}}>
                  No Exam Record Available
                </div>
                <div>
                  This student has not taken any exams yet or the exam records have not been uploaded.
                </div>
              </NoDataMessage>
            )}
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewImage && (
        <PreviewModalOverlay onClick={handleClosePreview}>
          <PreviewModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Marksheet Preview</ModalTitle>
              <CloseButton onClick={handleClosePreview}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </CloseButton>
            </ModalHeader>

            <PreviewImage src={previewImage} alt="Marksheet Preview" />

            <PreviewActions>
              <DownloadButton 
                onClick={handleDownloadFromPreview}
                disabled={downloading}
                style={{width: 'auto', minWidth: '200px'}}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {downloading ? 'Downloading...' : 'Download This Marksheet'}
              </DownloadButton>
              <CloseButton 
                onClick={handleClosePreview}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: '#6c757d',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Close Preview
              </CloseButton>
            </PreviewActions>
          </PreviewModalContent>
        </PreviewModalOverlay>
      )}

      {/* Hidden Canvas for Certificate Generation */}
      <HiddenCanvas ref={canvasRef} />
    </PageWrapper>
  );
};

export default ExamAnswerManagement;
