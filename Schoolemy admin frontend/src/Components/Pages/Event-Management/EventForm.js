import React, { useEffect, useState } from "react";
import { createEvent, updateEvent, getEvent } from "../../../Utils/eventApi";
import { useNavigate, useParams } from "react-router-dom";

const toBase64 = (file) =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
    reader.onerror = (err) => rej(err);
  });

// Normalize coverImages for form display - supports S3 URL, data URL, legacy object
const normalizeCoverImages = (raw) => {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((img) => {
    if (typeof img === "string") return img; // S3 URL or data URL
    if (img?.url) return img.url; // { url: "https://..." }
    if (img && img.contentType && img.data) {
      let base64;
      if (typeof img.data === "string") base64 = img.data;
      else if (img.data && (img.data.data || Array.isArray(img.data))) {
        const arr = img.data.data || img.data;
        let binary = "";
        for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
        base64 = btoa(binary);
      } else return null;
      return `data:${img.contentType};base64,${base64}`;
    }
    return null;
  }).filter(Boolean);
};

const EventForm = () => {
  const { eventId } = useParams();
  const editMode = Boolean(eventId);
  const [form, setForm] = useState({
    eventName: "",
    category: "",
    date: "",
    time: "",
    venue: { type: "Offline", location: "" },
    description: "",
    status: "Upcoming",
    coverImages: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!editMode) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getEvent(eventId);
        if (res?.data) {
          const raw = res.data.data || res.data;
          const coverImages = normalizeCoverImages(raw.coverImages);
          setForm((prev) => ({
            ...prev,
            ...raw,
            coverImages: coverImages.length > 0 ? coverImages : (prev.coverImages || []),
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, editMode]);

  const onFile = async (e) => {
    const files = Array.from(e.target.files || []);
    const base64List = await Promise.all(files.map((f) => toBase64(f)));
    setForm((f) => ({
      ...f,
      coverImages: [...(f.coverImages || []), ...base64List],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editMode) {
        // On edit: send only NEW images (base64). Existing S3 URLs are not sent so
        // backend deletes old S3 files and uploads only new ones. If no new images,
        // don't send coverImages so backend keeps existing covers.
        const newImagesOnly = (form.coverImages || []).filter(
          (img) => typeof img === "string" && img.startsWith("data:image/")
        );
        const payload = { ...form };
        if (newImagesOnly.length > 0) payload.coverImages = newImagesOnly;
        await updateEvent(eventId, payload);
      } else {
        await createEvent(form);
      }
      navigate("../events");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {editMode ? "Edit Event" : "Create New Event"}
          </h2>
          <p style={styles.subtitle}>
            {editMode
              ? "Update your event details below"
              : "Fill in the details to create a new event"}
          </p>
        </div>

        {loading && !form.eventName && (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <span>Loading…</span>
          </div>
        )}

        <form onSubmit={submit} style={styles.form}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Basic Information</h3>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Event Name *</label>
              <input
                placeholder="Enter event name"
                value={form.eventName}
                onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Category *</label>
              <input
                placeholder="e.g. Sports, Workshop, Seminar"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={styles.select}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Date & Time</h3>
            <div style={styles.dateTimeRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Time *</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Venue</h3>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Venue Type</label>
              <select
                value={form.venue?.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    venue: { ...form.venue, type: e.target.value },
                  })
                }
                style={styles.select}
              >
                <option value="Offline">Offline</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Location / Link</label>
              <input
                placeholder={
                  form.venue?.type === "Online"
                    ? "Enter meeting link or URL"
                    : "Enter venue address"
                }
                value={form.venue?.location}
                onChange={(e) =>
                  setForm({
                    ...form,
                    venue: { ...form.venue, location: e.target.value },
                  })
                }
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Description</h3>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Event Description</label>
              <textarea
                placeholder="Describe your event..."
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                style={styles.textarea}
              />
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Cover Images</h3>
            <div style={styles.fieldGroup}>
              <label style={styles.fileLabel}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFile}
                  style={styles.fileInput}
                />
                <span style={styles.fileButton}>Choose images</span>
              </label>
              <div style={styles.imagePreview}>
                {(form.coverImages || []).map((img, idx) => (
                  <div key={idx} style={styles.imageContainer}>
                    <img src={img} alt="" style={styles.previewImage} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.buttonRow}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? "Saving…" : editMode ? "Save Changes" : "Create Event"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    padding: "32px 24px",
  },
  wrapper: {
    maxWidth: "680px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    margin: 0,
    fontSize: "15px",
    color: "#64748b",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "24px",
    fontSize: "16px",
    color: "#64748b",
    background: "#fff",
    borderRadius: "12px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "2px solid #e2e8f0",
    borderTopColor: "#0d9488",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  form: {
    background: "#fff",
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },
  section: {
    marginBottom: "28px",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  fieldGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "15px",
    background: "#fff",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "15px",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "15px",
    background: "#fff",
    resize: "vertical",
    minHeight: "120px",
    outline: "none",
    boxSizing: "border-box",
  },
  dateTimeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  fileLabel: {
    display: "inline-block",
    cursor: "pointer",
  },
  fileInput: {
    display: "none",
  },
  fileButton: {
    display: "inline-block",
    padding: "12px 20px",
    background: "#f1f5f9",
    border: "2px dashed #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
    transition: "all 0.2s ease",
  },
  imagePreview: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "16px",
  },
  imageContainer: {
    width: "80px",
    height: "60px",
    overflow: "hidden",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
    paddingTop: "24px",
    borderTop: "1px solid #e2e8f0",
  },
  submitButton: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.35)",
    transition: "all 0.2s ease",
  },
  cancelButton: {
    padding: "14px 28px",
    background: "#fff",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
};

export default EventForm;
