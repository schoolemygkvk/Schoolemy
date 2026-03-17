import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../Utils/api";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

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
  margin-bottom: 2rem;
`;

const Heading = styled.h2`
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;

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

const SubHeading = styled.p`
  color: #6c757d;
  font-size: 14px;
  margin: 0.5rem 0 0 0;
`;

const SearchSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 2px solid #e9ecef;
`;

const SearchForm = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
`;

const Input = styled.input`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #6e8efb;
    box-shadow: 0 0 0 3px rgba(110, 142, 251, 0.1);
  }

  &:disabled {
    background: #e9ecef;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #6e8efb;
    box-shadow: 0 0 0 3px rgba(110, 142, 251, 0.1);
  }

  &:disabled {
    background: #e9ecef;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const SearchButton = styled.button`
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ClearButton = styled.button`
  padding: 0.75rem 2rem;
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

const ResultsSection = styled.div`
  margin-top: 2rem;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
`;

const ResultsCount = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: ${props => {
    if (props.status === 'valid') return 'linear-gradient(135deg, #11998e, #38ef7d)';
    if (props.status === 'invalid') return 'linear-gradient(135deg, #ff6b6b, #ee5a6f)';
    return 'linear-gradient(135deg, #ffd89b, #19547b)';
  }};
  color: white;
`;

const ResultCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 2px solid ${props => {
    if (props.verified === 'valid') return '#38ef7d';
    if (props.verified === 'invalid') return '#ff6b6b';
    return '#e9ecef';
  }};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const UserInfoSection = styled.div`
  flex: 1;
`;

const UserName = styled.h4`
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 15px;
  color: #2c3e50;
  font-weight: 500;
`;

const VerificationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: ${props => {
    if (props.status === 'valid') return 'rgba(56, 239, 125, 0.1)';
    if (props.status === 'invalid') return 'rgba(255, 107, 107, 0.1)';
    return 'rgba(108, 117, 125, 0.1)';
  }};
  border-radius: 8px;
  margin-top: 1rem;
`;

const VerificationIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    if (props.status === 'valid') return '#38ef7d';
    if (props.status === 'invalid') return '#ff6b6b';
    return '#6c757d';
  }};
  color: white;
  font-size: 20px;
  font-weight: bold;
`;

const VerificationText = styled.div`
  flex: 1;
`;

const VerificationTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => {
    if (props.status === 'valid') return '#11998e';
    if (props.status === 'invalid') return '#ee5a6f';
    return '#495057';
  }};
  margin-bottom: 0.25rem;
`;

const VerificationDetail = styled.div`
  font-size: 13px;
  color: #6c757d;
`;

const NoResults = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6c757d;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
`;

const LoadingText = styled.p`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-size: 18px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6c757d;
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
`;

