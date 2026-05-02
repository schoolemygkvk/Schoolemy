import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublishedBlogs, getImageUrl } from '../../../Utils/blogApi.js';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

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

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Our Blog</h1>
        <p style={styles.heroSubtitle}>
          Discover insights, tutorials, and updates
        </p>
      </div>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search blogs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />

        {allTags.length > 0 && (
          <div style={styles.tagFilter}>
            <button
              onClick={() => setSelectedTag('')}
              style={{
                ...styles.tagButton,
                background: !selectedTag ? '#4f46e5' : '#f1f5f9',
                color: !selectedTag ? 'white' : '#475569'
              }}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                style={{
                  ...styles.tagButton,
                  background: selectedTag === tag ? '#4f46e5' : '#f1f5f9',
                  color: selectedTag === tag ? 'white' : '#475569'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
          <button onClick={fetchBlogs} style={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading blogs...</div>
      ) : filteredBlogs.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No blogs found</h3>
          <p>
            {searchTerm || selectedTag
              ? 'Try adjusting your filters'
              : 'Check back soon for new content!'}
          </p>
        </div>
      ) : (
        <div style={styles.blogGrid}>
          {filteredBlogs.map((blog) => (
            <article
              key={blog._id}
              style={{
                ...styles.blogCard,
                ...(hoveredCard === blog._id ? styles.blogCardHover : {})
              }}
              onClick={() => navigate(`/blogs/${blog._id}`)}
              onMouseEnter={() => setHoveredCard(blog._id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {blog.image && (
                <div style={styles.imageContainer}>
                  <img
                    src={getImageUrl(blog.image)}
                    alt={blog.title}
                    style={styles.image}
                  />
                </div>
              )}

              <div style={styles.cardContent}>
                <div style={styles.meta}>
                  <span style={styles.author}>By {blog.author}</span>
                  <span style={styles.date}>{formatDate(blog.createdAt)}</span>
                </div>

                <h2 style={styles.cardTitle}>{blog.title}</h2>
                <p style={styles.cardExcerpt}>{blog.excerpt}</p>

                {blog.tags && blog.tags.length > 0 && (
                  <div style={styles.tags}>
                    {blog.tags.map((tag) => (
                      <span key={tag} style={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <button style={styles.readMore}>
                  Read More →
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {filteredBlogs.length > 0 && (
        <div style={styles.resultsInfo}>
          Showing {filteredBlogs.length} of {blogs.length} blogs
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc'
  },
  hero: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    padding: '64px 24px',
    textAlign: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  heroTitle: {
    margin: '0 0 12px 0',
    fontSize: '40px',
    fontWeight: '700',
    letterSpacing: '-0.5px'
  },
  heroSubtitle: {
    margin: 0,
    fontSize: '18px',
    opacity: 0.95
  },
  filters: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  searchInput: {
    width: '100%',
    padding: '14px 18px',
    fontSize: '15px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  tagFilter: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  tagButton: {
    padding: '8px 18px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500'
  },
  errorBox: {
    maxWidth: '1200px',
    margin: '0 auto 20px',
    padding: '0 20px'
  },
  retryButton: {
    marginLeft: '15px',
    padding: '8px 16px',
    background: '#c33',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#666'
  },
  emptyState: {
    maxWidth: '520px',
    margin: '64px auto',
    padding: '48px 40px',
    background: 'white',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0'
  },
  blogGrid: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 24px 48px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '28px'
  },
  blogCard: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
  },
  blogCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px -8px rgba(79, 70, 229, 0.25)',
    borderColor: '#c7d2fe'
  },
  imageContainer: {
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    background: '#f1f5f9'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s'
  },
  cardContent: {
    padding: '24px'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#94a3b8'
  },
  author: {
    fontWeight: '600',
    color: '#64748b'
  },
  date: {},
  cardTitle: {
    margin: '0 0 12px 0',
    fontSize: '20px',
    color: '#1e293b',
    lineHeight: '1.35',
    fontWeight: '600'
  },
  cardExcerpt: {
    margin: '0 0 16px 0',
    color: '#64748b',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '20px'
  },
  tag: {
    padding: '4px 12px',
    background: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#475569',
    fontWeight: '500'
  },
  readMore: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#4f46e5',
    border: '2px solid #4f46e5',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  resultsInfo: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px'
  }
};

export default BlogList;
