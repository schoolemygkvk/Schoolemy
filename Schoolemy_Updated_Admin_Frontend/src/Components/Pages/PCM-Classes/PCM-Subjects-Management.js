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
  Alert,
  Tooltip,
  TablePagination,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import api from '../../../Utils/api';
import { getToken } from '../../../Hooks/useToken';

const PCMSubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchText, setSearchText] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#3498db',
    meetLink: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });
  const [formError, setFormError] = useState('');

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const response = await api.get('/api/pcm/subjects?includeInactive=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data?.success) {
        setSubjects(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        setError('Failed to fetch subjects');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleOpenDialog = (subject = null) => {
    if (subject) {
      setIsEditing(true);
      setEditId(subject._id);
      setFormData({
        name: subject.name,
        code: subject.code,
        color: subject.color,
        meetLink: subject.meetLink,
        description: subject.description || '',
        displayOrder: subject.displayOrder || 0,
        isActive: subject.isActive !== false,
      });
    } else {
      setIsEditing(false);
      setEditId(null);
      setFormData({
        name: '',
        code: '',
        color: '#3498db',
        meetLink: '',
        description: '',
        displayOrder: 0,
        isActive: true,
      });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Subject name is required');
      return false;
    }
    if (!formData.code.trim()) {
      setFormError('Subject code is required');
      return false;
    }
    if (!formData.meetLink.trim()) {
      setFormError('Meet link is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (isEditing) {
        await api.put(`/api/pcm/subjects/${editId}`, formData, { headers });
        setSuccess('Subject updated successfully');
      } else {
        await api.post('/api/pcm/subjects', formData, { headers });
        setSuccess('Subject created successfully');
      }

      handleCloseDialog();
      fetchSubjects();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error saving subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await api.delete(`/api/pcm/subjects/${deleteId}`, { headers });
      setSuccess('Subject deleted successfully');
      setDeleteConfirm(false);
      setDeleteId(null);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting subject');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchText.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const paginatedSubjects = filteredSubjects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Manage PCM Subjects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Add Subject
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search subjects by name or code..."
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSubjects.length > 0 ? (
                  paginatedSubjects.map((subject) => (
                    <TableRow key={subject._id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{subject.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={subject.code}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: subject.color,
                            borderRadius: 1,
                            border: '1px solid #ddd',
                          }}
                          title={subject.color}
                        />
                      </TableCell>
                      <TableCell>
                        {subject.isActive ? (
                          <Chip label="Active" color="success" size="small" />
                        ) : (
                          <Chip label="Inactive" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>{subject.displayOrder}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(subject)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDeleteId(subject._id);
                              setDeleteConfirm(true);
                            }}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No subjects found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {filteredSubjects.length > rowsPerPage && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredSubjects.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )}
          </>
        )}
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Subject' : 'Add New Subject'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Subject Name"
              placeholder="e.g., Physics"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Subject Code"
              placeholder="e.g., physics"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toLowerCase() })
              }
              disabled={loading || isEditing}
              helperText={isEditing ? 'Code cannot be changed after creation' : ''}
            />

            <TextField
              fullWidth
              label="Color (Hex)"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              disabled={loading}
              InputProps={{
                sx: { height: 56 },
              }}
            />

            <TextField
              fullWidth
              label="Meet Link"
              placeholder="https://meet.google.com/..."
              value={formData.meetLink}
              onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Description"
              placeholder="Brief description of the subject"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={3}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Display Order"
              type="number"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({ ...formData, displayOrder: parseInt(e.target.value) })
              }
              disabled={loading}
              helperText="Lower numbers appear first"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  disabled={loading}
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this subject? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PCMSubjectsManagement;
