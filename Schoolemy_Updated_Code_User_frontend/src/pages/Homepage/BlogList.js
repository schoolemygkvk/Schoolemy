import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedBlogs, getImageUrl } from '../../service/blogApi.js';
import { getSafeSearchDisplay, logSearchActivity } from '../../utils/searchSanitizer.js';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSmallMobile, setIsSmallMobile] = useState(() => window.innerWidth < 480);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 480);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await getPublishedBlogs();
      setBlogs(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags
  const allTags = [...new Set(blogs.flatMap(blog => blog.tags || []))];

  // Filter blogs
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || blog.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const styles = getStyles(isMobile, isSmallMobile);

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.leftSection}>
            <h1 style={styles.heroTitle}>Our Blog</h1>
            <p style={styles.heroSubtitle}>
              Discover insights, tutorials, and updates from our team
            </p>
          </div>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => {
                const newSearchTerm = e.target.value;
                setSearchTerm(newSearchTerm);
                // SECURITY FIX 3.40.1: Log search activity for monitoring
                if (newSearchTerm.length > 0) {
                  logSearchActivity(newSearchTerm, {
                    context: 'blog-search',
                    resultsCount: filteredBlogs.length
                  });
                }
              }}
              style={styles.searchInput}
            />
            <span style={styles.searchIcon}></span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        {!isMobile && (
          <aside style={styles.sidebar}>
            <div style={styles.sidebarSection}>
              <h3 style={styles.sidebarTitle}>Categories</h3>
              <div style={styles.categoryList}>
                <button
                  onClick={() => setSelectedTag('')}
                  style={{
                    ...styles.categoryButton,
                    ...(selectedTag === '' ? styles.categoryButtonActive : {})
                  }}
                >
                  <span style={styles.categoryText}>All Articles</span>
                  <span style={styles.categoryCount}>{blogs.length}</span>
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    style={{
                      ...styles.categoryButton,
                      ...(selectedTag === tag ? styles.categoryButtonActive : {})
                    }}
                  >
                    <span style={styles.categoryText}>{tag}</span>
                    <span style={styles.categoryCount}>
                      {blogs.filter(blog => blog.tags?.includes(tag)).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div style={styles.sidebarSection}>
              <h3 style={styles.sidebarTitle}>Popular Tags</h3>
              <div style={styles.popularTags}>
                {allTags.slice(0, 8).map((tag) => (
                  <span
                    key={tag}
                    style={styles.popularTag}
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Blog Content */}
        <main style={styles.blogContent}>
          {/* Mobile Filters */}
          {isMobile && (
            <div style={styles.mobileFilters}>
              <div style={styles.mobileFilterSection}>
                <h4 style={styles.mobileFilterTitle}>Categories</h4>
                <div style={styles.mobileCategoryList}>
                  <button
                    onClick={() => setSelectedTag('')}
                    style={{
                      ...styles.mobileCategoryButton,
                      ...(selectedTag === '' ? styles.mobileCategoryButtonActive : {})
                    }}
                  >
                    All Articles ({blogs.length})
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      style={{
                        ...styles.mobileCategoryButton,
                        ...(selectedTag === tag ? styles.mobileCategoryButtonActive : {})
                      }}
                    >
                      {tag} ({blogs.filter(blog => blog.tags?.includes(tag)).length})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <div style={styles.errorContent}>
                <span style={styles.errorIcon}></span>
                <span style={styles.errorText}>{error}</span>
                <button onClick={fetchBlogs} style={styles.retryButton}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>Loading articles...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}></div>
              <h3 style={styles.emptyStateTitle}>No articles found</h3>
              <p style={styles.emptyStateText}>
                {searchTerm || selectedTag
                  ? `Try adjusting your search${searchTerm ? ` for "${getSafeSearchDisplay(searchTerm)}"` : ''} or filters`
                  : 'Check back soon for new content!'}
              </p>
              {(searchTerm || selectedTag) && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTag('');
                  }}
                  style={styles.clearFiltersButton}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={styles.resultsHeader}>
                <div>
                  <h2 style={styles.resultsTitle}>
                    {selectedTag ? `Tag: ${selectedTag}` : 'All Articles'}
                  </h2>
                  <p style={styles.resultsSubtitle}>
                    {filteredBlogs.length} {filteredBlogs.length === 1 ? 'article' : 'articles'} found
                  </p>
                </div>
                {isMobile && selectedTag && (
                  <button 
                    onClick={() => setSelectedTag('')}
                    style={styles.clearTagButton}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div style={styles.blogGrid}>
                {filteredBlogs.map((blog) => (
                  <article
                    key={blog._id}
                    style={styles.blogCard}
                    onClick={() => navigate(`/blogs/${blog._id}`)}
                  >
                    {blog.image && (
                      <div style={styles.imageContainer}>
                        <img
                          src={getImageUrl(blog.image)}
                          alt={blog.title}
                          style={styles.image}
                        />
                        <div style={styles.imageOverlay}></div>
                      </div>
                    )}

                    <div style={styles.cardContent}>
                      <div style={styles.cardMeta}>
                        <span style={styles.author}>By {blog.author}</span>
                        <span style={styles.dot}>•</span>
                        <span style={styles.date}>{formatDate(blog.createdAt)}</span>
                      </div>

                      <h2 style={styles.cardTitle}>{blog.title}</h2>
                      <p style={styles.cardExcerpt}>{blog.excerpt}</p>

                      {blog.tags && blog.tags.length > 0 && (
                        <div style={styles.tags}>
                          {blog.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index} 
                              style={styles.tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(tag);
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                          {blog.tags.length > 3 && (
                            <span style={styles.moreTags}>+{blog.tags.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div style={styles.cardFooter}>
                        <button style={styles.readMore}>
                          Read Article
                          <span style={styles.arrow}>→</span>
                        </button>
                        <div style={styles.readTime}>5 min read</div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const getStyles = (isMobile, isSmallMobile) => ({
  container: {
    minHeight: '100vh',
    background: 'transparent',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: 'hidden'
  },
  hero: {
    background: 'transparent',
    color: '#1e293b',
    padding: isSmallMobile ? '32px 16px 24px' : isMobile ? '40px 20px 30px' : '50px 20px 40px',
    position: 'relative',
    overflow: 'hidden'
  },
  heroContent: {
    maxWidth: '2200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: isMobile ? 'center' : 'space-between',
    alignItems: isMobile ? 'center' : 'center',
    position: 'relative',
    zIndex: 2
  },
  leftSection: {
    flex: 1,
    textAlign: isMobile ? 'center' : 'left'
  },
  heroTitle: {
    margin: '0 0 12px 0',
    fontSize: isSmallMobile ? '1.75rem' : isMobile ? '2.25rem' : '3.5rem',
    fontWeight: '800',
    color: '#1e293b'
  },
  heroSubtitle: {
    margin: '0 0 24px 0',
    fontSize: isSmallMobile ? '0.95rem' : isMobile ? '1.1rem' : '1.25rem',
    opacity: 0.9,
    fontWeight: '400',
    maxWidth: '600px',
    lineHeight: '1.5'
  },
  searchContainer: {
    position: 'relative',
    width: isMobile ? '100%' : '400px',
    maxWidth: '100%',
    margin: isMobile ? '16px 0 0 0' : '0'
  },
  searchInput: {
    width: '100%',
    padding: isSmallMobile ? '14px 44px 14px 16px' : isMobile ? '16px 50px 16px 20px' : '18px 50px 18px 24px',
    fontSize: isSmallMobile ? '14px' : '16px',
    border: 'none',
    borderRadius: '50px',
    outline: 'none',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)'
  },
  searchIcon: {
    position: 'absolute',
    right: isSmallMobile ? '14px' : '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '20px'
  },
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto 0',
    padding: isSmallMobile ? '0 12px 48px' : isMobile ? '0 16px 60px' : '0 20px 80px',
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
    gap: isMobile ? '24px' : '40px',
    position: 'relative'
  },
  sidebar: {
    height: 'fit-content'
  },
  sidebarSection: {
    background: 'transparent',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.05)'
  },
  sidebarTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#2c3e50'
  },
  categoryList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '8px'
  },
  categoryButton: {
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#77797cff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left'
  },
  categoryButtonActive: {
    background: 'linear-gradient(135deg, #e3eaf4ff 0%, #EFEBE5 100%)',
    color: '#1e293b',
  
  },
  categoryText: {
    flex: 1
  },
  categoryCount: {
    fontSize: '12px',
    opacity: 0.8,
    background: 'rgba(255,255,255,0.2)',
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '30px',
    textAlign: 'center'
  },
  popularTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  popularTag: {
    padding: '6px 12px',
    background: '#f8fafc',
    borderRadius: '16px',
    fontSize: '12px',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #e2e8f0',
    fontWeight: '500'
  },
  blogContent: {
    minHeight: '400px'
  },
  mobileFilters: {
    background: 'white',
    borderRadius: isSmallMobile ? '12px' : '16px',
    padding: isSmallMobile ? '16px' : '20px',
    marginBottom: isSmallMobile ? '20px' : '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
  },
  mobileFilterSection: {
    marginBottom: '0'
  },
  mobileFilterTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#2c3e50'
  },
  mobileCategoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  mobileCategoryButton: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: '#f8fafc',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left'
  },
  mobileCategoryButtonActive: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #EFEBE5 100%)',
    color: '#1e293b',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
  },
  errorBox: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px'
  },
  errorContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: isMobile ? 'wrap' : 'nowrap'
  },
  errorIcon: {
    fontSize: '18px'
  },
  errorText: {
    flex: 1,
    fontSize: '14px'
  },
  retryButton: {
    padding: '8px 16px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderLeft: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  },
  loadingText: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyStateTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0'
  },
  emptyStateText: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 20px 0',
    lineHeight: '1.5'
  },
  clearFiltersButton: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    marginBottom: '24px',
    padding: '0 8px',
    gap: isMobile ? '16px' : '0'
  },
  resultsTitle: {
    margin: '0 0 4px 0',
    fontSize: isSmallMobile ? '20px' : isMobile ? '24px' : '28px',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: '1.3'
  },
  resultsSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500'
  },
  clearTagButton: {
    padding: '6px 12px',
    background: 'transparent',
    color: '#64748b',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    marginTop: isMobile ? '4px' : '0'
  },
  blogGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: isSmallMobile ? '16px' : '24px'
  },
  blogCard: {
    background: 'white',
    borderRadius: isSmallMobile ? '12px' : '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(0,0,0,0.03)',
    ':hover': {
      transform: isMobile ? 'none' : 'translateY(-4px)',
      boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.08)' : '0 12px 32px rgba(0,0,0,0.12)'
    }
  },
  imageContainer: {
    width: '100%',
    height: isSmallMobile ? '180px' : isMobile ? '200px' : '220px',
    overflow: 'hidden',
    position: 'relative',
    background: '#f8fafc'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease'
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)'
  },
  cardContent: {
    padding: isSmallMobile ? '16px' : isMobile ? '20px' : '24px'
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
    flexWrap: 'wrap',
    gap: '4px'
  },
  author: {
    fontWeight: '600',
    color: '#475569'
  },
  dot: {
    opacity: 0.5
  },
  date: {},
  cardTitle: {
    margin: '0 0 10px 0',
    fontSize: isSmallMobile ? '16px' : isMobile ? '18px' : '20px',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  cardExcerpt: {
    margin: '0 0 14px 0',
    color: '#64748b',
    fontSize: isSmallMobile ? '13px' : '14px',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '20px',
    alignItems: 'center'
  },
  tag: {
    padding: '4px 10px',
    background: '#f8fafc',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#475569',
    fontWeight: '600',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  moreTags: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '600'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  readMore: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  arrow: {
    transition: 'transform 0.2s ease'
  },
  readTime: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500'
  }
});

// Add CSS animation for loading spinner
const injectStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.innerText = injectStyles;
document.head.appendChild(styleSheet);

export default BlogList;