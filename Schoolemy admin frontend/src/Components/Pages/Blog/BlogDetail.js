import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlogById, getImageUrl } from '../../../Utils/blogApi.js';

const BlogDetail = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchBlog = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading blog...</div>
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
            <div style={styles.errorIcon}>⚠️</div>
            <h2 style={styles.errorTitle}>Oops! Something went wrong</h2>
            <p style={styles.errorMessage}>{error}</p>
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
            <div style={styles.errorIcon}>📝</div>
            <h2 style={styles.errorTitle}>Blog not found</h2>
            <p style={styles.errorMessage}>The blog you're looking for doesn't exist.</p>
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
            />
          </div>
        )}

        <div style={styles.header}>
          <h1 style={styles.title}>{blog.title}</h1>
          
          <div style={styles.meta}>
            <span style={styles.metaItem}>
              <strong>By:</strong> {blog.author}
            </span>
            <span style={styles.metaItem}>
              <strong>Published:</strong> {formatDate(blog.createdAt)}
            </span>
            {blog.updatedAt !== blog.createdAt && (
              <span style={styles.metaItem}>
                <strong>Updated:</strong> {formatDate(blog.updatedAt)}
              </span>
            )}
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div style={styles.tags}>
              {blog.tags.map((tag, index) => (
                <span key={index} style={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={styles.excerpt}>
          {blog.excerpt}
        </div>

        <div 
          style={styles.content}
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        <div style={styles.shareSection}>
          <h3 style={styles.shareTitle}>Share this article</h3>
          <div style={styles.shareButtons}>
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
              }}
              style={styles.shareButton}
            >
              📋 Copy Link
            </button>
            <button
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                const text = encodeURIComponent(blog.title);
                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
              }}
              style={styles.shareButton}
            >
              🐦 Twitter
            </button>
            <button
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
              }}
              style={styles.shareButton}
            >
              📘 Facebook
            </button>
            <button
              onClick={() => {
                const url = encodeURIComponent(window.location.href);
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
              }}
              style={styles.shareButton}
            >
              💼 LinkedIn
            </button>
          </div>
        </div>
      </article>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '40px 24px'
  },
  wrapper: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '28px',
    boxShadow: '0 1px 2px rgba(79, 70, 229, 0.2)',
    transition: 'all 0.2s ease'
  },
  backIcon: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  article: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0'
  },
  heroImage: {
    width: '100%',
    maxHeight: '420px',
    overflow: 'hidden',
    background: '#f1f5f9',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    maxHeight: '500px'
  },
  header: {
    padding: '40px 40px 28px'
  },
  title: {
    margin: '0 0 24px 0',
    fontSize: '36px',
    lineHeight: '1.25',
    color: '#1e293b',
    fontWeight: '700',
    letterSpacing: '-0.4px'
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#64748b'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: '#f1f5f9',
    borderRadius: '8px'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  tag: {
    padding: '6px 14px',
    background: '#4f46e5',
    color: 'white',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  excerpt: {
    padding: '20px 40px',
    fontSize: '19px',
    lineHeight: '1.65',
    color: '#475569',
    fontStyle: 'italic',
    borderLeft: '4px solid #4f46e5',
    marginLeft: '40px',
    marginBottom: '36px',
    background: '#f8fafc',
    borderRadius: '0 8px 8px 0'
  },
  content: {
    padding: '0 40px 40px',
    fontSize: '17px',
    lineHeight: '1.85',
    color: '#334155'
  },
  shareSection: {
    padding: '32px 40px',
    background: '#f8fafc',
    borderTop: '1px solid #e2e8f0'
  },
  shareTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    color: '#1e293b',
    fontWeight: '600'
  },
  shareButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  shareButton: {
    padding: '10px 20px',
    background: 'white',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  loading: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
    padding: '80px 24px',
    fontSize: '18px',
    color: '#64748b',
    fontWeight: '500'
  },
  errorContainer: {
    background: 'white',
    padding: '56px 40px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0'
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  errorTitle: {
    margin: '0 0 15px 0',
    fontSize: '32px',
    color: '#1a1a1a',
    fontWeight: '700'
  },
  errorMessage: {
    margin: 0,
    fontSize: '18px',
    color: '#666',
    lineHeight: '1.6'
  }
};

// Add some enhanced content styling
const contentStyles = `
  .blog-content h1, .blog-content h2, .blog-content h3 {
    margin-top: 35px;
    margin-bottom: 18px;
    color: #1a1a1a;
    font-weight: 700;
  }
  
  .blog-content h1 { font-size: 32px; }
  .blog-content h2 { font-size: 28px; }
  .blog-content h3 { font-size: 24px; }
  
  .blog-content p {
    margin-bottom: 22px;
    line-height: 1.9;
  }
  
  .blog-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 30px auto;
    display: block;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #f0f0f0;
  }
  
  .blog-content a {
    color: #4f46e5;
    text-decoration: none;
    border-bottom: 1px solid #4f46e5;
    transition: all 0.2s ease;
  }
  
  .blog-content a:hover {
    color: #7c3aed;
    border-bottom-color: #7c3aed;
  }
  
  .blog-content code {
    background: #f8f9fa;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    color: #e83e8c;
    border: 1px solid #e9ecef;
  }
  
  .blog-content pre {
    background: #1a1a2e;
    color: #f8f9fa;
    padding: 25px;
    border-radius: 12px;
    overflow-x: auto;
    margin: 30px 0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  
  .blog-content pre code {
    background: transparent;
    padding: 0;
    border: none;
    color: #f8f9fa;
  }
  
  .blog-content ul, .blog-content ol {
    margin-bottom: 22px;
    padding-left: 35px;
  }
  
  .blog-content li {
    margin-bottom: 12px;
    line-height: 1.8;
  }
  
  .blog-content blockquote {
    border-left: 4px solid #4f46e5;
    padding: 18px 24px;
    margin: 28px 0;
    background: #f8fafc;
    color: #475569;
    font-style: italic;
    border-radius: 0 8px 8px 0;
  }
  
  .blog-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 30px 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .blog-content table th,
  .blog-content table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }
  
  .blog-content table th {
    background: #4f46e5;
    color: white;
    font-weight: 600;
  }
  
  .blog-content table tr:hover {
    background: #f8f9fa;
  }
  
  .blog-content hr {
    border: none;
    height: 2px;
    background: linear-gradient(to right, transparent, #e9ecef, transparent);
    margin: 40px 0;
  }
  
  /* Button hover effects */
  .blog-content + div button:hover {
    background: #f8fafc !important;
    border-color: #c7d2fe !important;
  }
  
  @media (max-width: 768px) {
    .blog-content h1 { font-size: 28px; }
    .blog-content h2 { font-size: 24px; }
    .blog-content h3 { font-size: 20px; }
  }
`;

// Inject content styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = contentStyles;
  document.head.appendChild(styleElement);
}

export default BlogDetail;
