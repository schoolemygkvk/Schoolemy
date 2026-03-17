import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  TablePagination,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Avatar,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../../Utils/api';

const ClassData = () => {
  // State for table data and pagination
  const [classes, setClasses] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for filters
  const [filters, setFilters] = useState({
    className: '',
    batch: '',
    academicYear: '',
    selectedSubject: ''
  });

  // State for edit dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editError, setEditError] = useState('');

  // State for view dialog
  const [viewDialog, setViewDialog] = useState(false);
  const [viewData, setViewData] = useState(null);

  // State for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // State for filter drawer
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch classes with filters
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const token = localStorage.getItem('token');
      const response = await api.get(`/classes-all?${queryParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success) {
        setClasses(response.data.data);
      } else {
        setError('Failed to fetch classes');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }, [filters, setLoading, setError, setClasses]);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchClasses();
  }, [filters, fetchClasses]);

  // Handle edit submit
  const handleEditSubmit = async () => {
    setEditError('');
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/classes/${editData._id}`, editData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success) {
        setEditDialog(false);
        fetchClasses(); // Refresh the list
      } else {
        setEditError('Failed to update class');
      }
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update class');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/classes/${deleteId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success) {
        setDeleteDialog(false);
        fetchClasses(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete class');
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get subject color
  const getSubjectColor = (subject) => {
    switch (subject) {
      case 'physics': return '#2196f3';
      case 'chemistry': return '#9c27b0';
      case 'mathematics': return '#2e7d32';
      default: return '#666';
    }
  };

  // Get subject icon
  const getSubjectIcon = (subject) => {
    switch (subject) {
      case 'physics': return '⚛️';
      case 'chemistry': return '🧪';
      case 'mathematics': return '∫';
      default: return '📚';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Card 
        elevation={0}
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="700" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <SchoolIcon sx={{ fontSize: 32 }} />
                </Avatar>
                PCM Classes Management
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                Manage and monitor all Physics, Chemistry, and Mathematics classes
              </Typography>
            </Box>

          </Box>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={2}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="overline" fontWeight="600">
                    Total Classes
                  </Typography>
                  <Typography variant="h4" fontWeight="700" sx={{ mt: 1 }}>
                    {classes.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#2196f3', 0.1), color: '#2196f3' }}>
                  <SchoolIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={2}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="overline" fontWeight="600">
                    Physics
                  </Typography>
                  <Typography variant="h4" fontWeight="700" sx={{ mt: 1 }}>
                    {classes.filter(c => c.selectedSubject === 'physics').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#2196f3', 0.1), color: '#2196f3' }}>
                  ⚛️
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={2}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="overline" fontWeight="600">
                    Chemistry
                  </Typography>
                  <Typography variant="h4" fontWeight="700" sx={{ mt: 1 }}>
                    {classes.filter(c => c.selectedSubject === 'chemistry').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#9c27b0', 0.1), color: '#9c27b0' }}>
                  🧪
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={2}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="overline" fontWeight="600">
                    Mathematics
                  </Typography>
                  <Typography variant="h4" fontWeight="700" sx={{ mt: 1 }}>
                    {classes.filter(c => c.selectedSubject === 'mathematics').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#2e7d32', 0.1), color: '#2e7d32' }}>
                  ∫
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Card */}
      <Card 
        elevation={1}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Toolbar */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search classes..."
                  value={filters.className}
                  onChange={(e) => setFilters(prev => ({ ...prev, className: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'background.default'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { md: 'flex-end' } }}>
                  <Button
                    startIcon={<FilterIcon />}
                    onClick={() => setFilterOpen(!filterOpen)}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    Filters
                  </Button>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={() => setFilters({
                      className: '',
                      batch: '',
                      academicYear: '',
                      selectedSubject: ''
                    })}
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    Reset
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Expandable Filters */}
            {filterOpen && (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Batch"
                      value={filters.batch}
                      onChange={(e) => setFilters(prev => ({ ...prev, batch: e.target.value }))}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Academic Year"
                      value={filters.academicYear}
                      onChange={(e) => setFilters(prev => ({ ...prev, academicYear: e.target.value }))}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Subject</InputLabel>
                      <Select
                        value={filters.selectedSubject}
                        label="Subject"
                        onChange={(e) => setFilters(prev => ({ ...prev, selectedSubject: e.target.value }))}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">All Subjects</MenuItem>
                        <MenuItem value="physics">Physics</MenuItem>
                        <MenuItem value="chemistry">Chemistry</MenuItem>
                        <MenuItem value="mathematics">Mathematics</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>

          {/* Error message */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mx: 3, 
                mt: 2,
                borderRadius: 2
              }}
            >
              {error}
            </Alert>
          )}

          {/* Data table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Class Details</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Batch & Year</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Schedule</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} sx={{ mb: 2 }} />
                      <Typography color="textSecondary">Loading classes...</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  (rowsPerPage > 0
                    ? classes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    : classes
                  ).map((cls) => (
                    <TableRow 
                      key={cls._id}
                      sx={{
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'scale(1.002)'
                        }
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(getSubjectColor(cls.selectedSubject), 0.1),
                              color: getSubjectColor(cls.selectedSubject),
                              width: 48,
                              height: 48,
                              fontSize: '1.2rem'
                            }}
                          >
                            {getSubjectIcon(cls.selectedSubject)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="600">
                              {cls.className}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {cls.meetLink || 'No meet link'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Box>
                          <Typography variant="body1" fontWeight="500">
                            {cls.batch}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {cls.academicYear}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip 
                          label={cls.selectedSubject.charAt(0).toUpperCase() + cls.selectedSubject.slice(1)} 
                          sx={{
                            bgcolor: alpha(getSubjectColor(cls.selectedSubject), 0.1),
                            color: getSubjectColor(cls.selectedSubject),
                            fontWeight: 600,
                            borderRadius: 1.5
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {format(new Date(cls.startTime), 'MMM d, yyyy')}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {format(new Date(cls.startTime), 'h:mm a')} - {format(new Date(cls.endTime), 'h:mm a')}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip 
                          label={cls.is_active ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            bgcolor: cls.is_active ? alpha('#2e7d32', 0.1) : alpha('#d32f2f', 0.1),
                            color: cls.is_active ? '#2e7d32' : '#d32f2f',
                            fontWeight: 600,
                            borderRadius: 1.5,
                            '& .MuiChip-label': {
                              px: 2
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => {
                                setViewData(cls);
                                setViewDialog(true);
                              }}
                              sx={{
                                color: 'primary.main',
                                '&:hover': { bgcolor: alpha('#2196f3', 0.1) }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Class">
                            <IconButton
                              onClick={() => {
                                setEditData(cls);
                                setEditDialog(true);
                              }}
                              sx={{
                                color: 'success.main',
                                '&:hover': { bgcolor: alpha('#2e7d32', 0.1) }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Class">
                            <IconButton
                              onClick={() => {
                                setDeleteId(cls._id);
                                setDeleteDialog(true);
                              }}
                              sx={{
                                color: 'error.main',
                                '&:hover': { bgcolor: alpha('#d32f2f', 0.1) }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={classes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          />
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          fontWeight: 600
        }}>
          Class Details
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {viewData && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(getSubjectColor(viewData.selectedSubject), 0.1),
                    color: getSubjectColor(viewData.selectedSubject),
                    width: 60,
                    height: 60
                  }}
                >
                  {getSubjectIcon(viewData.selectedSubject)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="700">
                    {viewData.className}
                  </Typography>
                  <Chip 
                    label={viewData.selectedSubject.charAt(0).toUpperCase() + viewData.selectedSubject.slice(1)} 
                    sx={{
                      bgcolor: alpha(getSubjectColor(viewData.selectedSubject), 0.1),
                      color: getSubjectColor(viewData.selectedSubject),
                      fontWeight: 600,
                      mt: 0.5
                    }}
                  />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Batch"
                    value={viewData.batch}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Academic Year"
                    value={viewData.academicYear}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Meet Link"
                    value={viewData.meetLink || 'Not provided'}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Time"
                    value={format(new Date(viewData.startTime), 'PPpp')}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Time"
                    value={format(new Date(viewData.endTime), 'PPpp')}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setViewDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'success.main', 
          color: 'white',
          fontWeight: 600
        }}>
          Edit Class
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {editData && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Class Name"
                  value={editData.className}
                  onChange={(e) => setEditData({ ...editData, className: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Batch"
                  value={editData.batch}
                  onChange={(e) => setEditData({ ...editData, batch: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Academic Year"
                  value={editData.academicYear}
                  onChange={(e) => setEditData({ ...editData, academicYear: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={editData.selectedSubject}
                    label="Subject"
                    onChange={(e) => setEditData({ ...editData, selectedSubject: e.target.value })}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="physics">Physics</MenuItem>
                    <MenuItem value="chemistry">Chemistry</MenuItem>
                    <MenuItem value="mathematics">Mathematics</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Time"
                  type="datetime-local"
                  value={format(new Date(editData.startTime), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Time"
                  type="datetime-local"
                  value={format(new Date(editData.endTime), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}
          {editError && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2,
                borderRadius: 2
              }}
            >
              {editError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setEditDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this class? This action cannot be undone and all associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setDeleteDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClassData;

