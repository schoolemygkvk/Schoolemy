import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBook,
  FiAward,
  FiActivity,
  FiDollarSign,
  FiUser,
  FiChevronRight,
  FiMessageSquare,
  FiFileText
} from "react-icons/fi";

// Add Google Fonts
const addGoogleFonts = () => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap';
  link.rel = 'stylesheet';
  if (!document.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link);
  }
};

const MainDashBoard = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Add Google Fonts
    addGoogleFonts();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Get user name from localStorage or API with better formatting
    const getUserName = () => {
      const storedUserName = localStorage.getItem('userName');
      const storedEmail = localStorage.getItem('userEmail');
      const storedFirstName = localStorage.getItem('firstName');
      const storedLastName = localStorage.getItem('lastName');
      
      if (storedFirstName && storedLastName) {
        return `${storedFirstName} ${storedLastName}`;
      } else if (storedUserName) {
        return storedUserName;
      } else if (storedEmail) {
        // Extract name from email (before @)
        return storedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      return 'Student';
    };
    
    setUserName(getUserName());
    
    return () => clearInterval(timer);
  }, []);

  const items = [
    { 
      name: "Lesson Status", 
      path: "/lesson-status", 
      icon: <FiBook />, 
      color: "#4F46E5",
      gradient: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
      description: "Track your learning progress"
    },
    // { 
    //   name: "Performance Record", 
    //   path: "#", 
    //   icon: <FiTrendingUp />, 
    //   color: "#059669",
    //   gradient: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    //   description: "View your performance metrics"
    // },
    { 
      name: "Exam Mark Record", 
      path: "/Examrecord", 
      icon: <FiAward />, 
      color: "#DC2626",
      gradient: "linear-gradient(135deg, #DC2626 0%, #F59E0B 100%)",
      description: "Check your exam results"
    },
    { 
      name: "Course Meets", 
      path: "/user/meets", 
      icon: <FiActivity />, 
      color: "#7C2D12",
      gradient: "linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)",
      description: "View your scheduled meets"
    },
    { 
      name: "Fees Record", 
      path: "/user-payment", 
      icon: <FiDollarSign />, 
      color: "#BE185D",
      gradient: "linear-gradient(135deg, #BE185D 0%, #EC4899 100%)",
      description: "Manage your payments"
    },
    { 
      name: "My Invoices", 
      path: "/user/invoices", 
      icon: <FiFileText />, 
      color: "#059669",
      gradient: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
      description: "View and download invoices"
    },
    { 
      name: "Profile", 
      path: "/profile", 
      icon: <FiUser />, 
      color: "#1E40AF",
      gradient: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
      description: "Update your profile"
    },
    { 
      name: "Complaints", 
      path: "/complaints", 
      icon: <FiMessageSquare />, // Changed to more appropriate icon
      color: "#7C3AED",
      gradient: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
      description: "Submit and track your complaints"
    },
  ];



  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleItemClick = (path) => {
    navigate(path);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.title}>Welcome Back, {userName}! 👋</h1>
          <p style={styles.subtitle}>Ready to continue your learning journey?</p>
          <div style={styles.timeWidget}>
            <span style={styles.currentTime}>{formatTime(currentTime)}</span>
            <span style={styles.currentDate}>{formatDate(currentTime)}</span>
          </div>
        </div>
      </div>
      
      <div style={styles.contentWrapper}>
        <div style={styles.mainContent}>
          {/* Main Cards Grid */}
          <div style={styles.cardSection}>
            <h3 style={styles.sectionTitle}>Dashboard Menu</h3>
            <div style={styles.cardGrid}>
              {items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.card,
                    background: hoveredCard === index ? item.gradient : 'white',
                    color: hoveredCard === index ? 'white' : '#1e293b',
                    transform: hoveredCard === index ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  }}
                  onClick={() => handleItemClick(item.path)}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={{
                    ...styles.cardIcon,
                    color: hoveredCard === index ? 'white' : item.color,
                    backgroundColor: hoveredCard === index ? 'rgba(255,255,255,0.2)' : `${item.color}15`,
                  }}>
                    {item.icon}
                  </div>
                  <div style={styles.cardContent}>
                    <div style={styles.cardText}>{item.name}</div>
                    <div style={{
                      ...styles.cardDescription,
                      color: hoveredCard === index ? 'rgba(255,255,255,0.8)' : '#64748b'
                    }}>
                      {item.description}
                    </div>
                  </div>
                  <div style={{
                    ...styles.cardArrow,
                    color: hoveredCard === index ? 'white' : '#94a3b8'
                  }}>
                    <FiChevronRight />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '1rem',
    fontFamily: "'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  welcomeSection: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    color: '#1e1b4b',
    fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
    fontWeight: '700',
    marginBottom: '0.5rem',
    lineHeight: '1.2',
    fontFamily: "'Poppins', sans-serif",
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
    margin: '0 0 1rem 0',
    lineHeight: '1.5',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '400',
  },
  timeWidget: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    marginTop: '1rem',
  },
  currentTime: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#667eea',
    fontFamily: "'Poppins', sans-serif",
  },
  currentDate: {
    fontSize: '0.9rem',
    color: '#64748b',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '400',
  },
  contentWrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  mainContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  sectionTitle: {
    color: '#1e1b4b',
    fontSize: '1.3rem',
    fontWeight: '600',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: "'Poppins', sans-serif",
  },
  cardSection: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
    width: '100%',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    padding: '1.5rem',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: 'white',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardIcon: {
    fontSize: '1.5rem',
    marginRight: '1rem',
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
  },
  cardContent: {
    flexGrow: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  cardText: {
    fontWeight: '600',
    fontSize: '1.1rem',
    transition: 'color 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
  },
  cardDescription: {
    fontSize: '0.85rem',
    transition: 'color 0.3s ease',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '400',
  },
  cardArrow: {
    fontSize: '1.2rem',
    transition: 'all 0.3s ease',
  },
  
  // Mobile Responsive Styles
  '@media (max-width: 1024px)': {
    container: {
      padding: '0.75rem',
    },
    welcomeSection: {
      maxWidth: '100%',
      padding: '1.5rem',
    },
    cardGrid: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
    },
  },
  
  '@media (max-width: 768px)': {
    container: {
      padding: '0.5rem',
    },
    welcomeSection: {
      padding: '1.25rem',
      borderRadius: '16px',
    },
    title: {
      fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
    },
    subtitle: {
      fontSize: 'clamp(0.85rem, 3vw, 1rem)',
    },
    cardGrid: {
      gridTemplateColumns: '1fr',
      gap: '0.75rem',
    },
    card: {
      padding: '1.25rem',
    },
    cardIcon: {
      padding: '0.75rem',
      fontSize: '1.25rem',
      marginRight: '0.75rem',
    },
    cardSection: {
      padding: '1.25rem',
      borderRadius: '16px',
    },
    sectionTitle: {
      fontSize: '1.2rem',
    },
  },
  
  '@media (max-width: 480px)': {
    container: {
      padding: '0.25rem',
    },
    welcomeSection: {
      padding: '1rem',
      borderRadius: '12px',
      margin: '0 0.25rem',
    },
    title: {
      fontSize: 'clamp(1.1rem, 6vw, 1.5rem)',
    },
    subtitle: {
      fontSize: 'clamp(0.8rem, 4vw, 0.95rem)',
    },
    timeWidget: {
      marginTop: '0.75rem',
    },
    currentTime: {
      fontSize: '1.25rem',
    },
    currentDate: {
      fontSize: '0.8rem',
    },
    cardSection: {
      margin: '0 0.25rem',
      padding: '1rem',
      borderRadius: '12px',
    },
    card: {
      padding: '1rem',
      borderRadius: '12px',
    },
    cardIcon: {
      padding: '0.5rem',
      fontSize: '1.1rem',
      marginRight: '0.5rem',
    },
    cardText: {
      fontSize: '1rem',
    },
    cardDescription: {
      fontSize: '0.8rem',
    },
    sectionTitle: {
      fontSize: '1.1rem',
      textAlign: 'center',
    },
  },
  
  '@media (max-width: 360px)': {
    container: {
      padding: '0.125rem',
    },
    welcomeSection: {
      padding: '0.75rem',
      margin: '0 0.125rem',
    },
    title: {
      fontSize: '1.1rem',
    },
    subtitle: {
      fontSize: '0.75rem',
    },
    currentTime: {
      fontSize: '1.1rem',
    },
    currentDate: {
      fontSize: '0.75rem',
    },
    cardSection: {
      margin: '0 0.125rem',
      padding: '0.75rem',
    },
    card: {
      padding: '0.75rem',
      gap: '0.5rem',
    },
    cardIcon: {
      padding: '0.4rem',
      fontSize: '1rem',
      marginRight: '0.4rem',
    },
    cardText: {
      fontSize: '0.9rem',
    },
    cardDescription: {
      fontSize: '0.75rem',
    },
    cardArrow: {
      fontSize: '1rem',
    },
    sectionTitle: {
      fontSize: '1rem',
    },
  }
};

export default MainDashBoard;