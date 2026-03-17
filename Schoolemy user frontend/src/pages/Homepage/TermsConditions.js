import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaShieldAlt, FaFileContract, FaMoneyBillWave, FaGraduationCap, FaCertificate, FaClock, FaCreditCard, FaExclamationTriangle, FaGavel, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const BackButton = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 12px 20px;
  border-radius: 50px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  svg {
    font-size: 1.2rem;
  }

  @media (max-width: 768px) {
    top: 15px;
    left: 15px;
    padding: 10px 16px;
    font-size: 0.9rem;
  }
`;

const TermsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  animation: ${fadeIn} 0.6s ease-out;
  
  @media (max-width: 768px) {
    padding: 15px;
    margin: 20px auto;
  }
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
  color: white;
  padding: 80px 20px;
  text-align: center;
  border-radius: 0 0 40px 40px;
  margin-bottom: 60px;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 60px 15px;
    border-radius: 0 0 30px 30px;
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 20px;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroText = styled.p`
  font-size: 1.2rem;
  max-width: 800px;
  margin: 0 auto 30px;
  line-height: 1.6;
  opacity: 0.9;
  color: white;
`;

const QuickNav = styled.nav`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 40px auto;
  max-width: 1000px;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
`;

const NavCard = styled.a`
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%);
  border: 2px solid transparent;
  padding: 18px 16px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(33, 147, 176, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #1a365d;
  font-weight: 600;
  font-size: 0.95rem;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(33, 147, 176, 0.25);
    border-color: #2193b0;
    background: white;
  }

  &:active {
    transform: translateY(-2px);
  }

  svg {
    font-size: 2rem;
    color: #2193b0;
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: scale(1.1);
  }

  span {
    line-height: 1.3;
  }
  
  @media (max-width: 768px) {
    padding: 14px 10px;
    font-size: 0.85rem;
    
    svg {
      font-size: 1.5rem;
    }
  }
`;

const Section = styled.section`
  background: white;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
  }
  
  @media (max-width: 768px) {
    padding: 30px;
    margin-bottom: 30px;
  }
`;

const SectionTitle = styled.h2`
  color: #1a365d;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 15px;

  svg {
    color: #2193b0;
    font-size: 1.8rem;
  }
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const SubSection = styled.div`
  margin: 30px 0;
  animation: ${fadeIn} 0.6s ease-out;
`;

const SubTitle = styled.h3`
  color: #2193b0;
  margin: 20px 0 15px;
  font-size: 1.4rem;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const Text = styled.p`
  color: #4a5568;
  line-height: 1.8;
  margin: 15px 0;
  font-size: 1.1rem;
`;

const List = styled.ul`
  list-style: none;
  margin: 20px 0;
  padding: 0;
`;

const ListItem = styled.li`
  color: #4a5568;
  margin: 12px 0;
  padding-left: 30px;
  position: relative;
  line-height: 1.8;
  font-size: 1.1rem;

  &::before {
    content: '•';
    color: #2193b0;
    font-size: 1.5rem;
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
  }
`;

const InfoCard = styled.div`
  background: ${props => props.gradient || 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)'};
  border-radius: 15px;
  padding: 25px;
  color: white;
  margin: 20px 0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
