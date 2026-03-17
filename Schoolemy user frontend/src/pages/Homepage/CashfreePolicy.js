import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaShieldAlt, FaMoneyBillWave, FaUserLock, FaGlobe } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  padding: 60px 20px;
  border-radius: 0 0 30px 30px;
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.6rem;
  margin: 0 0 12px 0;
`;

const Text = styled.p`
  color: #0f172a;
  line-height: 1.7;
  margin: 12px 0;
`;

const Section = styled.section`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(2,6,23,0.06);
`;

const SubTitle = styled.h3`
  margin-top: 0;
`;

const List = styled.ul`
  margin-left: 20px;
`;

const ListItem = styled.li`
  margin: 8px 0;
`;

const CashfreePolicy = () => {
  return (
    <Container>
      <HeroSection>
        <Title>Cashfree Payment Policy</Title>
        <p style={{ maxWidth: 800, margin: '0 auto' }}>
          This page explains how Cashfree is used to process payments on Schoolemy and what information is collected during transactions.
        </p>
      </HeroSection>

      <Section>
        <SubTitle>
          <FaUserLock /> What Information We Collect
        </SubTitle>
        <List>
          <ListItem>Name, email, phone number</ListItem>
          <ListItem>Payment transaction details (payment ID, status)</ListItem>
          <ListItem>Basic technical data like IP address and browser type</ListItem>
        </List>
        <Text>👉 We do NOT store card, UPI, or bank details. All payments are securely processed by Cashfree Payment Gateway.</Text>
      </Section>

      <Section>
        <SubTitle>
          <FaShieldAlt /> How We Use Your Information
        </SubTitle>
        <List>
          <ListItem>To process payments</ListItem>
          <ListItem>To provide services and customer support</ListItem>
          <ListItem>To improve our website and services</ListItem>
          <ListItem>To meet legal requirements</ListItem>
        </List>
      </Section>

      <Section>
        <SubTitle>
          <FaMoneyBillWave /> Payment Security
        </SubTitle>
        <Text>Payments are handled by Cashfree Payments India Pvt. Ltd., which follows PCI-DSS security standards.</Text>
      </Section>

      <Section>
        <SubTitle>
          <FaGlobe /> Data Sharing
        </SubTitle>
        <Text>We do not sell or share your personal data except:</Text>
        <List>
          <ListItem>With Cashfree for payment processing</ListItem>
          <ListItem>When required by law</ListItem>
        </List>
      </Section>
    </Container>
  );
};

export default CashfreePolicy;
