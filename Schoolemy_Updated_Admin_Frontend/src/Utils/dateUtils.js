
export const formatDate = (dateString, opts) => {
  if (!dateString) return "N/A";

  try {
    const options = opts ?? {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";

    return d.toLocaleDateString('en-US', options);
  } catch {
    return "N/A";
  }
};
