import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaCookie, FaShieldAlt, FaChartLine, FaCog, FaBullhorn, FaGlobe, FaUserCheck, FaSync, FaEnvelope } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 80px 20px;
  text-align: center;
  border-radius: 0 0 40px 40px;
  margin-bottom: 60px;
  position: relative;
  overflow: hidden;
  width: 100%;

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
  max-width: 700px;
  margin: 0 auto 30px;
  line-height: 1.6;
  opacity: 0.95;
`;

const LastUpdated = styled.p`
  font-size: 1rem;
  opacity: 0.85;
  font-style: italic;
`;

const QuickNav = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 60px;
  padding: 0 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
`;

const NavCard = styled.a`
  background: white;
  padding: 25px 15px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;

    svg {
      color: white;
      transform: scale(1.2);
    }
  }

  svg {
    font-size: 2.5rem;
    color: #4facfe;
    transition: all 0.3s ease;
  }

  span {
    font-weight: 600;
    font-size: 0.95rem;
    line-height: 1.3;
  }

  @media (max-width: 768px) {
    padding: 20px 10px;
    
    svg {
      font-size: 2rem;
    }
    
    span {
      font-size: 0.85rem;
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
    color: #4facfe;
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
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 15px;
  padding-left: 15px;
  border-left: 4px solid #4facfe;
`;

const Text = styled.p`
  color: #4a5568;
  font-size: 1.05rem;
  line-height: 1.8;
  margin-bottom: 15px;
`;

const List = styled.ul`
  color: #4a5568;
  font-size: 1.05rem;
  line-height: 1.8;
  margin-left: 30px;
  margin-bottom: 20px;

  li {
    margin-bottom: 10px;
    padding-left: 10px;
  }

  li::marker {
    color: #4facfe;
  }
`;

const HighlightBox = styled.div`
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 5px solid #4facfe;
  padding: 20px 25px;
  border-radius: 10px;
  margin: 25px 0;

  p {
    margin-bottom: 10px;
    color: #2d3748;
    font-weight: 500;
  }
`;

const BrowserSettings = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const BrowserCard = styled.div`
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 10px;
  border: 2px solid #e9ecef;
  font-weight: 500;
  color: #495057;
  transition: all 0.3s ease;

  &:hover {
    border-color: #4facfe;
    background: #fff;
    transform: translateX(5px);
  }

  strong {
    color: #4facfe;
  }
`;

