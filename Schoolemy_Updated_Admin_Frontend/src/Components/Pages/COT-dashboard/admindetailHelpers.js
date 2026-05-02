

export function getProfileImageSrc(profilePictureUpload) {
  if (!profilePictureUpload) return null;
  if (profilePictureUpload.startsWith("http://") || profilePictureUpload.startsWith("https://")) {
    return profilePictureUpload;
  }
  if (profilePictureUpload.startsWith("blob:")) {
    return profilePictureUpload;
  }
  if (profilePictureUpload.startsWith("data:")) {
    return profilePictureUpload;
  }
  return `data:image/jpeg;base64,${profilePictureUpload}`;
}

export function getDocumentImageSrc(documentImage) {
  if (!documentImage) return null;
  if (documentImage.startsWith("http://") || documentImage.startsWith("https://")) {
    return documentImage;
  }
  if (documentImage.startsWith("blob:")) {
    return documentImage;
  }
  if (documentImage.startsWith("data:")) {
    return documentImage;
  }
  return `data:image/jpeg;base64,${documentImage}`;
}

export function formatDateForInput(d) {
  if (d == null || d === "") return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}


export const LEGACY_RBAC_ROLES = [
  { roleName: "superadmin", displayName: "Super Admin" },
  { roleName: "admin", displayName: "Admin" },
  { roleName: "committeeoftrustees", displayName: "Committee of Trustees" },
  { roleName: "boscontroller", displayName: "BOS Controller" },
  { roleName: "bosmembers", displayName: "BOS Members" },
  { roleName: "coursemanagement", displayName: "Course management" },
  { roleName: "tutormanagement", displayName: "Tutor management" },
  { roleName: "usermanagement", displayName: "User management" },
  { roleName: "documentverification", displayName: "Document verification" },
  { roleName: "marketing", displayName: "Marketing" },
  { roleName: "auditor", displayName: "Auditor" },
  { roleName: "financial", displayName: "Financial" },
  { roleName: "datamaintenance", displayName: "Data Maintenance" },
  { roleName: "coursecontroller", displayName: "Course Controller" },
];

export function getRoleDisplayName(roleName, rolesList) {
  if (!roleName) return "";
  const key = String(roleName).toLowerCase().trim();
  const hit = (rolesList || []).find((r) => r.roleName === key);
  if (hit?.displayName) return hit.displayName;
  return String(roleName).replace(/([A-Z])/g, " $1").trim();
}