const EmptyStateText = styled.p`
  font-size: 18px;
  margin: 0;
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.variant === 'outline' ? 'white' : 'linear-gradient(135deg, #6e8efb, #a777e3)'};
  color: ${props => props.variant === 'outline' ? '#6e8efb' : 'white'};
  border: ${props => props.variant === 'outline' ? '2px solid #6e8efb' : 'none'};
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const CertificatesVerification = () => {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Search criteria state
  const [searchCriteria, setSearchCriteria] = useState({
    studentName: "",
    registrationNumber: "",
    email: "",
    mobile: "",
    courseName: "",
    category: ""
  });
  
  // Data states
  const [allPayments, setAllPayments] = useState([]);
  const [verificationResults, setVerificationResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);

  // Fetch all data on component mount
  const fetchInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get("/payments", { params: { limit: 10000 } });
      const paymentData = response.data.data;
      
      setAllPayments(paymentData);
      
      // Extract unique categories and courses
      const uniqueCategories = [...new Set(
        paymentData
          .map(p => p.courseId?.category)
          .filter(Boolean)
      )].sort();
      
      const uniqueCourses = [...new Set(
        paymentData
          .map(p => p.courseId?.coursename || p.courseName)
          .filter(Boolean)
      )].sort();
      
      setCategories(uniqueCategories);
      setCourses(uniqueCourses);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error loading data. Please try again.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Handle search input changes
  const handleInputChange = (field, value) => {
    setSearchCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all search criteria
  const handleClearSearch = () => {
    setSearchCriteria({
      studentName: "",
      registrationNumber: "",
      email: "",
      mobile: "",
      courseName: "",
      category: ""
    });
    setVerificationResults([]);
    setSearchPerformed(false);
  };

  // Perform certificate verification search
  const handleSearch = () => {
    setLoading(true);
    setSearchPerformed(true);
    
    try {
      // Check if at least one search criteria is provided
      const hasSearchCriteria = Object.values(searchCriteria).some(value => value.trim() !== "");
      
      if (!hasSearchCriteria) {
        alert("Please enter at least one search criterion");
        setLoading(false);
        return;
      }

      // Filter payments based on search criteria
      const results = allPayments.filter(payment => {
        const user = payment.userId;
        const course = payment.courseId;
        
        if (!user) return false;

        // Match each criterion if provided
        const nameMatch = !searchCriteria.studentName || 
          user.username?.toLowerCase().includes(searchCriteria.studentName.toLowerCase());
        
        const regMatch = !searchCriteria.registrationNumber || 
          user.studentRegisterNumber?.toLowerCase().includes(searchCriteria.registrationNumber.toLowerCase());
        
        const emailMatch = !searchCriteria.email || 
          user.email?.toLowerCase().includes(searchCriteria.email.toLowerCase());
        
        const mobileMatch = !searchCriteria.mobile || 
          user.mobile?.includes(searchCriteria.mobile);
        
        const courseMatch = !searchCriteria.courseName || 
          (course?.coursename || payment.courseName)?.toLowerCase().includes(searchCriteria.courseName.toLowerCase());
        
        const categoryMatch = !searchCriteria.category || 
          course?.category === searchCriteria.category;

        return nameMatch && regMatch && emailMatch && mobileMatch && courseMatch && categoryMatch;
      });

      // Transform results for display
      const transformedResults = results.map(payment => ({
        _id: payment._id,
        studentName: payment.userId?.username || "N/A",
        registrationNumber: payment.userId?.studentRegisterNumber || "N/A",
        email: payment.userId?.email || "N/A",
        mobile: payment.userId?.mobile || "N/A",
        courseName: payment.courseId?.coursename || payment.courseName || "N/A",
        category: payment.courseId?.category || "N/A",
        paymentDate: payment.createdAt,
        paymentAmount: payment.amount || "N/A",
        paymentStatus: payment.paymentStatus || "N/A",
        verified: results.length > 0 ? 'valid' : 'invalid',
        verificationMessage: results.length > 0 
          ? 'Certificate record found in database' 
          : 'No matching certificate record found'
      }));

      setVerificationResults(transformedResults);
    } catch (error) {
      console.error("Error searching certificates:", error);
      alert("Error performing search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle view certificate details
  const handleViewDetails = (result) => {
    console.log("Viewing details for:", result);
    // Navigate to certificate page or show detailed modal
  };

  if (initialLoading) {
    return <LoadingText>Loading certificate verification system...</LoadingText>;
  }

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
          <Heading>Certificate Verification System</Heading>
          <SubHeading>
            Search and verify course completion certificates by entering student details, registration number, or course information
          </SubHeading>
        </HeaderSection>

        {/* Search Section */}
        <SearchSection>
          <SearchForm>
            <FormGroup>
              <Label>Student Name</Label>
              <Input
                type="text"
                placeholder="Enter student name"
                value={searchCriteria.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Registration Number</Label>
              <Input
                type="text"
                placeholder="Enter registration number"
                value={searchCriteria.registrationNumber}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={searchCriteria.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Mobile Number</Label>
              <Input
                type="text"
                placeholder="Enter mobile number"
                value={searchCriteria.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Course Name</Label>
              <Input
                type="text"
                placeholder="Enter course name"
                value={searchCriteria.courseName}
                onChange={(e) => handleInputChange('courseName', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Category</Label>
              <Select
                value={searchCriteria.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
            </FormGroup>
          </SearchForm>

          <ButtonGroup>
            <ClearButton onClick={handleClearSearch}>
              Clear All
            </ClearButton>
            <SearchButton onClick={handleSearch} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {loading ? 'Searching...' : 'Search & Verify'}
            </SearchButton>
          </ButtonGroup>
        </SearchSection>

        {/* Results Section */}
        {searchPerformed && (
          <ResultsSection>
            {verificationResults.length > 0 ? (
              <>
                <ResultsHeader>
                  <ResultsCount>
                    {verificationResults.length} Certificate{verificationResults.length !== 1 ? 's' : ''} Found
                  </ResultsCount>
                  <StatusBadge status={verificationResults.length > 0 ? 'valid' : 'invalid'}>
                    {verificationResults.length > 0 ? 'Verified' : 'Not Found'}
                  </StatusBadge>
                </ResultsHeader>

                {verificationResults.map((result) => (
                  <ResultCard key={result._id} verified={result.verified}>
                    <CardHeader>
                      <UserInfoSection>
                        <UserName>{result.studentName}</UserName>
                        
                        <InfoGrid>
                          <InfoItem>
                            <InfoLabel>Registration Number</InfoLabel>
                            <InfoValue>{result.registrationNumber}</InfoValue>
                          </InfoItem>
                          
                          <InfoItem>
                            <InfoLabel>Email Address</InfoLabel>
                            <InfoValue>{result.email}</InfoValue>
                          </InfoItem>
                          
                          <InfoItem>
                            <InfoLabel>Mobile Number</InfoLabel>
                            <InfoValue>{result.mobile}</InfoValue>
                          </InfoItem>
                          
                          <InfoItem>
                            <InfoLabel>Course Name</InfoLabel>
                            <InfoValue>{result.courseName}</InfoValue>
                          </InfoItem>
                          
                          <InfoItem>
                            <InfoLabel>Category</InfoLabel>
                            <InfoValue>{result.category}</InfoValue>
                          </InfoItem>
                          
                          <InfoItem>
                            <InfoLabel>Completion Date</InfoLabel>
                            <InfoValue>{formatDate(result.paymentDate)}</InfoValue>
                          </InfoItem>
                        </InfoGrid>
                      </UserInfoSection>
                    </CardHeader>

                    <VerificationStatus status={result.verified}>
                      <VerificationIcon status={result.verified}>
                        {result.verified === 'valid' ? '✓' : '✗'}
                      </VerificationIcon>
                      <VerificationText>
                        <VerificationTitle status={result.verified}>
                          {result.verified === 'valid' ? 'Certificate Verified' : 'Certificate Not Found'}
                        </VerificationTitle>
                        <VerificationDetail>
                          {result.verificationMessage}
                        </VerificationDetail>
                      </VerificationText>
                    </VerificationStatus>

                    <ActionButtonGroup>
                      <ActionButton onClick={() => handleViewDetails(result)}>
                        View Full Details
                      </ActionButton>
                      <ActionButton variant="outline" onClick={() => navigate('/data-maintenance/course-certificates')}>
                        View Certificate
                      </ActionButton>
                    </ActionButtonGroup>
                  </ResultCard>
                ))}
              </>
            ) : (
              <NoResults>
                <EmptyStateIcon>🔍</EmptyStateIcon>
                <EmptyStateText>
                  No certificates found matching your search criteria
                </EmptyStateText>
                <p style={{ fontSize: '14px', marginTop: '1rem', color: '#6c757d' }}>
                  Please try different search parameters or check the spelling
                </p>
              </NoResults>
            )}
          </ResultsSection>
        )}

        {/* Empty State - Before Search */}
        {!searchPerformed && (
          <EmptyState>
            <EmptyStateIcon>📜</EmptyStateIcon>
            <EmptyStateText>
              Enter search criteria above to verify certificates
            </EmptyStateText>
            <p style={{ fontSize: '14px', marginTop: '1rem', color: '#6c757d' }}>
              You can search by student name, registration number, email, mobile, course, or category
            </p>
          </EmptyState>
        )}
      </Container>
    </PageWrapper>
  );
};

export default CertificatesVerification;