const ContactBox = styled.div`
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 35px;
  border-radius: 20px;
  text-align: center;
  margin-top: 50px;

  h3 {
    font-size: 1.8rem;
    margin-bottom: 20px;
  }

  p {
    font-size: 1.1rem;
    margin: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    a {
      color: white;
      text-decoration: none;
      font-weight: 600;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const CookiePolicy = () => {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let current = '';

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 100) {
          current = section.getAttribute('id');
        }
      });

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Container>
      <HeroSection>
        <FaCookie style={{ fontSize: '4rem', marginBottom: '20px' }} />
        <Title>Cookie Policy</Title>
        <HeroText>
          At Schoolemy, we use cookies and similar tracking technologies to improve your browsing experience, 
          enhance website performance, and provide personalized services.
        </HeroText>
        <LastUpdated>Last Updated: December 2025</LastUpdated>
      </HeroSection>

      <ContentWrapper>
      <QuickNav>
        <NavCard 
          href="#what-are-cookies"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('what-are-cookies')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <FaCookie />
          <span>What Are Cookies?</span>
        </NavCard>

        <NavCard 
          href="#types"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('types')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <FaShieldAlt />
          <span>Types of Cookies</span>
        </NavCard>

        <NavCard 
          href="#third-party"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('third-party')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <FaGlobe />
          <span>Third-Party Cookies</span>
        </NavCard>

        <NavCard 
          href="#why-we-use"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('why-we-use')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <FaChartLine />
          <span>Why We Use Cookies</span>
        </NavCard>

        <NavCard 
          href="#manage"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('manage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <FaCog />
          <span>Manage Cookies</span>
        </NavCard>

        <NavCard 
          href="#consent"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('consent')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <FaUserCheck />
          <span>Consent</span>
        </NavCard>

        <NavCard 
          href="#updates"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('updates')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <FaSync />
          <span>Policy Updates</span>
        </NavCard>

        <NavCard 
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <FaEnvelope />
          <span>Contact Us</span>
        </NavCard>
      </QuickNav>

      <Section id="what-are-cookies">
        <SectionTitle>
          <FaCookie />
          1. What Are Cookies?
        </SectionTitle>
        <Text>
          Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a website. 
          These cookies help websites remember your preferences, login details, and improve the user experience.
        </Text>
        <Text>
          Cookies may also be used for security, analytics, and personalized marketing.
        </Text>
      </Section>

      <Section id="types">
        <SectionTitle>
          <FaShieldAlt />
          2. Types of Cookies We Use
        </SectionTitle>
        <Text>Schoolemy uses the following types of cookies:</Text>

        <SubSection>
          <SubTitle>a. Essential (Required) Cookies</SubTitle>
          <Text>These cookies are necessary for platform functionality, including:</Text>
          <List>
            <li>Login authentication</li>
            <li>Secure session management</li>
            <li>Cart functionality</li>
            <li>Course access and navigation</li>
          </List>
          <HighlightBox>
            <p>⚠️ Without these cookies, the website cannot function properly.</p>
          </HighlightBox>
        </SubSection>

        <SubSection>
          <SubTitle>b. Performance & Analytics Cookies</SubTitle>
          <Text>These cookies collect anonymous information to help us understand:</Text>
          <List>
            <li>How users navigate the site</li>
            <li>Most viewed pages</li>
            <li>Loading issues</li>
            <li>User behavior patterns</li>
          </List>
          <Text>We use tools like Google Analytics to improve platform speed and user experience.</Text>
        </SubSection>

        <SubSection>
          <SubTitle>c. Functional Cookies</SubTitle>
          <Text>These cookies remember your preferences such as:</Text>
          <List>
            <li>Language settings</li>
            <li>Theme preferences</li>
            <li>Saved courses</li>
            <li>Communication preferences</li>
          </List>
          <Text>They help personalize your overall experience.</Text>
        </SubSection>

        <SubSection>
          <SubTitle>d. Advertising & Marketing Cookies</SubTitle>
          <Text>These cookies track your activity to show relevant ads or promotions. They may collect:</Text>
          <List>
            <li>Course interests</li>
            <li>Browsing patterns</li>
            <li>Referral information</li>
          </List>
          <Text>
            We may work with trusted advertising partners, but no sensitive personal data is shared.
          </Text>
        </SubSection>
      </Section>

      <Section id="third-party">
        <SectionTitle>
          <FaGlobe />
          3. Third-Party Cookies
        </SectionTitle>
        <Text>Some cookies may be placed by third-party services such as:</Text>
        <List>
          <li>Google Analytics</li>
          <li>YouTube (for embedded video lessons)</li>
          <li>Marketing or remarketing tools</li>
        </List>
        <HighlightBox>
          <p>
            These third parties follow their own privacy and cookie policies. Schoolemy does not share 
            personal information unless required for service functionality.
          </p>
        </HighlightBox>

        <SubSection>
          <SubTitle>Payment Cookies</SubTitle>
          <Text>
            During checkout, third-party payment processors (such as Cashfree) may set cookies or use other storage
            to process transactions, maintain session integrity, and detect fraud. Cashfree may collect transaction
            identifiers and basic technical information as part of the payment flow.
          </Text>
          <Text>
            We do NOT store card numbers, CVV, UPI PINs, or bank credentials on our servers — all sensitive payment data is handled by the payment gateway.
          </Text>
        </SubSection>
      </Section>

      <Section id="why-we-use">
        <SectionTitle>
          <FaChartLine />
          4. Why We Use Cookies
        </SectionTitle>
        <Text>We use cookies to:</Text>
        <List>
          <li>Improve website performance</li>
          <li>Keep you logged in securely</li>
          <li>Provide personalized course recommendations</li>
          <li>Analyze platform usage for enhancements</li>
          <li>Ensure smooth payment processing</li>
          <li>Show relevant ads or offers</li>
        </List>
        <Text>Cookies help us deliver a smoother, faster, and more tailored learning experience.</Text>
      </Section>

      <Section id="manage">
        <SectionTitle>
          <FaCog />
          5. How to Manage or Disable Cookies
        </SectionTitle>
        <Text>You can manage or disable cookies through your browser settings. You may:</Text>
        <List>
          <li>Block all cookies</li>
          <li>Allow only selected cookies</li>
          <li>Delete existing cookies</li>
          <li>Clear browsing data</li>
        </List>
        
        <HighlightBox>
          <p>
            ⚠️ Note: Blocking essential cookies may cause parts of the website to stop working 
            (for example, login or payments).
          </p>
        </HighlightBox>

        <SubTitle style={{ marginTop: '30px' }}>Popular Browser Settings:</SubTitle>
        <BrowserSettings>
          <BrowserCard>
            <strong>Chrome</strong> → Settings → Privacy & Security → Cookies
          </BrowserCard>
          <BrowserCard>
            <strong>Safari</strong> → Preferences → Privacy
          </BrowserCard>
          <BrowserCard>
            <strong>Firefox</strong> → Options → Privacy & Security
          </BrowserCard>
          <BrowserCard>
            <strong>Edge</strong> → Settings → Site Permissions → Cookies
          </BrowserCard>
        </BrowserSettings>
      </Section>

      <Section id="consent">
        <SectionTitle>
          <FaUserCheck />
          6. Consent for Cookies
        </SectionTitle>
        <Text>
          By using GKVK - Gurukula Vidyalaya Kendra, you agree to the use of cookies as outlined in this policy. 
          A cookie consent banner may appear when you first visit, giving you the option to accept 
          or customize cookie preferences.
        </Text>
      </Section>

      <Section id="updates">
        <SectionTitle>
          <FaSync />
          7. Updates to This Cookie Policy
        </SectionTitle>
        <Text>GKVK - Gurukula Vidyalaya Kendra may update this Cookie Policy periodically to reflect:</Text>
        <List>
          <li>New features</li>
          <li>Legal requirements</li>
          <li>Security updates</li>
          <li>Technology changes</li>
        </List>
        <Text>Updates will be posted with a revised "Last Updated" date.</Text>
      </Section>

      <Section id="contact">
        <SectionTitle>
          <FaEnvelope />
          8. Contact Us
        </SectionTitle>
        <Text>If you have questions about our Cookie Policy, please contact us:</Text>
        <ContactBox>
          <h3>Get in Touch</h3>
          <p>
            📧 Email: <a href="mailto:schoolemygkvk@gmail.com">schoolemygkvk@gmail.com</a>
          </p>
          <p>
            📞 Phone: <a href="tel:+919344596648">+91 93445 96648</a>
          </p>
        </ContactBox>
      </Section>
      </ContentWrapper>
    </Container>
  );
};

export default CookiePolicy;
