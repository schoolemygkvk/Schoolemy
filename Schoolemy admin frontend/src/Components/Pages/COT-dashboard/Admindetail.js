import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
import { secureStorage } from "../../../Utils/security";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Returns img src for profile picture - supports S3 URL and legacy base64 (migration)
 */
const getProfileImageSrc = (profilePictureUpload) => {
  if (!profilePictureUpload) return null;
  if (profilePictureUpload.startsWith("http://") || profilePictureUpload.startsWith("https://")) {
    return profilePictureUpload; // S3 URL from backend
  }
  if (profilePictureUpload.startsWith("data:")) {
    return profilePictureUpload; // Full data URL (e.g. from new selection)
  }
  return `data:image/jpeg;base64,${profilePictureUpload}`; // Legacy base64
};

/**
 * Returns img src for govt ID documentImage - supports S3 URL (backend) and legacy base64
 */
const getDocumentImageSrc = (documentImage) => {
  if (!documentImage) return null;
  if (documentImage.startsWith("http://") || documentImage.startsWith("https://")) {
    return documentImage; // S3 URL from backend
  }
  if (documentImage.startsWith("data:")) {
    return documentImage;
  }
  return `data:image/jpeg;base64,${documentImage}`; // Legacy base64
};

/**
 * Convert image URL to base64 - required for html2canvas to capture external images (CORS fix)
 * Tries direct fetch first; for S3 URLs fails due to CORS, uses backend proxy.
 * Optional retries for "download all" when many images are fetched in sequence.
 */
