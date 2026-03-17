import axios from './api';

// Voting API functions
export const votingApi = {
  // Create a new poll
  createPoll: (pollData) => axios.post('/create-poll', pollData),
  
  // Get all polls
  getAllPolls: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return axios.get(`/polls${params ? `?${params}` : ''}`);
  },
  
  // Get poll by ID
  getPollById: (pollId) => axios.get(`/poll/${pollId}`),
  
  // Get active polls for current user
  getActivePolls: () => axios.get('/active-polls'),
  
  // Cast a vote
  castVote: (pollId, voteData) => axios.post(`/poll/${pollId}/vote`, voteData),
  
  // Get poll results
  getPollResults: (pollId) => axios.get(`/poll/${pollId}/results`),
  
  // Get live results
  getLiveResults: (pollId) => axios.get(`/poll/${pollId}/live-results`),
  
  // Update poll
  updatePoll: (pollId, updateData) => axios.put(`/poll/${pollId}`, updateData),
  
  // Delete poll
  deletePoll: (pollId) => axios.delete(`/poll/${pollId}`),
  
  // Get statistics (boscontroller only)
  getStatistics: () => axios.get('/statistics')
};

// Helper function to handle API errors
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return defaultMessage;
};

// Helper function to format dates
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

// Helper function to format date for input
export const formatDateForInput = (date) => {
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
};

// Helper function to get status styling
export const getStatusStyling = (status) => {
  const styles = {
    active: {
      color: '#10b981',
      background: '#dcfce7',
      icon: '🟢'
    },
    completed: {
      color: '#6b7280',
      background: '#f3f4f6',
      icon: '✅'
    },
    draft: {
      color: '#f59e0b',
      background: '#fef3c7',
      icon: '📝'
    },
    cancelled: {
      color: '#ef4444',
      background: '#fee2e2',
      icon: '❌'
    }
  };
  
  return styles[status] || styles.draft;
};

// Helper function to check user permissions
export const checkUserPermissions = (user, requiredRole) => {
  if (!user || !user.role) return false;
  
  const roleHierarchy = {
    'superadmin': 5,
    'boscontroller': 4,
    'bosmembers': 3,
    'admin': 2,
    'datamaintenance': 1,
    'coursecontroller': 1,
    'markettingcontroller': 1
  };
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};

// Helper function to validate poll data
export const validatePollData = (pollData) => {
  const errors = [];
  
  if (!pollData.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!pollData.description?.trim()) {
    errors.push('Description is required');
  }
  
  if (!pollData.options || pollData.options.length < 2) {
    errors.push('At least 2 options are required');
  }
  
  if (pollData.options?.some(option => !option.trim())) {
    errors.push('All options must have content');
  }
  
  if (!pollData.start_date) {
    errors.push('Start date is required');
  }
  
  if (!pollData.end_date) {
    errors.push('End date is required');
  }
  
  if (new Date(pollData.start_date) >= new Date(pollData.end_date)) {
    errors.push('End date must be after start date');
  }
  
  if (new Date(pollData.start_date) < new Date()) {
    errors.push('Start date cannot be in the past');
  }
  
  return errors;
};

// Helper function to calculate time remaining
export const getTimeRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  
  if (diff <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};

// Helper function to generate poll summary
export const generatePollSummary = (poll) => {
  const totalVotes = poll.total_votes || 0;
  const winningOption = poll.results?.reduce((max, option) => 
    option.vote_count > max.vote_count ? option : max
  );
  
  return {
    totalVotes,
    winningOption,
    participationRate: poll.eligible_voters ? 
      Math.round((totalVotes / poll.eligible_voters.length) * 100) : 0,
    status: poll.status,
    timeRemaining: poll.status === 'active' ? getTimeRemaining(poll.end_date) : null
  };
};

export default votingApi;