`;

const TermsConditions = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <BackButton onClick={handleBack}>
        <FaArrowLeft />
        Back
      </BackButton>
      <HeroSection>
        <TermsContainer>
          <Title>Terms & Conditions</Title>
          <HeroText>
            Welcome to GKVK - Gurukula Vidyalaya Kendra. These Terms & Conditions outline the rules, policies, and legal obligations 
            that govern your use of our educational platform. By accessing or registering on our platform, 
            you agree to comply with all the terms mentioned below.
          </HeroText>

          <QuickNav>
            <NavCard href="#general" onClick={(e) => { e.preventDefault(); document.getElementById('general')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaFileContract />
              <span>General Terms</span>
            </NavCard>
            <NavCard href="#financial" onClick={(e) => { e.preventDefault(); document.getElementById('financial')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaMoneyBillWave />
              <span>Financial</span>
            </NavCard>
            <NavCard href="#course" onClick={(e) => { e.preventDefault(); document.getElementById('course')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaGraduationCap />
              <span>Course Policies</span>
            </NavCard>
            <NavCard href="#certificate" onClick={(e) => { e.preventDefault(); document.getElementById('certificate')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaCertificate />
              <span>Certificate Policy</span>
            </NavCard>
            <NavCard href="#duration" onClick={(e) => { e.preventDefault(); document.getElementById('duration')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaClock />
              <span>Course Duration</span>
            </NavCard>
            <NavCard href="#emi" onClick={(e) => { e.preventDefault(); document.getElementById('emi')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaCreditCard />
              <span>EMI Policy</span>
            </NavCard>
            <NavCard href="#liability" onClick={(e) => { e.preventDefault(); document.getElementById('liability')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaExclamationTriangle />
              <span>Liability</span>
            </NavCard>
            <NavCard href="#jurisdiction" onClick={(e) => { e.preventDefault(); document.getElementById('jurisdiction')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaGavel />
              <span>Jurisdiction</span>
            </NavCard>
          </QuickNav>
        </TermsContainer>
      </HeroSection>

      <TermsContainer>
        {/* General Terms & Conditions */}
        <Section id="general">
          <SectionTitle>
            <FaFileContract />
            1. General Terms for Registration
          </SectionTitle>
          <InfoCard gradient="linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)">
            <h3 style={{ marginBottom: '15px' }}>Important Notice</h3>
            <p>By registering on our platform, you agree to abide by all terms and policies mentioned herein.</p>
          </InfoCard>
          
          <SubSection>
            <SubTitle>1.1 Accurate Information</SubTitle>
            <Text>
              Users must provide accurate and complete information during registration, including name, email, 
              phone number, and payment details.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>1.2 Account Responsibility</SubTitle>
            <Text>
              Students are responsible for maintaining the confidentiality of their login credentials and all 
              activities conducted under their account.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>1.3 Misuse of Platform</SubTitle>
            <Text>
              Misuse of the platform—including but not limited to content piracy, sharing login access, 
              inappropriate behavior, or system abuse—may result in immediate account suspension or termination.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>1.4 Non-Transferable Enrollment</SubTitle>
            <Text>
              Course enrollment is strictly non-transferable unless explicitly approved by GKVK - Gurukula Vidyalaya Kendra.
            </Text>
          </SubSection>
        </Section>

        {/* Financial Policies */}
        <Section id="financial">
          <SectionTitle>
            <FaMoneyBillWave />
            2. Financial Policies
          </SectionTitle>
          <InfoCard gradient="linear-gradient(135deg, #2F855A 0%, #38A169 100%)">
            <h3 style={{ marginBottom: '15px' }}>Payment Terms</h3>
            <p>All course fees must be paid in advance unless an EMI (installment) plan is selected.</p>
          </InfoCard>
          
          <SubSection>
            <SubTitle>2.1 Payment Terms</SubTitle>
            <Text>
              All course fees must be paid in advance unless an EMI (installment) plan is selected.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>2.2 Refund Policy</SubTitle>
            <Text>Refunds are applicable only under the following conditions:</Text>
            <List>
              <ListItem>Duplicate payments</ListItem>
              <ListItem>Course cancellation by GKVK - Gurukula Vidyalaya Kendra</ListItem>
            </List>
            <Text>
              No refunds will be issued for change of mind, non-attendance, or partial completion.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>2.3 Discounts & Offers</SubTitle>
            <Text>
              All discounts, offers, or coupons are subject to validity and may be modified or withdrawn 
              without prior notice.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>2.4 Payment Receipts</SubTitle>
            <Text>
              Payment receipts will be automatically generated after a successful transaction.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>2.5 Payment Processing & Security</SubTitle>
            <Text>
              Payments on Schoolemy are processed using Cashfree Payment Gateway. We record transaction details such as payment ID and status for order reconciliation and support.
            </Text>
            <List>
              <ListItem>We do NOT store card numbers, CVV, UPI PINs, or bank credentials on our servers.</ListItem>
              <ListItem>Cashfree follows industry-standard security practices including PCI-DSS compliance.</ListItem>
              <ListItem>Customers should retain their transaction receipts for any refund or dispute processes.</ListItem>
            </List>
          </SubSection>
        </Section>

        {/* Course Completion Policy */}
        <Section id="course">
          <SectionTitle>
            <FaGraduationCap />
            3. Course Completion Policy
          </SectionTitle>
          <InfoCard gradient="linear-gradient(135deg, #6B46C1 0%, #805AD5 100%)">
            <h3 style={{ marginBottom: '15px' }}>Course Requirements</h3>
            <p>To earn certification, students must complete all required lectures, submit assignments, and pass assessments.</p>
          </InfoCard>
          
          <SubSection>
            <SubTitle>3.1 Completion Requirements</SubTitle>
            <Text>To earn certification, students must:</Text>
            <List>
              <ListItem>Complete all required lectures</ListItem>
              <ListItem>Submit assignments</ListItem>
              <ListItem>Pass assessments, quizzes, or exams</ListItem>
            </List>
          </SubSection>

          <SubSection>
            <SubTitle>3.2 Deadlines</SubTitle>
            <Text>
              Where applicable, assignment and exam deadlines must be followed strictly.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>3.3 Content Updates</SubTitle>
            <Text>
              GKVK - Gurukula Vidyalaya Kendra reserves the right to update, modify, or enhance course content without prior notice.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>3.4 Certification</SubTitle>
            <Text>
              Incomplete participation or failure to meet academic requirements may result in certification being withheld.
            </Text>
          </SubSection>
        </Section>

        {/* Certificate Policy */}
        <Section id="certificate">
          <SectionTitle>
            <FaCertificate />
            4. Certificate Policy
          </SectionTitle>
          <SubSection>
            <List>
              <ListItem>Certificates are issued only upon successful completion of all course requirements.</ListItem>
              <ListItem>Certificates will be provided in digital PDF format.</ListItem>
              <ListItem>Printed certificates may incur additional charges.</ListItem>
              <ListItem>Students must not alter, forge, or misuse the institution's name, logo, or certificate.</ListItem>
              <ListItem>Certificates cannot be sold, transferred, or used for fraudulent purposes.</ListItem>
            </List>
          </SubSection>
        </Section>

        {/* Course Duration Policy */}
        <Section id="duration">
          <SectionTitle>
            <FaClock />
            5. Course Duration Policy
          </SectionTitle>
          <InfoCard gradient="linear-gradient(135deg, #D69E2E 0%, #ECC94B 100%)">
            <h3 style={{ marginBottom: '15px' }}>Access Duration</h3>
            <p>Course access varies by type: 3 months, 6 months, or lifetime access.</p>
          </InfoCard>
          
          <SubSection>
            <SubTitle>5.1 Access Duration</SubTitle>
            <Text>Courses may have:</Text>
            <List>
              <ListItem>3-month access</ListItem>
              <ListItem>6-month access</ListItem>
              <ListItem>Lifetime access</ListItem>
            </List>
            <Text>(The access type is specified during enrollment.)</Text>
          </SubSection>

          <SubSection>
            <SubTitle>5.2 Expired Access</SubTitle>
            <Text>
              Once the access duration expires, students may need to re-enroll or extend access. 
              Additional fees may apply.
            </Text>
          </SubSection>

          <SubSection>
            <SubTitle>5.3 Live Courses</SubTitle>
            <Text>
              Live or instructor-led courses follow fixed schedules. Missed sessions may not be repeated 
              unless specifically stated.
            </Text>
          </SubSection>
        </Section>

        {/* EMI Policy */}
        <Section id="emi">
          <SectionTitle>
            <FaCreditCard />
            6. EMI (Installment) Policy
          </SectionTitle>
          <InfoCard gradient="linear-gradient(135deg, #C53030 0%, #E53E3E 100%)">
            <h3 style={{ marginBottom: '15px' }}>EMI Terms</h3>
            <p>EMI facility is available only for eligible courses above a specified fee threshold.</p>
          </InfoCard>
          <SubSection>
            <List>
              <ListItem>EMI facility is available only for eligible courses above a specified fee threshold.</ListItem>
              <ListItem>Students must provide valid identification and adhere to the payment schedule.</ListItem>
              <ListItem>Late EMI payments may result in penalties, temporary access suspension, or both.</ListItem>
              <ListItem>Failure to complete EMI payments may lead to certificate withholding or legal action.</ListItem>
            </List>
          </SubSection>
        </Section>

        {/* Limitation of Liability */}
        <Section id="liability">
          <SectionTitle>
            <FaExclamationTriangle />
            7. Limitation of Liability
          </SectionTitle>
          <SubSection>
            <List>
              <ListItem>GKVK - Gurukula Vidyalaya Kendra is not liable for issues related to internet connectivity, device compatibility, or technical failures.</ListItem>
              <ListItem>We do not guarantee job placement, salary increase, or career advancement after course completion.</ListItem>
              <ListItem>Students are responsible for applying learned skills in real-world scenarios.</ListItem>
            </List>
          </SubSection>
        </Section>

        {/* Governing Law & Jurisdiction */}
        <Section id="jurisdiction">
          <SectionTitle>
            <FaGavel />
            8. Governing Law & Jurisdiction
          </SectionTitle>
          <SubSection>
            <Text>
              All disputes arising from these Terms & Conditions shall be governed by the laws of India and 
              shall fall under the jurisdiction of Coimbatore courts only.
            </Text>
          </SubSection>
        </Section>
      </TermsContainer>
    </>
  );
};

export default TermsConditions;
