import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createBlog, getAllBlogsAdmin, updateBlog, deleteBlog, getImageUrl } from '../../../Utils/blogApi';

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: '',
    published: false
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const previewUrlRef = useRef(null);
  const messageTimerRef = useRef(null);

  const showMessage = useCallback((type, text) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setMessage({ type, text });
    messageTimerRef.current = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllBlogsAdmin();
      setBlogs(data?.data ?? data?.blogs ?? []);
    } catch (error) {
      console.error('Full error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      showMessage('error', 'Failed to load blogs: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image must be under 5MB. It will be uploaded to S3.');
      return;
    }
    setImageFile(file);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setImagePreview(objectUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('title', formData.title ?? '');
      fd.append('excerpt', formData.excerpt ?? '');
      fd.append('content', formData.content ?? '');
      fd.append('tags', formData.tags ?? '');
      fd.append('published', formData.published ? 'true' : 'false');
      if (imageFile) fd.append('image', imageFile);

      if (editingBlog) {
        await updateBlog(editingBlog._id, fd);
        showMessage('success', 'Blog updated successfully!');
      } else {
        await createBlog(fd);
        showMessage('success', 'Blog created successfully!');
      }

      resetForm();
      fetchBlogs();
      setShowEditor(false);
    } catch (error) {
      const errMsg = error?.message || error?.error || 'Failed to save blog';
      showMessage('error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      tags: blog.tags?.join(', ') ?? '',
      published: blog.published
    });
    setImageFile(null);
    setImagePreview(blog.image ? getImageUrl(blog.image) : null);
    setShowEditor(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteBlog(id);
      showMessage('success', 'Blog deleted successfully!');
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } catch (error) {
      const errMsg = error?.message || error?.error || 'Unknown error';
      showMessage('error', 'Failed to delete blog: ' + errMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      tags: '',
      published: false
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingBlog(null);
  };

  const cancelEdit = () => {
    resetForm();
    setShowEditor(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Blog Management</h2>
        <div style={styles.headerActions}>
          {!showEditor && (
            <button 
              onClick={() => setShowEditor(true)} 
              style={styles.primaryButton}
              disabled={loading}
            >
              + Create New Blog
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          borderColor: message.type === 'success' ? '#c3e6cb' : '#f5c6cb'
        }}>
          {message.text}
        </div>
      )}

      {showEditor ? (
        <div style={styles.editorCard}>
          <h3 style={styles.editorTitle}>
            {editingBlog ? 'Edit Blog' : 'Create New Blog'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength="200"
                  style={styles.input}
                  placeholder="Enter blog title"
                />
                <small style={styles.charCount}>{formData.title.length}/200</small>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Excerpt *</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  required
                  maxLength="500"
                  rows="3"
                  style={styles.textarea}
                  placeholder="Brief description (shown in blog list)"
                />
                <small style={styles.charCount}>{formData.excerpt.length}/500</small>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Content *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows="15"
                  style={styles.textarea}
                  placeholder="Full blog content (supports HTML)"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., Technology, AI, Tutorial"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Featured Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={styles.fileInput}
                />
                <small style={styles.charCount}>Max 5MB (JPG, PNG, GIF, WebP) – uploaded to S3, link saved in database</small>
                {imagePreview && (
                  <div style={styles.imagePreview}>
                    <img src={imagePreview} alt="Preview" style={styles.previewImg} />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      style={styles.removeImageButton}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="published"
                  name="published"
                  checked={formData.published}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <label htmlFor="published" style={styles.checkboxLabel}>
                  Publish immediately (uncheck to save as draft)
                </label>
              </div>
            </div>

            <div style={styles.buttonGroup}>
              <button 
                type="submit" 
                style={styles.primaryButton}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingBlog ? 'Update Blog' : 'Create Blog')}
              </button>
              <button 
                type="button" 
                onClick={cancelEdit} 
                style={styles.secondaryButton}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={styles.blogList}>
          {loading ? (
            <div style={styles.loading}>Loading blogs...</div>
          ) : blogs.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No blogs yet. Create your first blog post!</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {blogs.map(blog => (
                <div key={blog._id} style={styles.blogCard}>
                  {blog.image && (
                    <div style={styles.blogImageContainer}>
                      <img 
                        src={getImageUrl(blog.image)} 
                        alt={blog.title}
                        style={styles.blogImage}
                      />
                    </div>
                  )}
                  <div style={styles.blogContent}>
                    <div style={styles.blogHeader}>
                      <h3 style={styles.blogTitle}>{blog.title}</h3>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: blog.published ? '#28a745' : '#ffc107',
                        color: blog.published ? '#fff' : '#000'
                      }}>
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p style={styles.blogExcerpt}>{blog.excerpt}</p>
                    <div style={styles.blogMeta}>
                      <small style={styles.date}>
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </small>
                      {blog.tags && blog.tags.length > 0 && (
                        <div style={styles.tags}>
                          {blog.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} style={styles.tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={styles.blogActions}>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleEdit(blog); }} 
                        style={styles.editButton}
                        disabled={loading}
                        title="Edit this blog"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(blog._id); }} 
                        style={styles.deleteButton}
                        disabled={loading || deletingId === blog._id}
                        title="Delete this blog"
                      >
                        {deletingId === blog._id ? 'Deleting…' : '🗑️ Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '32px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#f8fafc'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e2e8f0'
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    letterSpacing: '-0.3px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  message: {
    padding: '14px 18px',
    marginBottom: '24px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  editorCard: {
    backgroundColor: '#fff',
    padding: '36px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0'
  },
  editorTitle: {
    fontSize: '20px',
    marginBottom: '28px',
    color: '#1e293b',
    fontWeight: '600'
  },
  formRow: {
    marginBottom: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontWeight: '600',
    marginBottom: '8px',
    color: '#555',
    fontSize: '14px'
  },
  input: {
    padding: '12px 14px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    backgroundColor: '#fff'
  },
  textarea: {
    padding: '12px 14px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    backgroundColor: '#fff'
  },
  charCount: {
    color: '#999',
    fontSize: '12px',
    marginTop: '5px'
  },
  fileInput: {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  imagePreview: {
    marginTop: '15px',
    maxWidth: '400px',
    position: 'relative'
  },
  previewImg: {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  removeImageButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#555',
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px'
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    color: '#fff',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    boxShadow: '0 1px 2px rgba(79, 70, 229, 0.2)'
  },
  secondaryButton: {
    backgroundColor: '#fff',
    color: '#64748b',
    padding: '12px 24px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s'
  },
  blogList: {
    marginTop: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#666'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    color: '#999'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px'
  },
  blogCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
  },
  blogImageContainer: {
    width: '100%',
    height: '180px',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9'
  },
  blogImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  blogContent: {
    padding: '20px'
  },
  blogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px'
  },
  blogTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    flex: 1,
    lineHeight: '1.4'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  blogExcerpt: {
    color: '#64748b',
    fontSize: '14px',
    lineHeight: '1.55',
    marginBottom: '16px',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  blogMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f5f9'
  },
  date: {
    color: '#94a3b8',
    fontSize: '12px'
  },
  tags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  tag: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500'
  },
  blogActions: {
    display: 'flex',
    gap: '10px'
  },
  editButton: {
    flex: 1,
    backgroundColor: '#0ea5e9',
    color: '#fff',
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s'
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fff',
    color: '#ef4444',
    padding: '10px 16px',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s'
  }
};

export default BlogManagement;
