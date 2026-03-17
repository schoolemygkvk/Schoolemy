import React, { useState, useEffect, useRef } from 'react';
import api from '../../../../Utils/api';
import { secureStorage } from '../../../../Utils/security';

const CategoryDisplay = () => {
  const categories = [
    "Yoga",
    "Siddha Medicine",
    "Astrology",
    "Varma Therapy",
    "Ayurveda",
    "Pain Management",
    "Technology",
    "Business",
    "Personal Development",
    "Creative Arts",
    "Health & Wellness",
    "Academic",
    "Language Learning",
    "Career Development"
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get token from secureStorage
  const getAuthToken = () => {
    return secureStorage.getItem('token');
  };

  // Create axios instance with base configuration
  const apiRef = useRef(null);
  if (!apiRef.current) {
    apiRef.current = api; // Use the main api instance
  }

  // Fetch courses when category is selected
  useEffect(() => {
    if (!selectedCategory) return;

    const fetchCourses = async (categoryName) => {
      setLoading(true);
      setError('');
      try {
        const response = await apiRef.current.get(`/api/courses/courses/category/${encodeURIComponent(categoryName)}`);
        const data = response.data;

        if (data.success) {
          setCourses(data.data);
        } else {
          setError(data.error || 'Failed to fetch courses');
          setCourses([]);
        }
      } catch (err) {
        if (err.response) {
          if (err.response.status === 401) {
            setError('Authentication failed. Please login again.');
          } else if (err.response.status === 403) {
            setError('You do not have permission to access this resource.');
          } else {
            setError(err.response.data?.error || 'Failed to fetch courses');
          }
        } else if (err.request) {
          setError('Network error. Please check your connection.');
        } else {
          setError('Error fetching courses. Please try again.');
        }
        setCourses([]);
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCourses([]);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAuthenticated = () => {
    return !!getAuthToken();
  };

  // Clean and simple styles
  const styles = {
    app: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      background: '#f8f9fa',
      minHeight: '100vh',
      color: '#1a202c',
      margin: 0,
      padding: 0
    },
    '@keyframes gradientShift': {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' }
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px',
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center'
    },
    header: {
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      color: '#1a202c',
      padding: '24px 0',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    backButton: {
      background: '#f3f4f6',
      border: '1px solid #e5e7eb',
      color: '#374151',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: selectedCategory ? 'flex' : 'none',
      alignItems: 'center',
      gap: '8px'
    },
    title: {
      fontSize: selectedCategory ? '2rem' : '2.5rem',
      fontWeight: '700',
      marginBottom: '8px',
      color: '#111827',
      transition: 'all 0.3s ease'
    },
    titleContainer: {
      flex: 1,
      textAlign: 'center',
      margin: '0 auto'
    },
    mainContent: {
      padding: '40px 0'
    },
    searchBar: {
      marginBottom: '40px'
    },
    searchContainer: {
      position: 'relative',
      maxWidth: '500px',
      margin: '0 auto'
    },
    searchInput: {
      width: '100%',
      padding: '14px 50px 14px 20px',
      fontSize: '1rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      background: '#ffffff',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.2s ease',
      outline: 'none',
      color: '#1a202c'
    },
    searchIcon: {
      position: 'absolute',
      right: '24px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '1.4rem',
      opacity: 0.4,
      pointerEvents: 'none'
    },
    categoriesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
      padding: '20px 0'
    },
    categoryCard: (index, isSelected) => ({
      borderRadius: '12px',
      padding: '32px 24px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      minHeight: '180px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      background: getCategoryColor(index),
      border: '1px solid rgba(0, 0, 0, 0.05)'
    }),
    cardContent: {
      position: 'relative',
      zIndex: 2,
      width: '100%',
      textAlign: 'center'
    },
    categoryIcon: {
      fontSize: '3rem',
      marginBottom: '16px',
      display: 'block'
    },
    categoryName: {
      fontSize: '1.4rem',
      fontWeight: 600,
      color: 'white',
      margin: 0,
      lineHeight: 1.3
    },
    coursesSection: {
      marginTop: '40px'
    },
    sectionTitle: {
      fontSize: '2rem',
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: '32px',
      color: '#111827'
    },
    coursesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
      gap: '32px',
      padding: '20px 0'
    },
    courseCard: {
      background: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      border: '1px solid #e5e7eb'
    },
    courseHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
      gap: '12px'
    },
    courseName: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1a202c',
      margin: 0,
      flex: 1,
      lineHeight: 1.3,
      letterSpacing: '-0.01em'
    },
    courseLevel: {
      background: '#667eea',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: '600',
      whiteSpace: 'nowrap'
    },
    courseInfo: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '20px',
      fontSize: '0.95rem',
      color: '#4a5568'
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#6b7280',
      fontWeight: '400'
    },
    courseDescription: {
      color: '#4a5568',
      fontSize: '1rem',
      lineHeight: 1.6,
      marginBottom: '24px',
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    },
    priceSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    originalPrice: {
      textDecoration: 'line-through',
      color: '#a0aec0',
      fontSize: '1rem',
      fontWeight: '500'
    },
    finalPrice: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#111827'
    },
    discountBadge: {
      background: '#48bb78',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '600'
    },
    instructor: {
      fontSize: '0.95rem',
      color: '#4a5568',
      marginBottom: '16px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.95rem',
      color: '#f59e0b',
      fontWeight: '600'
    },
    enrollment: {
      fontSize: '0.95rem',
      color: '#718096',
      fontWeight: '500'
    },
    loading: {
      textAlign: 'center',
      padding: '60px 20px',
      fontSize: '1rem',
      color: '#6b7280'
    },
    error: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#dc2626',
      fontSize: '1rem',
      background: '#fef2f2',
      borderRadius: '8px',
      border: '1px solid #fecaca'
    },
    noResults: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#6b7280'
    },
    noResultsTitle: {
      fontSize: '1.5rem',
      marginBottom: '8px',
      color: '#111827',
      fontWeight: '600'
    },
    noResultsText: {
      fontSize: '1rem',
      color: '#6b7280'
    },
    authWarning: {
      background: '#fef3c7',
      border: '1px solid #fde68a',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
      textAlign: 'center',
      color: '#92400e',
      fontSize: '0.9rem'
    }
  };

  // Helper functions
  function getCategoryColor(index) {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
      'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
    ];
    return colors[index % colors.length];
  }

  function getCategoryIcon(categoryName) {
    const icons = {
      'Yoga': '🧘',
      'Siddha Medicine': '🌿',
      'Astrology': '⭐',
      'Varma Therapy': '🖐️',
      'Ayurveda': '🌱',
      'Pain Management': '😌',
      'Technology': '💻',
      'Business': '💼',
      'Personal Development': '🚀',
      'Creative Arts': '🎨',
      'Health & Wellness': '❤️',
      'Academic': '📚',
      'Language Learning': '🗣️',
      'Career Development': '📈'
    };
    return icons[categoryName] || '📁';
  }

  const handleCardMouseEnter = (e) => {
    if (!selectedCategory) {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    }
  };

  const handleCardMouseLeave = (e) => {
    if (!selectedCategory) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    }
  };

  const handleCourseCardHover = (e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    e.currentTarget.style.borderColor = '#d1d5db';
  };

  const handleCourseCardLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    e.currentTarget.style.borderColor = '#e5e7eb';
  };

  const handleBackButtonHover = (e) => {
    e.currentTarget.style.background = '#e5e7eb';
  };

  const handleBackButtonLeave = (e) => {
    e.currentTarget.style.background = '#f3f4f6';
  };

  return (
    <div style={styles.app}>
      <style>
        {`
          input:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
          }
        `}
      </style>
      
      {!selectedCategory && (
        <div style={{...styles.mainContent, paddingTop: '40px', paddingBottom: '0'}}>
          <div style={styles.container}>
            <div style={styles.searchBar}>
              <div style={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                <div style={styles.searchIcon}>🔍</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <header style={styles.header}>
        <div style={styles.container}>
          <button 
            style={styles.backButton}
            onClick={handleBackToCategories}
            onMouseEnter={handleBackButtonHover}
            onMouseLeave={handleBackButtonLeave}
          >
            <span>←</span>
            <span>Back to Categories</span>
          </button>
          <div style={styles.titleContainer}>
            <h1 style={styles.title}>
              {selectedCategory ? `${selectedCategory} Courses` : 'Knowledge Categories'}
            </h1>
            <p style={styles.subtitle}>
              {selectedCategory 
                ? `Explore our ${selectedCategory.toLowerCase()} courses` 
                : 'Explore our diverse range of learning categories'
              }
            </p>
          </div>
        </div>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.container}>
          {!isAuthenticated() && (
            <div style={styles.authWarning}>
              ⚠️ You are not authenticated. Some features may not work properly.
            </div>
          )}

          {!selectedCategory ? (
            <>
              
              <div style={styles.categoriesGrid}>
                {filteredCategories.map((category, index) => (
                  <div
                    key={category}
                    style={styles.categoryCard(index, selectedCategory === category)}
                    onClick={() => handleCategoryClick(category)}
                    onMouseEnter={handleCardMouseEnter}
                    onMouseLeave={handleCardMouseLeave}
                    data-category={category}
                  >
                    <div style={styles.cardContent}>
                      <div style={styles.categoryIcon}>
                        {getCategoryIcon(category)}
                      </div>
                      <h3 style={styles.categoryName}>{category}</h3>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCategories.length === 0 && (
                <div style={styles.noResults}>
                  <h3 style={styles.noResultsTitle}>No categories found</h3>
                  <p style={styles.noResultsText}>Try adjusting your search terms</p>
                </div>
              )}
            </>
          ) : (
            <div style={styles.coursesSection}>
              {loading && <div style={styles.loading}>Loading courses...</div>}
              
              {error && <div style={styles.error}>{error}</div>}
              
              {!loading && !error && courses.length > 0 && (
                <>
                  <h2 style={styles.sectionTitle}>
                    {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Available
                  </h2>
                  <div style={styles.coursesGrid}>
                    {courses.map((course) => (
                      <div
                        key={course._id}
                        style={styles.courseCard}
                        onMouseEnter={handleCourseCardHover}
                        onMouseLeave={handleCourseCardLeave}
                      >
                        <div style={styles.courseHeader}>
                          <h3 style={styles.courseName}>{course.coursename}</h3>
                          {course.level && (
                            <span style={styles.courseLevel}>{course.level}</span>
                          )}
                        </div>
                        
                        <div style={styles.courseInfo}>
                          {course.courseduration && (
                            <span style={styles.infoItem}>⏱️ {course.courseduration}</span>
                          )}
                          {course.language && (
                            <span style={styles.infoItem}>🌐 {course.language}</span>
                          )}
                          {course.certificates && (
                            <span style={styles.infoItem}>📜 {course.certificates}</span>
                          )}
                        </div>
                        
                        {course.description && (
                          <p style={styles.courseDescription}>
                            {course.description}
                          </p>
                        )}
                        
                        {course.price && (
                          <div style={styles.priceSection}>
                            {course.price.discount > 0 && (
                              <>
                                <span style={styles.originalPrice}>
                                  {course.price.currency} {course.price.amount}
                                </span>
                                <span style={styles.discountBadge}>
                                  {course.price.discount}% OFF
                                </span>
                              </>
                            )}
                            <span style={styles.finalPrice}>
                              {course.price.currency} {course.price.finalPrice || course.price.amount}
                            </span>
                          </div>
                        )}
                        
                        {course.instructor?.name && (
                          <div style={styles.instructor}>
                            👨‍🏫 Instructor: {course.instructor.name}
                          </div>
                        )}
                        
                        <div style={styles.rating}>
                          ⭐ {course.rating || 'No ratings yet'}
                          {course.studentEnrollmentCount && (
                            <span style={styles.enrollment}>
                              • 👥 {course.studentEnrollmentCount} students
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {!loading && !error && courses.length === 0 && (
                <div style={styles.noResults}>
                  <h3 style={styles.noResultsTitle}>No courses found</h3>
                  <p style={styles.noResultsText}>
                    No courses available for {selectedCategory} category yet. Check back soon!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CategoryDisplay;
