import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlogById, getImageUrl } from '../../service/blogApi.js';
import DOMPurify from 'dompurify';

// Convert plain text to proper HTML with paragraphs and bullet points
const formatBlogContent = (content) => {
  if (!content || typeof content !== 'string') return '';
  const trimmed = content.trim();
  if (!trimmed) return '';
  // Already HTML (contains tags)
  if (trimmed.includes('<') && trimmed.includes('>')) return trimmed;
  const paragraphs = trimmed.split(/\n\n+/);
  return paragraphs.map((block) => {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const isBulletList = lines.every((l) => /^[-*•]\s/.test(l) || /^\d+[.)]\s/.test(l));
    if (isBulletList && lines.length > 0) {
      const items = lines
        .map((l) => {
          const m = l.match(/^[-*•]\s+(.*)$/) || l.match(/^(\d+)[.)]\s+(.*)$/);
          return m ? `<li>${m[1] || m[2]}</li>` : `<li>${l}</li>`;
        })
        .join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${lines.join('<br/>')}</p>`;
  }).join('');
};

const BlogDetail = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await getBlogById(id);
      setBlog(response.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch blog');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const styles = getStyles(isMobile);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <div style={styles.loadingText}>Loading blog post...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.wrapper}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            <span style={styles.backIcon}>←</span> Back
          </button>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}></div>
            <h2 style={styles.errorTitle}>Oops! Something went wrong</h2>
            <p style={styles.errorMessage}>{error}</p>
            <button onClick={fetchBlog} style={styles.retryButton}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={styles.container}>
        <div style={styles.wrapper}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            <span style={styles.backIcon}>←</span> Back
          </button>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}></div>
            <h2 style={styles.errorTitle}>Blog not found</h2>
            <p style={styles.errorMessage}>The blog you're looking for doesn't exist.</p>
            <button onClick={() => navigate('/')} style={styles.retryButton}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <span style={styles.backIcon}>←</span> Back
        </button>

        <article style={styles.article}>
          {blog.image && (
            <div style={styles.heroImage}>
              <img
                src={getImageUrl(blog.image)}
                alt={blog.title}
                style={styles.image}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div style={styles.contentWrapper}>
            <div style={styles.header}>
              <div style={styles.categoryBadge}>
                {blog.category || 'Article'}
              </div>
              <h1 style={styles.title}>{blog.title}</h1>
              
              <div style={styles.meta}>
                <div style={styles.metaLeft}>
                  <span style={styles.author}>
                    <strong>By {blog.author}</strong>
                  </span>
                  <span style={styles.date}>
                    {formatDate(blog.createdAt)}
                  </span>
                </div>
                {blog.updatedAt !== blog.createdAt && (
                  <span style={styles.updated}>
                    Updated {formatDate(blog.updatedAt)}
                  </span>
                )}
              </div>

              {blog.tags && blog.tags.length > 0 && (
                <div style={styles.tags}>
                  {blog.tags.map((tag, index) => (
                    <span key={index} style={styles.tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {blog.excerpt && (
              <div style={styles.excerpt}>
                {blog.excerpt}
              </div>
            )}

            <div
              style={styles.content}
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatBlogContent(blog.content)) }}
            />

            <div style={styles.articleFooter}>
              <div style={styles.shareSection}>
                <h3 style={styles.shareTitle}>Share this article</h3>
                <div style={styles.shareButtons}>
                  <button
                    onClick={() => {
                      const url = window.location.href;
                      navigator.clipboard.writeText(url);
                      // You could add a toast notification here
                      alert('Link copied to clipboard!');
                    }}
                    style={styles.shareButton}
                  >
                    <span style={styles.shareIcon}></span>
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(blog.title);
                      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                    }}
                    style={styles.shareButton}
                  >
                    <span style={styles.shareIcon}></span>
                    Twitter
                  </button>
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                    }}
                    style={styles.shareButton}
                  >
                    <span style={styles.shareIcon}></span>
                    Facebook
                  </button>
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
                    }}
                    style={styles.shareButton}
                  >
                    <span style={styles.shareIcon}></span>
                    LinkedIn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

const getStyles = (isMobile) => ({
  container: {
    minHeight: '100vh',
    background: 'transparent',
    padding: '0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: 'hidden'
  },
  wrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '12px 16px' : '20px'
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: isMobile ? '10px 16px' : '12px 20px',
    background: '#4F46E5',
    color: '#ffffff',
    border: '2px solid #4338CA',
    borderRadius: '12px',
    fontSize: isMobile ? '14px' : '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: isMobile ? '20px' : '30px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
  },
  backIcon: {
    fontSize: isMobile ? '16px' : '18px',
    fontWeight: 'bold'
  },
  article: {
    background: 'transparent',
    borderRadius: isMobile ? '14px' : '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)'
  },
  heroImage: {
    width: '100%',
    height: isMobile ? '220px' : '400px',
    overflow: 'hidden',
    background: '#f8fafc',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  contentWrapper: {
    padding: '0'
  },
  header: {
    padding: isMobile ? '24px 20px 20px' : '50px 60px 30px',
    borderBottom: '1px solid #F7FAFC'
  },
  categoryBadge: {
    display: 'inline-block',
    padding: isMobile ? '6px 12px' : '8px 16px',
    background: '#667eea',
    color: 'white',
    borderRadius: '8px',
    fontSize: isMobile ? '11px' : '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: isMobile ? '14px' : '20px'
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: isMobile ? '26px' : '48px',
    lineHeight: '1.2',
    color: '#1A202C',
    fontWeight: '800',
    letterSpacing: '-0.02em'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexWrap: 'wrap',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '10px' : '15px',
    marginBottom: isMobile ? '18px' : '25px'
  },
  metaLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  author: {
    fontSize: isMobile ? '14px' : '16px',
    color: '#2D3748',
    fontWeight: '600'
  },
  date: {
    fontSize: isMobile ? '13px' : '14px',
    color: '#718096'
  },
  updated: {
    fontSize: '11px',
    color: '#A0AEC0',
    fontStyle: 'italic'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tag: {
    padding: isMobile ? '5px 10px' : '6px 12px',
    background: '#EDF2F7',
    color: '#4A5568',
    borderRadius: '8px',
    fontSize: isMobile ? '11px' : '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  excerpt: {
    padding: isMobile ? '20px 20px' : '40px 60px',
    fontSize: isMobile ? '16px' : '20px',
    lineHeight: '1.7',
    color: '#4A5568',
    fontStyle: 'italic',
    background: 'transparent',
    margin: '0',
    fontWeight: '400'
  },
  content: {
    padding: isMobile ? '24px 20px' : '50px 60px',
    fontSize: isMobile ? '16px' : '18px',
    lineHeight: '1.8',
    color: '#2D3748'
  },
  articleFooter: {
    padding: isMobile ? '24px 20px' : '40px 60px',
    background: 'transparent',
    borderTop: '1px solid #E2E8F0'
  },
  shareSection: {
    textAlign: 'center'
  },
  shareTitle: {
    margin: '0 0 20px 0',
    fontSize: isMobile ? '16px' : '18px',
    color: '#2D3748',
    fontWeight: '600'
  },
  shareButtons: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: isMobile ? '10px' : '12px'
  },
  shareButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: isMobile ? '10px 16px' : '12px 20px',
    background: '#f8fafc',
    color: '#4A5568',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
  },
  shareIcon: {
    fontSize: isMobile ? '14px' : '16px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '20px'
  },
  loadingSpinner: {
    width: isMobile ? '40px' : '50px',
    height: isMobile ? '40px' : '50px',
    border: '4px solid #E2E8F0',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: isMobile ? '16px' : '18px',
    color: '#4A5568',
    fontWeight: '500'
  },
  errorContainer: {
    background: 'transparent',
    padding: isMobile ? '40px 24px' : '60px 40px',
    borderRadius: isMobile ? '16px' : '20px',
    textAlign: 'center',
    boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.5)'
  },
  errorIcon: {
    fontSize: isMobile ? '48px' : '64px',
    marginBottom: '20px'
  },
  errorTitle: {
    margin: '0 0 15px 0',
    fontSize: isMobile ? '22px' : '28px',
    color: '#1A202C',
    fontWeight: '700'
  },
  errorMessage: {
    margin: '0 0 30px 0',
    fontSize: isMobile ? '14px' : '16px',
    color: '#718096',
    lineHeight: '1.6'
  },
  retryButton: {
    padding: isMobile ? '10px 20px' : '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
});

// Enhanced content styling with modern design
const contentStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .blog-content {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 {
    margin-top: 2.5em;
    margin-bottom: 1em;
    color: #1A202C;
    font-weight: 700;
    line-height: 1.2;
  }
  
  .blog-content h1 { 
    font-size: 2.5em; 
    border-bottom: 2px solid #E2E8F0;
    padding-bottom: 0.5em;
  }
  
  .blog-content h2 { 
    font-size: 2em; 
    border-left: 4px solid #667eea;
    padding-left: 0.8em;
  }
  
  .blog-content h3 { 
    font-size: 1.5em; 
    color: #2D3748;
  }
  
  .blog-content h4 { 
    font-size: 1.25em; 
    color: #4A5568;
  }
  
  .blog-content p {
    margin: 0 0 1.25em 0;
    line-height: 1.8;
    color: #2D3748;
  }
  
  .blog-content p:last-child {
    margin-bottom: 0;
  }
  
  .blog-content img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 2.5em auto;
    display: block;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    border: 1px solid #E2E8F0;
    transition: transform 0.3s ease;
  }
  
  .blog-content img:hover {
    transform: scale(1.02);
  }
  
  .blog-content a {
    color: #667eea;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    font-weight: 500;
  }
  
  .blog-content a:hover {
    color: #5a67d8;
    border-bottom-color: #5a67d8;
  }
  
  .blog-content code {
    background: #EDF2F7;
    padding: 0.2em 0.4em;
    border-radius: 6px;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.9em;
    color: #E53E3E;
    border: 1px solid #E2E8F0;
  }
  
  .blog-content pre {
    background: #1A202C;
    color: #E2E8F0;
    padding: 1.5em;
    border-radius: 12px;
    overflow-x: auto;
    margin: 2.5em 0;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid #2D3748;
  }
  
  .blog-content pre code {
    background: transparent;
    padding: 0;
    border: none;
    color: inherit;
    font-size: 0.9em;
  }
  
  .blog-content ul, .blog-content ol {
    margin: 0 0 1.5em 0;
    padding-left: 1.75em;
  }
  
  .blog-content ul {
    list-style-type: disc;
  }
  
  .blog-content ol {
    list-style-type: decimal;
  }
  
  .blog-content li {
    margin-bottom: 0.6em;
    line-height: 1.7;
    color: #2D3748;
    display: list-item;
  }
  
  .blog-content ul li::marker {
    color: #667eea;
  }
  
  .blog-content ol li::marker {
    color: #667eea;
    font-weight: 600;
  }
  
  .blog-content blockquote {
    border-left: 4px solid #667eea;
    padding: 1.5em 2em;
    margin: 2.5em 0;
    background: #f8fafc;
    color: #4A5568;
    font-style: italic;
    border-radius: 0 12px 12px 0;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
    position: relative;
  }
  
  .blog-content blockquote::before {
    content: '"';
    font-size: 4em;
    color: #667eea;
    position: absolute;
    left: 20px;
    top: 10px;
    opacity: 0.2;
    font-family: serif;
  }
  
  .blog-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 2.5em 0;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .blog-content table th,
  .blog-content table td {
    padding: 1em 1.2em;
    text-align: left;
    border-bottom: 1px solid #E2E8F0;
  }
  
  .blog-content table th {
    background: #667eea;
    color: white;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.85em;
  }
  
  .blog-content table tr:hover {
    background: #F7FAFC;
  }
  
  .blog-content table tr:last-child td {
    border-bottom: none;
  }
  
  .blog-content hr {
    border: none;
    height: 2px;
    background: linear-gradient(90deg, transparent, #E2E8F0, transparent);
    margin: 3em 0;
  }
  
  /* Enhanced button hover effects */
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
  }
  
  button:active {
    transform: translateY(0);
  }
  
  /* Mobile Responsive Design */
  @media (max-width: 768px) {
    .blog-content h1 { 
      font-size: 2em; 
      margin-top: 1.5em;
    }
    
    .blog-content h2 { 
      font-size: 1.75em; 
      margin-top: 1.5em;
    }
    
    .blog-content h3 { 
      font-size: 1.5em; 
      margin-top: 1.5em;
    }
    
    .blog-content {
      font-size: 16px;
    }
    
    .blog-content pre {
      padding: 1em;
      margin: 1.5em 0;
    }
    
    .blog-content blockquote {
      padding: 1em 1.5em;
      margin: 1.5em 0;
    }
  }

  @media (max-width: 480px) {
    .blog-content h1 { font-size: 1.75em; }
    .blog-content h2 { font-size: 1.5em; }
    .blog-content h3 { font-size: 1.25em; }
    
    .blog-content img {
      margin: 1.5em auto;
    }
  }
`;

// Inject content styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = contentStyles;
  document.head.appendChild(styleElement);
}

export default BlogDetail;