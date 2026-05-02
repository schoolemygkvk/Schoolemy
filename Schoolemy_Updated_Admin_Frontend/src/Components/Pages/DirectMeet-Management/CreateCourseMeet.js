import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../Utils/api";
import { createCourseMeet, getMeetById, updateCourseMeet } from "../../../Utils/courseMeetApi";
import { secureStorage } from "../../../Utils/security";
import { getToken } from "../../../Hooks/useToken";
import { FiCalendar, FiClock, FiDollarSign, FiSave, FiX, FiArrowLeft } from "react-icons/fi";

const CreateCourseMeet = () => {
  const navigate = useNavigate();
  const { id: meetId } = useParams();
  const isEditMode = !!meetId;
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    meet_date: "",
    meet_time: "",
    duration_minutes: 60,
    price: 0,
    meet_type: "online",
    meet_link: "",
    location: "",
    material_access_type: "attended_only",
    attendance_days_limit: 7,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fetchingMeet, setFetchingMeet] = useState(isEditMode);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (isEditMode && meetId) {
      fetchMeetData();
    }
  }, [meetId, isEditMode]);

  const fetchMeetData = async () => {
    try {
      setFetchingMeet(true);
      const response = await getMeetById(meetId);
      if (response.success && response.meet) {
        const meet = response.meet;
        const courseId = meet.course_id?._id || meet.course_id;
        const meetDate = meet.meet_date
          ? new Date(meet.meet_date).toISOString().slice(0, 10)
          : "";
        setFormData({
          course_id: courseId || "",
          title: meet.title || "",
          description: meet.description || "",
          meet_date: meetDate,
          meet_time: meet.meet_time || "",
          duration_minutes: meet.duration_minutes ?? 60,
          price: meet.price ?? 0,
          meet_type: meet.meet_type || "online",
          meet_link: meet.meet_link || "",
          location: meet.location || "",
          material_access_type: meet.material_access_type || "attended_only",
          attendance_days_limit: meet.attendance_days_limit ?? 7,
        });
      } else {
        setError("Failed to load meet data.");
      }
    } catch (err) {
      console.error("Error fetching meet:", err);
      setError(err.response?.data?.message || "Failed to load meet data.");
    } finally {
      setFetchingMeet(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = getToken();
      const response = await axios.get("/api/courses/getcoursesname", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Backend returns array of courses with _id, coursename, category
      const coursesData = Array.isArray(response.data) ? response.data : [];
      
      // Aggressively normalize _id to ensure it's a valid string
      const normalizedCourses = coursesData.map(course => {
        let courseId;
        
        // Try multiple ways to extract the actual ID value
        if (course._id) {
          if (typeof course._id === 'string') {
            // Already a string
            courseId = course._id;
          } else if (course._id.$oid) {
            // MongoDB extended JSON format
            courseId = course._id.$oid;
          } else if (course._id.toString && typeof course._id.toString === 'function') {
            // Has toString method
            const stringified = course._id.toString();
            // Make sure it's not "[object Object]"
            courseId = stringified !== '[object Object]' ? stringified : null;
          } else if (typeof course._id === 'object') {
            // Try to extract from object properties
            courseId = course._id.id || course._id._id || course._id.value || null;
          }
        }
        
        // If we still don't have a valid ID, skip
        if (!courseId || courseId === '[object Object]') {
          return null;
        }
        
        return {
          _id: courseId,
          coursename: course.coursename,
          category: course.category || 'N/A',
          chapters: course.chapters || []
        };
      }).filter(Boolean); // Remove null entries
      
      if (normalizedCourses.length === 0) {
        setError("No valid courses found. Please check backend response.");
        return;
      }
      
      setCourses(normalizedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error.message);
      setError("Failed to load courses. Please refresh the page.");
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Debug logging for course_id selection
    if (process.env.NODE_ENV === 'development' && name === "course_id") {
      console.log("Course selected:", value);
      console.log("Value type:", typeof value);
    }
    
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    });
    if (error) setError("");
  };

  const validateForm = () => {
    const { course_id, title, description, meet_date, meet_time, duration_minutes, meet_type, location } = formData;
    
    if (!course_id || !title || !description || !meet_date || !meet_time || !duration_minutes) {
      setError("Please fill in all required fields");
      return false;
    }

    if (duration_minutes < 15) {
      setError("Duration must be at least 15 minutes");
      return false;
    }

    if (meet_type === "offline" && !location) {
      setError("Please provide a location for offline meet");
      return false;
    }

    if (meet_type === "online" && !formData.meet_link) {
      setError("Please provide a meeting link for online meet");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get admin ID using secureStorage to handle obfuscation
      let adminId = secureStorage.getItem("_id");
      
      // If still obfuscated (starts with sc_), manually decode
      if (adminId && adminId.startsWith("sc_")) {
        try {
          const decoded = decodeURIComponent(atob(adminId.substring(3)));
          if (process.env.NODE_ENV === 'development') {
            console.log("Manually decoded adminId:", decoded);
          }
          adminId = decoded;
        } catch (decodeError) {
          if (process.env.NODE_ENV === 'development') {
            console.error("Failed to decode adminId:", decodeError);
          }
        }
      }

      // Log what we have in formData (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log("FormData before submit:", formData);
        console.log("course_id from formData:", formData.course_id);
        console.log("Type:", typeof formData.course_id);
        console.log("adminId from secureStorage:", adminId);
        console.log("adminId type:", typeof adminId);
      }
      
      // Don't use String() as it converts objects to "[object Object]"
      // Just use the value directly if it's already a string, or extract it if it's an object
      let cleanCourseId = formData.course_id;
      
      if (typeof cleanCourseId === 'object' && cleanCourseId !== null) {
        // If it's an object, try to extract the actual ID
        cleanCourseId = cleanCourseId._id || cleanCourseId.id || cleanCourseId.$oid || null;
        if (process.env.NODE_ENV === 'development') {
          console.warn("course_id was an object, extracted:", cleanCourseId);
        }
      }
      
      if (!cleanCourseId || cleanCourseId === '[object Object]') {
        setError("Invalid course selection. Please refresh and try again.");
        setLoading(false);
        return;
      }
      
      // Clean adminId similarly
      let cleanAdminId = adminId;
      if (typeof cleanAdminId === 'object' && cleanAdminId !== null) {
        cleanAdminId = cleanAdminId._id || cleanAdminId.id || cleanAdminId.$oid || null;
        if (process.env.NODE_ENV === 'development') {
          console.warn("adminId was an object, extracted:", cleanAdminId);
        }
      }
      
      if (!cleanAdminId || cleanAdminId === '[object Object]' || cleanAdminId === 'null') {
        setError("Admin ID not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      let result;
      if (isEditMode) {
        // Edit mode: update meet without sending notifications (content and other updates only)
        const updateData = {
          ...formData,
          course_id: cleanCourseId,
          skip_notifications: true,
        };
        delete updateData.created_by;

        // Ensure price/amount is sent as a number (number inputs can become strings)
        updateData.price = Number(formData.price) || 0;

        result = await updateCourseMeet(meetId, updateData);
        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            navigate("/schoolemy/course-meets");
          }, 2000);
        }
      } else {
        // Create mode
        const submitData = {
          ...formData,
          course_id: cleanCourseId,
          created_by: cleanAdminId,
        };

        // Attempt to create meet with automatic retry on duplicate error
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount <= maxRetries) {
          try {
            result = await createCourseMeet(submitData);

            if (result.success) {
              setSuccess(true);
              setTimeout(() => {
                navigate("/schoolemy/course-meets");
              }, 2000);
              break;
            }
          } catch (retryError) {
            const isDuplicateError =
              retryError.response?.data?.error === "DUPLICATE_MEET_ID" ||
              retryError.response?.data?.error?.includes("E11000") ||
              retryError.response?.data?.error?.includes("duplicate");

            if (isDuplicateError && retryCount < maxRetries) {
              retryCount++;
              await new Promise((resolve) => setTimeout(resolve, 500));
            } else {
              throw retryError;
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || (isEditMode ? "Failed to update meet" : "Failed to create meet");
      const isDuplicateError = error.response?.data?.error?.includes('duplicate') || 
                               error.response?.data?.error?.includes('E11000');
      
      if (isDuplicateError) {
        setError("Unable to generate unique meet ID after multiple attempts. Please wait a moment and try again.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>
            {isEditMode ? "Meet Updated Successfully!" : "Meet Created Successfully!"}
          </h2>
          <p style={styles.successText}>Redirecting to meets list...</p>
        </div>
      </div>
    );
  }

  if (fetchingMeet) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{isEditMode ? "Edit Course Meet" : "Create Course Meet"}</h1>
          <p style={styles.subtitle}>Loading meet data...</p>
        </div>
      </div>
    );
  }

  // Debug: Log courses state before rendering (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log("Rendering form with courses:", courses.length, courses);
  }

  return (
    <div style={styles.container}>
      <div style={styles.backButtonContainer}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <FiArrowLeft /> Back
        </button>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>
          {isEditMode ? "Edit Course Meet" : "Create Course Meet"}
        </h1>
        <p style={styles.subtitle}>
          {isEditMode ? "Update meet content and details" : "Schedule a new meeting for a course"}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {error && (
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}

        {/* Course Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Course <span style={styles.required}>*</span>
          </label>
          <select
            name="course_id"
            value={formData.course_id}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="">Select a course</option>
            {courses.length === 0 ? (
              <option value="" disabled>Loading courses...</option>
            ) : (
              courses.map((course, index) => {
                // Ensure we have a valid string ID
                const courseId = course._id;
                const isValidId = courseId && typeof courseId === 'string' && courseId !== '[object Object]';

                if (!isValidId) {
                  if (process.env.NODE_ENV === 'development') {
                    console.error(`Course ${index} has invalid _id:`, course);
                  }
                  return null;
                }
                
                return (
                  <option key={courseId} value={courseId}>
                    {course.coursename} ({course.category || 'N/A'})
                  </option>
                );
              })
            )}
          </select>
          {courses.length === 0 && (
            <small style={styles.hint}>
              {error || "Loading courses from database..."}
            </small>
          )}
        </div>

        {/* Meet Title */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Meet Title <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            style={styles.input}
            placeholder="e.g., Week 1 - Introduction Session"
            required
          />
        </div>

        {/* Description */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Description <span style={styles.required}>*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="Describe what will be covered in this meet..."
            rows="4"
            required
          />
        </div>

        {/* Date and Time Row */}
        <div style={styles.row}>
          <div style={{...styles.formGroup, flex: 1}}>
            <label style={styles.label}>
              <FiCalendar style={styles.icon} /> Meet Date <span style={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="meet_date"
              value={formData.meet_date}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={{...styles.formGroup, flex: 1}}>
            <label style={styles.label}>
              <FiClock style={styles.icon} /> Meet Time <span style={styles.required}>*</span>
            </label>
            <input
              type="time"
              name="meet_time"
              value={formData.meet_time}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
        </div>

        {/* Duration and Price Row */}
        <div style={styles.row}>
          <div style={{...styles.formGroup, flex: 1}}>
            <label style={styles.label}>
              Duration (minutes) <span style={styles.required}>*</span>
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              style={styles.input}
              min="15"
              required
            />
          </div>

          <div style={{...styles.formGroup, flex: 1}}>
            <label style={styles.label}>
              <FiDollarSign style={styles.icon} /> Price (0 = Free)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              style={styles.input}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Meet Type - Online/Offline */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Meet Type <span style={styles.required}>*</span>
          </label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="meet_type"
                value="online"
                checked={formData.meet_type === "online"}
                onChange={handleChange}
                style={styles.radio}
              />
              <span style={styles.radioText}>Online</span>
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="meet_type"
                value="offline"
                checked={formData.meet_type === "offline"}
                onChange={handleChange}
                style={styles.radio}
              />
              <span style={styles.radioText}>Offline</span>
            </label>
          </div>
        </div>

        {/* Meet Link - Only for Online */}
        {formData.meet_type === "online" && (
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Meet Link <span style={styles.required}>*</span>
            </label>
            <input
              type="url"
              name="meet_link"
              value={formData.meet_link}
              onChange={handleChange}
              style={styles.input}
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              required={formData.meet_type === "online"}
            />
            <small style={styles.hint}>
              Provide Zoom, Google Meet, or other video conferencing link
            </small>
          </div>
        )}

        {/* Location - Only for Offline */}
        {formData.meet_type === "offline" && (
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Location <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., Room 101, Building A, Campus Name"
              required={formData.meet_type === "offline"}
            />
            <small style={styles.hint}>
              Provide the complete address or location details
            </small>
          </div>
        )}

        {/* Material Access Type */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Material Access Policy</label>
          <select
            name="material_access_type"
            value={formData.material_access_type}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="attended_only">Attended Only (Default)</option>
            <option value="all">All Assigned Users</option>
          </select>
          <small style={styles.hint}>
            Choose who can access study materials after the meet
          </small>
        </div>

        {/* Attendance Days Limit */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Attendance Window (Days)</label>
          <input
            type="number"
            name="attendance_days_limit"
            value={formData.attendance_days_limit}
            onChange={handleChange}
            style={styles.input}
            min="1"
            max="7"
            required
          />
          <small style={styles.hint}>
            Number of days users can attend this meet (1-7 days). Material access expires after this period.
          </small>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonGroup}>
          <button
            type="button"
            onClick={() => navigate("/schoolemy/course-meets")}
            style={styles.cancelButton}
            disabled={loading}
          >
            <FiX /> Cancel
          </button>
          <button
            type="submit"
            style={styles.submitButton}
            disabled={loading}
          >
            <FiSave /> {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Meet" : "Create Meet")}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "2rem 1rem",
  },
  backButtonContainer: {
    maxWidth: "800px",
    margin: "0 auto 1rem",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  header: {
    maxWidth: "800px",
    margin: "0 auto 2rem",
  },
  title: {
    fontSize: "2rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "1rem",
  },
  form: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    transition: "border-color 0.2s",
  },
  select: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    background: "white",
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
  },
  row: {
    display: "flex",
    gap: "1rem",
  },
  hint: {
    display: "block",
    marginTop: "0.25rem",
    fontSize: "0.875rem",
    color: "#64748b",
  },
  icon: {
    fontSize: "1.25rem",
  },
  radioGroup: {
    display: "flex",
    gap: "2rem",
    marginTop: "0.5rem",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    padding: "0.75rem 1.5rem",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    transition: "all 0.2s",
    background: "white",
  },
  radio: {
    width: "1.25rem",
    height: "1.25rem",
    cursor: "pointer",
    accentColor: "#667eea",
  },
  radioText: {
    fontSize: "1rem",
    fontWeight: 500,
    color: "#1e293b",
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
    marginTop: "2rem",
    justifyContent: "flex-end",
  },
  cancelButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  submitButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  errorAlert: {
    padding: "1rem",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#dc2626",
    marginBottom: "1.5rem",
  },
  successContainer: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successCard: {
    background: "white",
    padding: "3rem",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  successIcon: {
    fontSize: "4rem",
    color: "#10b981",
    marginBottom: "1rem",
  },
  successTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  successText: {
    color: "#64748b",
  },
};

export default CreateCourseMeet;
