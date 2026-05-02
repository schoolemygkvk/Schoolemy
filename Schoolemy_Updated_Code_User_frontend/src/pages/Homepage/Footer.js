// src/components/Footer.js

import React from 'react';
import { Link } from 'react-router-dom';
import styled from "styled-components";
import { FaYoutube, FaFacebookF, FaInstagram, FaTwitter, FaHeart } from 'react-icons/fa';

// --- STYLED COMPONENTS ---

const FooterWrapper = styled.footer`
  /* Keeping the same background color */
  background-color: ${({ theme }) => theme.colors.neutral[900]};
  padding: ${({ theme }) => theme.spacing[16]} 0;
  width: 100%;
  position: relative;
  
  /* Remove max-width, margin and border-radius for full-screen effect */
  margin: 0;
  box-shadow: none;
`;

const Container = styled.div`
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 5%;
  
  @media (min-width: 1800px) {
    max-width: 1800px;
  }
`;

const MainFooter = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing[16]};
  padding-bottom: ${({ theme }) => theme.spacing[16]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[700]};
  
  @media (min-width: 1200px) {
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
  }
`;

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const LogoInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
`;

const LogoImage = styled.img`
  height: 85px;
  width: auto;
  align-self: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  border-radius: 16px; /* Rounded corner design */
  overflow: hidden;
`;

const SocialIcons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const SocialLink = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.neutral[800]};
  color: ${({ iconcolor, theme }) => iconcolor || theme.colors.neutral[400]};
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 1.2rem;

  &:hover {
    background-color: ${({ iconcolor, theme }) =>
      iconcolor || theme.colors.secondary[500]};
    color: ${({ theme }) => theme.colors.text.inverse};
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
`;

const ColumnTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.size.base};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  color: ${({ theme }) => theme.colors.text.inverse}; /* White text */
  margin: 0 0 ${({ theme }) => theme.spacing[6]} 0;
`;

const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.neutral[400]}; /* Light gray text */
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.base};

  &:hover {
    color: ${({ theme }) => theme.colors.text.inverse}; /* White on hover */
    padding-left: ${({ theme }) => theme.spacing[2]};
  }
`;

const BottomFooter = styled.div`
  padding-top: ${({ theme }) => theme.spacing[8]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[4]};
`;

const CopyrightText = styled.p`
  color: ${({ theme }) => theme.colors.neutral[500]}; /* Darker gray text */
  font-size: ${({ theme }) => theme.typography.size.sm};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};

  svg {
    color: ${({ theme }) => theme.colors.error.main};
  }
`;

// --- REACT COMPONENT ---

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterWrapper>
      <Container>
        <MainFooter>
          {/* Column 1: Logo and Socials */}
          <FooterColumn>
            <LogoInfo>
              <LogoImage src="/Logo1.jpg" alt="Learnly Logo" />
              <SocialIcons>
                <SocialLink
                  href="https://facebook.com"
                  target="_blank"
                  aria-label="Facebook"
                  iconcolor="#1877F2"
                >
                  <FaFacebookF />
                </SocialLink>
                <SocialLink
                  href="https://instagram.com"
                  target="_blank"
                  aria-label="Instagram"
                  iconcolor="#E4405F"
                >
                  <FaInstagram />
                </SocialLink>
                <SocialLink
                  href="https://twitter.com"
                  target="_blank"
                  aria-label="Twitter"
                  iconcolor="#1DA1F2"
                >
                  <FaTwitter />
                </SocialLink>
                <SocialLink
                  href="https://youtube.com"
                  target="_blank"
                  aria-label="YouTube"
                  iconcolor="#FF0000"
                >
                  <FaYoutube />
                </SocialLink>
              </SocialIcons>
            </LogoInfo>
          </FooterColumn>

          {/* Column 2: Popular Courses */}
          <FooterColumn>
            <ColumnTitle>Popular Courses</ColumnTitle>
            <LinkList>
              <FooterLink to="/course">Siddha Medicine</FooterLink>
              <FooterLink to="/course">Ayurveda</FooterLink>
              <FooterLink to="/course">Varma Therapy</FooterLink>
              <FooterLink to="/course">Yoga & Meditation</FooterLink>
              <FooterLink to="/course">Naturopathy</FooterLink>
            </LinkList>
          </FooterColumn>
          
          {/* Column 3: Quick Links */}
          <FooterColumn>
            <ColumnTitle>Quick Links</ColumnTitle>
            <LinkList>
              <FooterLink to="/">About Us</FooterLink>
              <FooterLink to="/course">All Courses</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
              <FooterLink to="/blogs">Blog</FooterLink>

            </LinkList>
          </FooterColumn>

          {/* Column 4: Contact Info */}
          <FooterColumn>
              <ColumnTitle>Get in touch</ColumnTitle>
              <LinkList>
                  <FooterLink to="tel:+919344596648">+91 9344596648</FooterLink>
                  <FooterLink to="mailto:contact@learnly.com">schoolemygkvk@gmail.com</FooterLink>
                  <CopyrightText style={{color: '#a8a29e', paddingTop: '8px'}}>Tamilnadu, India</CopyrightText>
              </LinkList>
          </FooterColumn>
        </MainFooter>

        <BottomFooter>
            <CopyrightText>
              © {currentYear} GKVK - Gurukula Vidyalaya Kendra. Made by <FaHeart /> LOGICAL MINDS IT
            </CopyrightText>
            <LinkList style={{flexDirection: 'row', gap: '24px'}}>
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/terms">Terms of Service</FooterLink>
              <FooterLink to="/cookies">Cookie Policy</FooterLink>
            </LinkList>
        </BottomFooter>
      </Container>
    </FooterWrapper>
  );
};

export default Footer;