const imageUrlToBase64 = async (url, axiosInstance, retries = 2) => {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  const toBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  const tryFetch = async () => {
    try {
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error(res.statusText);
      const blob = await res.blob();
      return await toBase64(blob);
    } catch (e) {
      if (axiosInstance && (url.startsWith("http://") || url.startsWith("https://"))) {
        const proxyRes = await axiosInstance.get("/proxy-image", {
          params: { url },
          responseType: "blob",
        });
        const blob = proxyRes.data;
        return await toBase64(blob);
      }
      throw e;
    }
  };
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await tryFetch();
    } catch (err) {
      if (attempt === retries) {
        console.warn("Image could not be loaded for PDF:", url?.substring(0, 50), err?.message);
        return null;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return null;
};

const ViewAdmins = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewFullDataAdmin, setViewFullDataAdmin] = useState(null);
  const [loadingFullData, setLoadingFullData] = useState(false);

  // Get current user's role for access control
  const currentUserRole = (secureStorage.getItem("role") || "").toLowerCase().trim();
  const isSuperAdmin = currentUserRole === "superadmin";
  
  // Debug logging
  console.log("[Admindetail] Current User Role:", currentUserRole);
  console.log("[Admindetail] Is SuperAdmin:", isSuperAdmin);

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/get-admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admins:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Filter admins based on search, role filter, and user permissions
  const filteredAdmins = admins.filter(admin => {
    // Hide superadmin accounts from non-superadmin users
    const adminRole = (admin.role || "").toLowerCase().trim();
    if (adminRole === "superadmin" && !isSuperAdmin) {
      return false;
    }
    
    const matchesSearch = admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         admin.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || admin.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Delete admin
  const handleDelete = async (id) => {
    // Find the admin to check their role
    const adminToDelete = admins.find(admin => admin._id === id);
    
    // Prevent non-superadmin from deleting superadmin accounts
    if (adminToDelete?.role?.toLowerCase().trim() === "superadmin" && !isSuperAdmin) {
      alert("You do not have permission to delete SuperAdmin accounts!");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Admin deleted successfully");
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      alert("Failed to delete admin");
    }
  };

  // Open modal for editing
  const handleEdit = (admin) => {
    // Prevent non-superadmin from editing superadmin accounts
    if (admin.role?.toLowerCase().trim() === "superadmin" && !isSuperAdmin) {
      alert("You do not have permission to edit SuperAdmin accounts!");
      return;
    }
    
    setEditingAdmin(admin);
    setFormData({ ...admin });
  };

  // Close modal
  const handleClose = () => setEditingAdmin(null);

  // View full data (fetch single admin by ID – backend returns full data excluding loginHistory)
  const handleViewFullData = async (admin) => {
    setOpenMenuId(null);
    setLoadingFullData(true);
    setViewFullDataAdmin(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/admin/${admin._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewFullDataAdmin(res.data);
    } catch (err) {
      console.error("Error fetching admin full data:", err);
      alert("Failed to load admin details");
    } finally {
      setLoadingFullData(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile picture change - convert to base64; backend uploads to S3
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // Backend expects full data URL: data:image/jpeg;base64,...
      setFormData((prev) => ({
        ...prev,
        profilePictureBase64: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle ID proof image change
  const handleIdImageChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newProofs = [...formData.govtIdProofs];
      newProofs[index].documentImage = reader.result.split(",")[1];
      setFormData((prev) => ({ ...prev, govtIdProofs: newProofs }));
    };
    reader.readAsDataURL(file);
  };

  // Add new ID proof
  const handleAddIdProof = () => {
    setFormData((prev) => ({
      ...prev,
      govtIdProofs: [
        ...(prev.govtIdProofs || []),
        { idType: "", idNumber: "", documentImage: "" },
      ],
    }));
  };

  // Remove ID proof
  const handleRemoveIdProof = (index) => {
    const newProofs = formData.govtIdProofs.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, govtIdProofs: newProofs }));
  };

  // Update ID proof fields
  const handleIdProofChange = (index, e) => {
    const { name, value } = e.target;
    const updatedProofs = [...formData.govtIdProofs];
    updatedProofs[index][name] = value;
    setFormData((prev) => ({ ...prev, govtIdProofs: updatedProofs }));
  };

  // Save updated admin
  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = { ...formData };
      // Send profilePictureBase64 only when user selected a new image
      if (!payload.profilePictureBase64) {
        delete payload.profilePictureBase64;
      }
      await axios.put(
        `/update/${editingAdmin._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Admin updated successfully");
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error updating admin:", error);
      alert("Failed to update admin");
    }
  };

    // Prepare admin with images converted to base64 (fixes CORS - images not showing in PDF).
    // Only data URLs work in html2canvas; failed conversions are set to null so we don't embed S3 URLs.
    const prepareAdminForPDF = async (admin) => {
      const prepared = { ...admin };
      if (admin.profilePictureUpload && (admin.profilePictureUpload.startsWith("http://") || admin.profilePictureUpload.startsWith("https://"))) {
        const dataUrl = await imageUrlToBase64(admin.profilePictureUpload, axios);
        prepared.profilePictureUpload = dataUrl || null;
      }
      if (admin.govtIdProofs && admin.govtIdProofs.length > 0) {
        prepared.govtIdProofs = await Promise.all(
          admin.govtIdProofs.map(async (idp) => {
            const imgUrl = idp.documentImage || idp.documentUrl;
            if (imgUrl && (imgUrl.startsWith("http://") || imgUrl.startsWith("https://"))) {
              const dataUrl = await imageUrlToBase64(imgUrl, axios);
              if (dataUrl) {
                const rawBase64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
                return { ...idp, documentImage: rawBase64 };
              }
              return { ...idp, documentImage: null };
            }
            return idp;
          })
        );
      }
      return prepared;
    };

    // Professional PDF print content template
    const createPrintContent = (admin) => {
      const formattedDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `
        <div class="print-card" style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;">
          <div class="doc-header" style="border-bottom:3px solid #667eea;padding-bottom:20px;margin-bottom:24px;">
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#1f2937;">SCHOLEMY</h1>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Admin Profile Document</p>
            <p style="margin:8px 0 0;font-size:10px;color:#9ca3af;">Generated: ${formattedDate}</p>
          </div>
          <div class="profile-section" style="display:flex;align-items:center;gap:24px;padding:24px;background:#f8fafc;border-radius:12px;margin-bottom:24px;">
            ${(() => {
              const profileSrc = admin.profilePictureUpload && getProfileImageSrc(admin.profilePictureUpload);
              const isDataUrl = profileSrc && !profileSrc.startsWith('http');
              return isDataUrl
                ? `<img src="${profileSrc}" alt="${admin.name}" class="profile-image" style="width:100px;height:100px;object-fit:cover;border-radius:12px;border:3px solid #e5e7eb;"/>`
                : `<div class="profile-placeholder" style="width:100px;height:100px;border-radius:12px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:600;color:#fff;">${admin.name?.charAt(0)?.toUpperCase() || "A"}</div>`;
            })()}
            <div>
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1f2937;">${admin.name}</h2>
              <span style="display:inline-block;padding:4px 12px;background:#667eea;color:#fff;border-radius:6px;font-size:12px;font-weight:600;">${admin.role?.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          </div>
          <div class="info-section" style="margin-bottom:24px;">
            <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Personal Information</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;width:180px;">Email</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:500;color:#1f2937;">${admin.email}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Mobile</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:500;color:#1f2937;">${admin.mobilenumber}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Gender</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:500;color:#1f2937;">${admin.gender || 'N/A'}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Age</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:500;color:#1f2937;">${admin.age || "N/A"} years</td></tr>
              ${admin.designationInBoard ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Designation</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:500;color:#1f2937;">${admin.designationInBoard}</td></tr>` : ''}
              ${admin.permanentAddress ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Permanent Address</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:500;color:#1f2937;">${admin.permanentAddress}</td></tr>` : ''}
              ${admin.tempAddress ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Temporary Address</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:500;color:#1f2937;">${admin.tempAddress}</td></tr>` : ''}
            </table>
          </div>
          ${admin.govtIdProofs && admin.govtIdProofs.length > 0 ? `
            <div class="id-proofs-section" style="margin-bottom:24px;">
              <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Government ID Proofs</h3>
              <div style="display:flex;flex-wrap:wrap;gap:20px;">
                ${admin.govtIdProofs.map(idp => {
                  const docSrc = idp.documentImage && getDocumentImageSrc(idp.documentImage);
                  const isDataUrl = docSrc && !docSrc.startsWith('http');
                  return `
                  <div style="padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e5e7eb;min-width:200px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#6b7280;font-weight:600;">${idp.idType}</p>
                    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1f2937;">${idp.idNumber}</p>
                    ${isDataUrl ? `<img src="${docSrc}" alt="${idp.idType}" style="max-width:180px;max-height:120px;border-radius:6px;object-fit:cover;display:block;border:1px solid #e5e7eb;"/>` : ''}
                  </div>
                `;
                }).join('')}
              </div>
            </div>
          ` : ''}
          <div class="doc-footer" style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center;">
            Confidential • Scholemy Admin Records • This document is system-generated
          </div>
        </div>
      `;
    };

    // Wait for all images inside a document or element to load
    const waitForImages = (root, timeout = 7000) => {
      return new Promise((resolve) => {
        try {
          const imgs = root.querySelectorAll ? root.querySelectorAll('img') : root.getElementsByTagName('img');
          if (!imgs || imgs.length === 0) return resolve();
          let loaded = 0;
          const done = () => {
            loaded += 1;
            if (loaded >= imgs.length) resolve();
          };
          Array.from(imgs).forEach((img) => {
            // If image already loaded
            if (img.complete && img.naturalWidth !== 0) return done();
            // Otherwise listen for load/error
            img.addEventListener('load', done);
            img.addEventListener('error', done);
          });
          // Fallback timeout to avoid hanging forever
          setTimeout(() => resolve(), timeout);
        } catch (e) {
          // In case of any unexpected error, resolve to continue
          resolve();
        }
      });
    };

    // Fetch full admin (includes profilePictureUpload & govtIdProofs.documentImage) for PDF
    const fetchFullAdminForPDF = async (admin) => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/admin/${admin._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch (err) {
        console.warn("Could not fetch full admin for PDF, using list data:", err?.message);
        return admin;
      }
    };

    // Handle downloading as PDF - professional format, one file per admin (includes documentImage)
    const handleDownloadPDF = async (admin) => {
      const fullAdmin = await fetchFullAdminForPDF(admin);
      const preparedAdmin = await prepareAdminForPDF(fullAdmin);
      const container = document.createElement('div');
      container.innerHTML = createPrintContent(preparedAdmin);
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.background = '#ffffff';
      container.style.padding = '24px';
      container.style.width = '210mm'; // A4 width for consistent layout
      container.style.boxSizing = 'border-box';
      document.body.appendChild(container);

      try {
        await waitForImages(container);

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: container.scrollWidth,
          windowWidth: container.scrollWidth,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;
        const contentHeight = pdfHeight - margin * 2;
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
        const scaledW = imgWidth * ratio;
        const scaledH = imgHeight * ratio;
        const imgX = margin;
        const imgY = margin;

        pdf.addImage(imgData, 'JPEG', imgX, imgY, scaledW, scaledH);
        const safeName = (admin.name || 'admin').replace(/[^a-z0-9\-_.]/gi, '_').substring(0, 50);
        const timestamp = new Date().toISOString().slice(0, 10);
        pdf.save(`Admin_Profile_${safeName}_${timestamp}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
      } finally {
        document.body.removeChild(container);
      }
    };

    // Download all admins as a single PDF file (all data in one file)
    const handleDownloadAllPDFs = async () => {
      if (filteredAdmins.length === 0) {
        alert('No admins to download.');
        return;
      }
      setDownloadingAll(true);
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;
        const contentHeight = pdfHeight - margin * 2;

        for (let i = 0; i < filteredAdmins.length; i++) {
          if (i > 0) pdf.addPage();
          const admin = filteredAdmins[i];
          const fullAdmin = await fetchFullAdminForPDF(admin);
          const preparedAdmin = await prepareAdminForPDF(fullAdmin);
          const container = document.createElement('div');
          container.innerHTML = createPrintContent(preparedAdmin);
          container.style.position = 'absolute';
          container.style.left = '-9999px';
          container.style.top = '0';
          container.style.background = '#ffffff';
          container.style.padding = '24px';
          container.style.width = '210mm';
          container.style.boxSizing = 'border-box';
          document.body.appendChild(container);

          await waitForImages(container, 12000);
          await new Promise((r) => setTimeout(r, 100));
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: container.scrollWidth,
            windowWidth: container.scrollWidth,
          });
          document.body.removeChild(container);

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
          const scaledW = imgWidth * ratio;
          const scaledH = imgHeight * ratio;
          const imgX = margin;
          const imgY = margin;
          pdf.addImage(imgData, 'JPEG', imgX, imgY, scaledW, scaledH);
        }

        const timestamp = new Date().toISOString().slice(0, 10);
        pdf.save(`All_Admin_Profiles_${timestamp}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
      } finally {
        setDownloadingAll(false);
      }
    };
  // Get role badge color
  const getRoleColor = (role) => {
    const colors = {
      superadmin: "#dc2626",
      admin: "#059669",
      boscontroller: "#7c3aed",
      bosmembers: "#db2777",
      datamaintenance: "#ea580c",
      coursecontroller: "#0891b2",
      markettingcontroller: "#ca8a04",
    };
    return colors[role] || "#6b7280";
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading admins...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <button 
            onClick={() => navigate(-1)} 
            style={styles.backButton}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <svg style={styles.backIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 style={styles.title}>Admin Management</h1>
          <p style={styles.subtitle}>Manage and monitor all administrator accounts</p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{admins.length}</span>
            <span style={styles.statLabel}>Total Admins</span>
          </div>
           <div style={styles.actionButtons}>
             <button
               style={{ ...styles.downloadAllButton, opacity: downloadingAll ? 0.7 : 1 }}
               onClick={handleDownloadAllPDFs}
               disabled={downloadingAll}
             >
               <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               {downloadingAll ? 'Generating PDF...' : 'Download All PDFs'}
             </button>
           </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersContainer}>
        <div style={styles.searchBox}>
          <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search admins by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={styles.roleFilter}
        >
          <option value="all">All Roles</option>
          {isSuperAdmin && (
            <option value="superadmin">Super Admin</option>
          )}
          <option value="admin">Admin</option>
          <option value="boscontroller">BOS Controller</option>
          <option value="bosmembers">BOS Members</option>
          <option value="datamaintenance">Data Maintenance</option>
          <option value="coursecontroller">Course Controller</option>
          <option value="markettingcontroller">Marketing Controller</option>
        </select>
      </div>

      {/* Admins Grid */}
      <div style={styles.grid}>
        {filteredAdmins.map((admin) => (
          <div key={admin._id} id={`admin-card-${admin._id}`} style={styles.card}>
            {/* Card Header with 3-dot menu */}
            <div style={styles.cardHeader}>
              <div style={styles.avatarSection}>
                {admin.profilePictureUpload ? (
                  <img
                    src={getProfileImageSrc(admin.profilePictureUpload)}
                    alt={admin.name}
                    style={styles.avatar}
                  />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {admin.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                )}
                <div style={styles.nameSection}>
                  <h3 style={styles.name}>{admin.name}</h3>
                  <span 
                    style={{
                      ...styles.roleBadge,
                      backgroundColor: getRoleColor(admin.role)
                    }}
                  >
                    {admin.role?.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  style={styles.menuButton}
                  onClick={() => setOpenMenuId(openMenuId === admin._id ? null : admin._id)}
                  aria-label="Open menu"
                >
                  ⋯
                </button>
                {openMenuId === admin._id && (
                  <>
                    <div
                      style={styles.menuBackdrop}
                      onClick={() => setOpenMenuId(null)}
                      aria-hidden="true"
                    />
                    <div style={styles.menuDropdown}>
                      <button
                        type="button"
                        style={styles.menuItem}
                        onClick={() => handleViewFullData(admin)}
                      >
                        <svg style={styles.menuItemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View full data
                      </button>
                      <button
                        type="button"
                        style={styles.menuItem}
                        onClick={() => { setOpenMenuId(null); handleDownloadPDF(admin); }}
                      >
                        <svg style={styles.menuItemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                      </button>
                      {(isSuperAdmin || admin.role?.toLowerCase().trim() !== "superadmin") && (
                        <>
                          <button
                            type="button"
                            style={styles.menuItem}
                            onClick={() => { setOpenMenuId(null); handleEdit(admin); }}
                          >
                            <svg style={styles.menuItemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            type="button"
                            style={{ ...styles.menuItem, color: "#dc2626" }}
                            onClick={() => { setOpenMenuId(null); handleDelete(admin._id); }}
                          >
                            <svg style={styles.menuItemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Admin Info */}
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <svg style={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span style={styles.infoText}>{admin.email}</span>
              </div>
              <div style={styles.infoItem}>
                <svg style={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span style={styles.infoText}>{admin.mobilenumber}</span>
              </div>
              <div style={styles.infoItem}>
                <svg style={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span style={styles.infoText}>{admin.gender} • {admin.age || "N/A"} years</span>
              </div>
              {admin.designationInBoard && (
                <div style={styles.infoItem}>
                  <svg style={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span style={styles.infoText}>{admin.designationInBoard}</span>
                </div>
              )}
            </div>

            {/* ID Proofs Section */}
            {admin.govtIdProofs && admin.govtIdProofs.length > 0 && (
              <div style={styles.idProofsSection}>
                <h4 style={styles.idProofsTitle}>Government IDs</h4>
                <div style={styles.idProofsGrid}>
                  {admin.govtIdProofs.map((idp, index) => (
                    <div key={index} style={styles.idProofBadge}>
                      <span style={styles.idType}>{idp.idType}</span>
                      <span style={styles.idNumber}>{idp.idNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAdmins.length === 0 && (
        <div style={styles.emptyState}>
          <svg style={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 style={styles.emptyTitle}>No admins found</h3>
          <p style={styles.emptyText}>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingAdmin && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Admin Profile</h2>
              <button onClick={handleClose} style={styles.closeButton}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={styles.closeIcon}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Profile Section */}
              <div style={styles.formSection}>
                <h3 style={styles.sectionTitle}>Profile Information</h3>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input 
                      name="name" 
                      value={formData.name || ""} 
                      onChange={handleChange} 
                      style={styles.input} 
                      placeholder="Enter full name"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input 
                      name="email" 
                      type="email"
                      value={formData.email || ""} 
                      onChange={handleChange} 
                      style={styles.input} 
                      placeholder="Enter email address"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mobile Number</label>
                    <input 
                      name="mobilenumber" 
                      value={formData.mobilenumber || ""} 
                      onChange={handleChange} 
                      style={styles.input} 
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Gender</label>
                    <select name="gender" value={formData.gender || ""} onChange={handleChange} style={styles.input}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Age</label>
                    <input 
                      name="age" 
                      type="number" 
                      value={formData.age || ""} 
                      onChange={handleChange} 
                      style={styles.input} 
                      placeholder="Enter age"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Role</label>
                    <select name="role" value={formData.role || ""} onChange={handleChange} style={styles.input}>
                      {isSuperAdmin && (
                        <option value="superadmin">Super Admin</option>
                      )}
                      <option value="admin">Admin</option>
                      <option value="boscontroller">BOS Controller</option>
                      <option value="bosmembers">BOS Members</option>
                      <option value="datamaintenance">Data Maintenance</option>
                      <option value="coursecontroller">Course Controller</option>
                      <option value="markettingcontroller">Marketing Controller</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div style={styles.formSection}>
                <h3 style={styles.sectionTitle}>Address Information</h3>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Permanent Address</label>
                    <input 
                      name="permanentAddress" 
                      value={formData.permanentAddress || ""} 
                      onChange={handleChange} 
                      style={styles.input} 
                      placeholder="Enter permanent address"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Temporary Address</label>
                    <input 
                      name="tempAddress" 
                      value={formData.tempAddress || ""} 
                      onChange={handleChange} 
                      style={styles.input} 
                      placeholder="Enter temporary address"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Board Designation</label>
                    <input 
                      name="designationInBoard" 
                      value={formData.designationInBoard || ""} 
                      onChange={handleChange} 
                      style={styles.input} 
                      placeholder="Enter board designation"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Picture */}
              <div style={styles.formSection}>
                <h3 style={styles.sectionTitle}>Profile Picture</h3>
                <div style={styles.uploadArea}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfileImageChange} 
                    style={styles.fileInput} 
                    id="profile-upload"
                  />
                  <label htmlFor="profile-upload" style={styles.uploadLabel}>
                    <svg style={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Click to upload profile picture</span>
                    <span style={styles.uploadHint}>JPG, PNG up to 2MB</span>
                  </label>
                  {(formData.profilePictureBase64 || formData.profilePictureUpload) && (
                    <img
                      src={getProfileImageSrc(formData.profilePictureBase64 || formData.profilePictureUpload)}
                      alt="Profile Preview"
                      style={styles.uploadPreview}
                    />
                  )}
                </div>
              </div>

              {/* Government ID Proofs */}
              <div style={styles.formSection}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>Government ID Proofs</h3>
                  <button onClick={handleAddIdProof} style={styles.addButton}>
                    <svg style={styles.addIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add ID Proof
                  </button>
                </div>
                
                {(formData.govtIdProofs || []).map((proof, index) => (
                  <div key={index} style={styles.idProofForm}>
                    <div style={styles.idProofHeader}>
                      <h4 style={styles.idProofTitle}>ID Proof #{index + 1}</h4>
                      {formData.govtIdProofs.length > 1 && (
                        <button 
                          onClick={() => handleRemoveIdProof(index)}
                          style={styles.removeButton}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>ID Type</label>
                        <select
                          name="idType"
                          value={proof.idType}
                          onChange={(e) => handleIdProofChange(index, e)}
                          style={styles.input}
                        >
                          <option value="">Select ID Type</option>
                          <option value="Aadhar">Aadhar</option>
                          <option value="PAN">PAN</option>
                          <option value="Passport">Passport</option>
                          <option value="VoterID">Voter ID</option>
                          <option value="DrivingLicense">Driving License</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>ID Number</label>
                        <input
                          name="idNumber"
                          value={proof.idNumber}
                          onChange={(e) => handleIdProofChange(index, e)}
                          style={styles.input}
                          placeholder="Enter ID number"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Document Image</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleIdImageChange(index, e)} 
                          style={styles.fileInput}
                          id={`id-upload-${index}`}
                        />
                        <label htmlFor={`id-upload-${index}`} style={styles.uploadLabel}>
                          <svg style={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                          <span>Upload document</span>
                        </label>
                        {proof.documentImage && (
                          <img
                            src={getDocumentImageSrc(proof.documentImage)}
                            alt="ID Preview"
                            style={styles.idPreview}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button onClick={handleClose} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleUpdate} style={styles.saveButton}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View full data modal – complete admin data without loginHistory */}
      {(loadingFullData || viewFullDataAdmin) && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {loadingFullData ? "Loading..." : "Admin full data"}
              </h2>
              {!loadingFullData && (
                <button
                  onClick={() => setViewFullDataAdmin(null)}
                  style={styles.closeButton}
                  aria-label="Close"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={styles.closeIcon}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div style={styles.modalContent}>
              {loadingFullData ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                  Loading admin details...
                </div>
              ) : viewFullDataAdmin ? (
                <div style={styles.viewFullDataContent}>
                  <div style={styles.viewFullDataSection}>
                    <h3 style={styles.sectionTitle}>Profile</h3>
                    {viewFullDataAdmin.profilePictureUpload && (
                      <div style={{ marginBottom: 16 }}>
                        <img
                          src={getProfileImageSrc(viewFullDataAdmin.profilePictureUpload)}
                          alt={viewFullDataAdmin.name}
                          style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                        />
                      </div>
                    )}
                    <div style={styles.viewFullDataGrid}>
                      <Row label="Name" value={viewFullDataAdmin.name} />
                      <Row label="Email" value={viewFullDataAdmin.email} />
                      <Row label="Mobile" value={viewFullDataAdmin.mobilenumber} />
                      <Row label="Gender" value={viewFullDataAdmin.gender} />
                      <Row label="Age" value={viewFullDataAdmin.age != null ? viewFullDataAdmin.age : "N/A"} />
                      <Row label="Role" value={viewFullDataAdmin.role} />
                      <Row label="Designation (Board)" value={viewFullDataAdmin.designationInBoard} />
                      <Row label="Permanent address" value={viewFullDataAdmin.permanentAddress} />
                      <Row label="Temporary address" value={viewFullDataAdmin.tempAddress} />
                    </div>
                  </div>
                  {viewFullDataAdmin.bosDetails && (
                    <div style={styles.viewFullDataSection}>
                      <h3 style={styles.sectionTitle}>BOS details</h3>
                      <div style={styles.viewFullDataGrid}>
                        <Row label="Member ID" value={viewFullDataAdmin.bosDetails.member_id} />
                        <Row label="Designation" value={viewFullDataAdmin.bosDetails.designation} />
                        <Row label="Joining date" value={viewFullDataAdmin.bosDetails.joining_date ? new Date(viewFullDataAdmin.bosDetails.joining_date).toLocaleDateString() : "N/A"} />
                        <Row label="Term end" value={viewFullDataAdmin.bosDetails.term_end ? new Date(viewFullDataAdmin.bosDetails.term_end).toLocaleDateString() : "N/A"} />
                      </div>
                    </div>
                  )}
                  {viewFullDataAdmin.govtIdProofs && viewFullDataAdmin.govtIdProofs.length > 0 && (
                    <div style={styles.viewFullDataSection}>
                      <h3 style={styles.sectionTitle}>Government ID proofs</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                        {viewFullDataAdmin.govtIdProofs.map((idp, idx) => (
                          <div key={idx} style={styles.idProofCard}>
                            <div style={styles.viewFullDataGrid}>
                              <Row label="Type" value={idp.idType} />
                              <Row label="Number" value={idp.idNumber} />
                            </div>
                            {idp.documentImage && (
                              <img
                                src={getDocumentImageSrc(idp.documentImage)}
                                alt={idp.idType}
                                style={styles.idPreview}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Row({ label, value }) {
  const v = value === undefined || value === null || value === "" ? "—" : String(value);
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{label}</span>
      <div style={{ fontSize: 14, color: "#1f2937", marginTop: 2 }}>{v}</div>
    </div>
  );
}

// Modern, professional styles
const styles = {
  container: {
    padding: "32px",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    marginBottom: "16px",
    backgroundColor: "white",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  backIcon: {
    width: "20px",
    height: "20px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "50vh",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "#6b7280",
    fontSize: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    fontWeight: "500",
  },
  statsCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
     display: "flex",
     flexDirection: "column",
     gap: "16px",
  },
    headerActions: {
      background: "white",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },

    downloadAllButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "10px 20px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      width: "100%",
    },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statNumber: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500",
  },
  filtersContainer: {
    display: "flex",
    gap: "16px",
    marginBottom: "32px",
    alignItems: "center",
  },
  searchBox: {
    position: "relative",
    flex: 1,
    maxWidth: "400px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "20px",
    height: "20px",
    color: "#9ca3af",
  },
  searchInput: {
    width: "100%",
    padding: "12px 12px 12px 40px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "14px",
    backgroundColor: "white",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease",
  },
  roleFilter: {
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "14px",
    backgroundColor: "white",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    minWidth: "160px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "24px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    border: "1px solid #f3f4f6",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  avatarSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    objectFit: "cover",
    border: "3px solid #f3f4f6",
  },
  avatarPlaceholder: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "18px",
    fontWeight: "600",
    border: "3px solid #f3f4f6",
  },
  nameSection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  name: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  roleBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: "white",
    textTransform: "capitalize",
    alignSelf: "flex-start",
  },
  menuButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#9ca3af",
    cursor: "pointer",
    padding: "4px",
  },
  menuBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  menuDropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 4,
    minWidth: 180,
    background: "white",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    border: "1px solid #e5e7eb",
    zIndex: 20,
    overflow: "hidden",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "10px 14px",
    border: "none",
    background: "none",
    fontSize: 14,
    color: "#374151",
    cursor: "pointer",
    textAlign: "left",
  },
  menuItemIcon: {
    width: 18,
    height: 18,
    flexShrink: 0,
  },
  viewFullDataContent: {
    maxHeight: "70vh",
    overflowY: "auto",
  },
  viewFullDataSection: {
    marginBottom: 24,
  },
  viewFullDataGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px 24px",
  },
  idProofCard: {
    padding: 16,
    background: "#f8fafc",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    minWidth: 200,
  },
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  infoIcon: {
    width: "16px",
    height: "16px",
    color: "#6b7280",
    flexShrink: 0,
  },
  infoText: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500",
  },
  idProofsSection: {
    marginBottom: "20px",
  },
  idProofsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "12px",
  },
  idProofsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  idProofBadge: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  idType: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
  },
  idNumber: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  downloadButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minWidth: "120px",
  },
  editButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  deleteButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  buttonIcon: {
    width: "16px",
    height: "16px",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    color: "#6b7280",
  },
  emptyIcon: {
    width: "64px",
    height: "64px",
    margin: "0 auto 16px",
    color: "#d1d5db",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#374151",
  },
  emptyText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    background: "white",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "800px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "32px 32px 0",
    marginBottom: "24px",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1f2937",
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    padding: "8px",
    cursor: "pointer",
    borderRadius: "8px",
    color: "#6b7280",
    transition: "all 0.2s ease",
  },
  closeIcon: {
    width: "24px",
    height: "24px",
  },
  modalContent: {
    flex: 1,
    overflowY: "auto",
    padding: "0 32px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    padding: "24px 32px 32px",
    borderTop: "1px solid #f3f4f6",
  },
  cancelButton: {
    flex: 1,
    padding: "12px 24px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  saveButton: {
    flex: 1,
    padding: "12px 24px",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#3b82f6",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  formSection: {
    marginBottom: "32px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  addIcon: {
    width: "16px",
    height: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  },
  input: {
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "14px",
    backgroundColor: "white",
    transition: "all 0.2s ease",
  },
  uploadArea: {
    border: "2px dashed #d1d5db",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
    transition: "all 0.2s ease",
    position: "relative",
  },
  fileInput: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    border: 0,
  },
  uploadLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    color: "#6b7280",
  },
  uploadIcon: {
    width: "48px",
    height: "48px",
    color: "#9ca3af",
  },
  uploadHint: {
    fontSize: "12px",
    color: "#9ca3af",
  },
  uploadPreview: {
    marginTop: "16px",
    maxWidth: "200px",
    maxHeight: "200px",
    borderRadius: "12px",
    objectFit: "cover",
  },
  idProofForm: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    backgroundColor: "#fafafa",
  },
  idProofHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  idProofTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    margin: 0,
  },
  removeButton: {
    padding: "6px 12px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
  },
  idPreview: {
    marginTop: "12px",
    maxWidth: "150px",
    maxHeight: "150px",
    borderRadius: "8px",
    objectFit: "cover",
    border: "1px solid #e5e7eb",
  },
};

// Add CSS animation for spinner
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

export default ViewAdmins;