import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaShieldAlt, FaUserLock, FaDatabase, FaUsersCog } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 768px) {
    padding: 0 15px;
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
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroText = styled.p`
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto 30px;
  line-height: 1.6;
  opacity: 0.9;
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
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 15px;
  padding-left: 15px;
  border-left: 4px solid #11998e;
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

const QuickNav = styled.nav`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 40px 0;
  
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

const LastUpdated = styled.p`
  color: #718096;
  text-align: center;
  margin-top: 60px;
  padding: 20px;
  font-style: italic;
  border-top: 1px solid #e2e8f0;
`;

/* Modal / New Odel styles */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(2,6,23,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  width: 100%;
  max-width: 960px;
  max-height: 90vh;
  overflow: auto;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(2,6,23,0.4);
  padding: 26px;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ModalTitle = styled.h3`
  font-size: 1.4rem;
  margin: 0;
  color: #0f172a;
`;

const ModalClose = styled.button`
  background: transparent;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: #475569;
`;

const ModalBody = styled.div`
  color: #334155;
  line-height: 1.7;
  font-size: 1rem;
`;

const PolicyOpenButton = styled.button`
  background: linear-gradient(90deg,#11998e,#38ef7d);
  border: none;
  color: white;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(17,153,142,0.18);
`;

const PrivacyPolicy = () => {
  return (
    <>
      <HeroSection>
        <Container>
          <Title>Privacy Policy</Title>
          <HeroText>
            At Schoolemy, we are committed to protecting your privacy and ensuring the security of your personal information.
            Learn how we collect, use, and safeguard your data.
          </HeroText>
          
          <QuickNav>
            <NavCard href="#collection" data-scroll-to="collection" onClick={(e) => { e.preventDefault(); document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaUserLock />
              <span>Data Collection</span>
            </NavCard>
            <NavCard href="#usage" data-scroll-to="usage" onClick={(e) => { e.preventDefault(); document.getElementById('usage')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaDatabase />
              <span>Data Usage</span>
            </NavCard>
            <NavCard href="#security" data-scroll-to="security" onClick={(e) => { e.preventDefault(); document.getElementById('security')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaShieldAlt />
              <span>Security</span>
            </NavCard>
            <NavCard href="#rights" data-scroll-to="rights" onClick={(e) => { e.preventDefault(); document.getElementById('rights')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaUsersCog />
              <span>Your Rights</span>
            </NavCard>
            <NavCard href="#billing" data-scroll-to="billing" onClick={(e) => { e.preventDefault(); document.getElementById('billing')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaShieldAlt />
              <span>Billing & Transactions</span>
            </NavCard>
            <NavCard href="#tutor" data-scroll-to="tutor" onClick={(e) => { e.preventDefault(); document.getElementById('tutor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaUsersCog />
              <span>Tutor Agreement</span>
            </NavCard>
            <NavCard href="#completion" data-scroll-to="completion" onClick={(e) => { e.preventDefault(); document.getElementById('completion')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <FaDatabase />
              <span>Course Completion</span>
            </NavCard>
          </QuickNav>
        </Container>
      </HeroSection>

      <Container>
        <Section>
          <SectionTitle>
            <FaUserLock />
            Introduction
          </SectionTitle>
          <Text>
            Welcome to Schoolemy's Privacy Policy. By using our platform, you agree to the practices described in this policy.
          </Text>
          <Text>
            This policy applies to all users, including students, tutors, and visitors accessing our website.
          </Text>
        </Section>

      <Section id="collection">
          <SectionTitle>
            <FaDatabase />
            Information We Collect
          </SectionTitle>
          <SubSection>
            <InfoCard gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">
              <h3 style={{ marginBottom: '15px' }}>Your Privacy Matters</h3>
              <p>We collect only the information necessary to provide a seamless learning experience.</p>
            </InfoCard>
            
            <Text style={{ fontWeight: 700, marginTop: 20 }}>Personal Information</Text>
            <List>
              <ListItem>Name</ListItem>
              <ListItem>Email address</ListItem>
              <ListItem>Phone number</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 20 }}>Profile Information</Text>
            <List>
              <ListItem>Educational details</ListItem>
              <ListItem>Professional experience</ListItem>
              <ListItem>Profile picture</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 20 }}>Course & Activity Information</Text>
            <List>
              <ListItem>Courses purchased</ListItem>
              <ListItem>Learning progress</ListItem>
              <ListItem>Quiz/exam results</ListItem>
              <ListItem>Communication preferences</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 20 }}>Payment Information</Text>
            <List>
              <ListItem>Payment details processed securely through third-party payment gateways</ListItem>
              <ListItem>(Note: Schoolemy does not store card numbers, CVV, UPI PIN, or bank credentials.)</ListItem>
            </List>
          </SubSection>
        </Section>

        <Section id="usage">
          <SectionTitle>
            <FaUsersCog />
            How We Use Your Information
          </SectionTitle>
          <SubSection>
            <Text>We use your data to:</Text>
            <List>
              <ListItem>Provide, manage, and improve our services</ListItem>
              <ListItem>Process payments and send invoices</ListItem>
              <ListItem>Send course updates, reminders, and important notifications</ListItem>
              <ListItem>Enhance your learning experience</ListItem>
              <ListItem>Offer customer support</ListItem>
              <ListItem>Maintain the security of our platform</ListItem>
            </List>
          </SubSection>
        </Section>

        <Section id="security">
          <SectionTitle>
            <FaShieldAlt />
            Data Security
          </SectionTitle>
          <SubSection>
            <InfoCard gradient="linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)">
              <h3 style={{ marginBottom: '15px' }}>Your Safety Comes First</h3>
              <p>Your data is protected using industry-standard encryption and security measures.</p>
            </InfoCard>
            <Text>We use:</Text>
            <List>
              <ListItem>Industry-standard encryption</ListItem>
              <ListItem>Regular security audits</ListItem>
              <ListItem>Secure data storage with redundancy</ListItem>
              <ListItem>Strict access control for staff</ListItem>
              <ListItem>Continuous monitoring for suspicious activity</ListItem>
            </List>
            <Text style={{ marginTop: 15 }}>However, no system can guarantee 100% security due to the nature of the internet.</Text>
          </SubSection>
        </Section>

        <Section id="rights">
          <SectionTitle>
            <FaUsersCog />
            Your Rights
          </SectionTitle>
          <SubSection>
            <Text>As a Schoolemy user, you can:</Text>
            <List>
              <ListItem>Access your personal information</ListItem>
              <ListItem>Request corrections</ListItem>
              <ListItem>Request deletion of your data</ListItem>
              <ListItem>Opt-out of marketing emails</ListItem>
              <ListItem>Request a copy of your stored information</ListItem>
            </List>
          </SubSection>
        </Section>

        {/* Billing & Transaction Policies */}
        <Section id="billing">
          <SectionTitle>
            <FaShieldAlt />
            Billing & Transaction Policies
          </SectionTitle>
          <SubSection>
            <Text style={{ fontWeight: 700 }}>6.1 Billing & GST</Text>
            <List>
              <ListItem>All course fees and service charges on Schoolemy are subject to applicable Indian taxation laws.</ListItem>
              <ListItem>As per Government of India regulations, 18% GST will be charged on all taxable transactions, split as: 9% Central GST (CGST) and 9% State GST (SGST).</ListItem>
              <ListItem>GST will be clearly mentioned on the invoice provided to students at the time of payment.</ListItem>
              <ListItem>The invoice/receipt will be sent to the registered email ID of the student after successful completion of the transaction.</ListItem>
              <ListItem>Schoolemy reserves the right to revise prices and taxes in compliance with any changes in government regulations without prior notice.</ListItem>
            </List>

   
            <List>
              <ListItem>All billing-related information such as name, address, email, and GST details provided by students is kept strictly confidential and used only for invoicing and compliance purposes.</ListItem>
              <ListItem>Schoolemy does not share personal or billing data with unauthorized third parties, except where required by law or government authorities.</ListItem>
              <ListItem>Students are advised to use secure devices and networks while making online payments. Schoolemy will not be responsible for any unauthorized transactions due to negligence at the user’s end.</ListItem>
            </List>

            {/* Added Payment & Billing Details */}
            <SubSection>
              <SubTitle style={{ marginTop: '20px' }}>Payment & Billing Information</SubTitle>

              <Text style={{ fontWeight: 700 }}>What Information We Collect</Text>
              <List>
                <ListItem>Name, email, phone number</ListItem>
                <ListItem>Payment transaction details (payment ID, status)</ListItem>
                <ListItem>Basic technical data like IP address and browser type</ListItem>
              </List>

              <Text>We do NOT store card, UPI, or bank details. All payments are securely processed by Cashfree Payment Gateway.</Text>

              <Text style={{ fontWeight: 700, marginTop: 12 }}>How We Use Your Information</Text>
              <List>
                <ListItem>To process payments</ListItem>
                <ListItem>To provide services and customer support</ListItem>
                <ListItem>To improve our website and services</ListItem>
                <ListItem>To meet legal requirements</ListItem>
              </List>

              <Text style={{ fontWeight: 700, marginTop: 12 }}>Payment Security</Text>
              <Text>Payments are handled by Cashfree Payments India Pvt. Ltd., which follows PCI-DSS security standards.</Text>

              <Text style={{ fontWeight: 700, marginTop: 12 }}>Data Sharing</Text>
              <Text>We do not sell or share your personal data except:</Text>
              <List>
                <ListItem>With Cashfree for payment processing</ListItem>
                <ListItem>When required by law</ListItem>
              </List>
            </SubSection>

          </SubSection>
        </Section>

        {/* Tutor Agreement / Company Policy */}
        <Section id="tutor">
          <SectionTitle>
            <FaUsersCog />
            Tutor — Company Policy & Agreement
          </SectionTitle>
          <SubSection>
            <Text>Below are the terms and conditions between Schoolemy (Company) and Tutors who register and upload educational content on the platform.</Text>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>1. Revenue Sharing</Text>
            <List>
              <ListItem>The Tutor shall receive 30% of the net course fee (including taxes) for every successful student purchase.</ListItem>
              <ListItem>The Company shall retain 70% of the net course fee, which covers platform maintenance, marketing, transaction processing, and administrative costs.</ListItem>
              <ListItem>All taxes, including GST and applicable levies, are included in the Tutor’s 30% share.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>2. Tutor Requirements</Text>
            <List>
              <ListItem>The Tutor must provide a 2-minute demo video introducing the course.</ListItem>
              <ListItem>A detailed course description with objectives, structure, and outcomes.</ListItem>
              <ListItem>A professional tutor picture for profile display.</ListItem>
              <ListItem>Details of the Tutor’s educational qualifications and skills.</ListItem>
              <ListItem>The completed course content in approved video, audio, or document format.</ListItem>
            </List>

            <Text style={{ marginTop: 8 }}>The Tutor is solely responsible for the accuracy, authenticity, originality, and maintenance of their course content.</Text>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>3. Payment Terms</Text>
            <List>
              <ListItem>Tutor payments shall be released once every 15 days.</ListItem>
              <ListItem>Payments will be made via bank transfer or other approved payment methods, after deducting any applicable processing fees.</ListItem>
              <ListItem>The Company is not liable for delays caused by incorrect banking details provided by the Tutor.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>4. Content Ownership & License</Text>
            <List>
              <ListItem>The Tutor retains full ownership of their original course content.</ListItem>
              <ListItem>By uploading content, the Tutor grants Schoolemy a non-exclusive, worldwide license to host, market, distribute, and make the course available to students through the platform.</ListItem>
              <ListItem>The Tutor agrees not to upload any content that is illegal, harmful, defamatory, discriminatory, or violates intellectual property laws.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>5. Marketing & Promotion</Text>
            <List>
              <ListItem>The Company reserves the right to market, promote, and discount courses to attract students.</ListItem>
              <ListItem>Discounts, offers, and promotions applied by the Company shall not alter the agreed revenue share percentage (30% Tutor / 70% Company).</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>6. Tutor Conduct & Responsibilities</Text>
            <List>
              <ListItem>The Tutor shall maintain professional behavior and uphold academic integrity.</ListItem>
              <ListItem>The Tutor shall not engage in spamming, misleading marketing, or unethical practices, contact students outside the platform for unauthorized transactions, or share false/misleading information.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>7. Course Approval & Removal</Text>
            <List>
              <ListItem>All courses are subject to review and approval by the Company before publishing.</ListItem>
              <ListItem>The Company reserves the right to remove or suspend any course that fails to meet platform quality standards, violates copyright/legal/ethical guidelines, or receives repeated complaints or poor ratings from students.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>8. Termination of Agreement</Text>
            <List>
              <ListItem>Either party may terminate this Agreement with 30 days’ written notice.</ListItem>
              <ListItem>The Company reserves the right to immediately terminate the Tutor’s account in case of fraudulent activities, intellectual property infringement, or violation of platform policies or legal obligations.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>9. Limitation of Liability</Text>
            <List>
              <ListItem>The Company shall not be held liable for loss of income due to low course sales, technical issues, server downtime, third-party service interruptions, or any legal dispute arising from false or misleading tutor information.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>10. Governing Law</Text>
            <Text>The Agreement shall be governed by and construed in accordance with the laws of India, and any disputes shall be subject to the jurisdiction of the courts in [Your City/State].</Text>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>11. Acceptance</Text>
            <Text>By registering as a Tutor on Schoolemy, the Tutor acknowledges that they have read, understood, and agreed to all the terms and conditions of this Agreement.</Text>
          </SubSection>
        </Section>

        {/* Course Completion Policy */}
        <Section id="completion">
          <SectionTitle>
            <FaDatabase />
            Course Completion Policy
          </SectionTitle>
          <SubSection>
            <Text>At Schoolemy, we are committed to ensuring that students gain complete knowledge and value from every course. To be officially recognized as having completed a course, students must follow the rules and requirements below:</Text>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>1. Examination Requirement</Text>
            <List>
              <ListItem>Students must attempt and pass all exams, quizzes, and assessments associated with the course.</ListItem>
              <ListItem>A course will not be marked as “completed” unless all mandatory evaluations are successfully finished.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>2. Course Duration & Validity</Text>
            <List>
              <ListItem>Each course comes with a specific duration. Students are expected to complete all activities within this time frame.</ListItem>
              <ListItem>If a student fails to complete the course within the given period, it will be considered expired, and Schoolemy will not be responsible.</ListItem>
              <ListItem>Extension requests, if available, may involve additional fees or approvals.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>3. Attendance & Practical Sessions</Text>
            <List>
              <ListItem>For courses involving practical sessions, live classes, or workshops, attendance is mandatory.</ListItem>
              <ListItem>Absence from required practicals will lead to incomplete course status, even if online modules are finished.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>4. Rules & Guidelines</Text>
            <List>
              <ListItem>Students must strictly follow all platform rules, academic integrity guidelines, and instructions provided by tutors.</ListItem>
              <ListItem>Any form of misconduct, cheating, or violation of platform policies will result in disqualification from course completion.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>5. Performance Standards</Text>
            <List>
              <ListItem>Students must maintain a minimum score/grade requirement as specified in each course.</ListItem>
              <ListItem>Consistent low performance or failure to meet grading standards may prevent course completion and certification.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>6. Student Profile & Conduct</Text>
            <List>
              <ListItem>Students are expected to maintain a complete and accurate profile on the platform.</ListItem>
              <ListItem>Professional behavior, respectful communication, and adherence to Schoolemy’s learning environment standards are mandatory.</ListItem>
              <ListItem>Failure to maintain a good profile may lead to restrictions on course access or certification.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>7. Certification & Recognition</Text>
            <List>
              <ListItem>Only students who have completed all exams and assessments, attended required practical sessions, respected course timelines, and followed all rules and maintained good performance will be considered eligible for course completion certification.</ListItem>
            </List>

            <Text style={{ fontWeight: 700, marginTop: 12 }}>8. Final Decision</Text>
            <Text>Schoolemy reserves the right to withhold or deny course completion status in cases where students fail to meet the above requirements. All disputes regarding course completion will be handled in accordance with Schoolemy’s academic policies.</Text>
          </SubSection>
        </Section>

        <Section>
          <SectionTitle>Contact Us</SectionTitle>
          <InfoCard>
            <h3 style={{ marginBottom: '15px' }}>Get in Touch</h3>
            <Text style={{ color: 'white', margin: '5px 0' }}>If you have any questions, please reach out:</Text>
            <Text style={{ color: 'white', margin: '5px 0' }}>Email: schoolemygkvk@gmail.com</Text>
            <Text style={{ color: 'white', margin: '5px 0' }}>Phone: +91 93445 96648</Text>
          </InfoCard>
        </Section>

        {/* Changes to This Policy */}
        <Section>
          <SectionTitle>
            <FaDatabase />
            Changes to This Policy
          </SectionTitle>
          <SubSection>
            <Text>We may update this Privacy Policy periodically.</Text>
            <Text>Continued use of the platform after changes means you accept the updated policy.</Text>
          </SubSection>
        </Section>

        
      </Container>
    </>
  );
};

export default PrivacyPolicy;