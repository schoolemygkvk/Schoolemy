import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { examAnswerApi } from '../../../../Utils/examAnswerApi';

const ExamAnswerDashboard = () => {
  const [examAttempts, setExamAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedView, setSelectedView] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      switch (selectedView) {
        case 'all':
          response = await examAnswerApi.getAllExamAttempts(currentPage, 10);
          setExamAttempts(response.data.data.attempts);
          setTotalPages(response.data.data.pagination.totalPages);
          break;
        case 'user':
          if (filterValue) {
            response = await examAnswerApi.getUserExamAttempts(filterValue);
            setExamAttempts(response.data.data);
          }
          break;
        case 'course':
          if (filterValue) {
            response = await examAnswerApi.getCourseExamAttempts(filterValue);
            setExamAttempts(response.data.data);
          }
          break;
        case 'exam':
          if (filterValue) {
            response = await examAnswerApi.getExamAttempts(filterValue);
            setExamAttempts(response.data.data);
          }
          break;
        default:
          response = await examAnswerApi.getAllExamAttempts(currentPage, 10);
          setExamAttempts(response.data.data.attempts);
          setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exam attempts');
    } finally {
      setLoading(false);
    }
  }, [selectedView, currentPage, filterValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetails = async (attemptId) => {
    try {
      const response = await examAnswerApi.getExamAttemptById(attemptId);
      setSelectedAttempt(response.data.data);
      setDetailDialogOpen(true);
    } catch (err) {
      setError('Failed to fetch attempt details');
    }
  };

  const handleDeleteAttempt = async (attemptId) => {
    if (window.confirm('Are you sure you want to delete this exam attempt?')) {
      try {
        await examAnswerApi.deleteExamAttempt(attemptId);
        fetchData(); // Refresh data
      } catch (err) {
        setError('Failed to delete exam attempt');
      }
    }
  };

  const getScoreColor = (obtainedMarks, totalMarks) => {
    const percentage = (obtainedMarks / totalMarks) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        <AssessmentIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Exam Answers Dashboard
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>View By</InputLabel>
                <Select
                  value={selectedView}
                  onChange={(e) => {
                    setSelectedView(e.target.value);
                    setFilterValue('');
                    setCurrentPage(1);
                  }}
                  label="View By"
                >
                  <MenuItem value="all">All Attempts</MenuItem>
                  <MenuItem value="user">By User ID</MenuItem>
                  <MenuItem value="course">By Course ID</MenuItem>
                  <MenuItem value="exam">By Exam ID</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {selectedView !== 'all' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={`Enter ${selectedView.toUpperCase()} ID`}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={`Enter ${selectedView} ID to filter`}
                />
              </Grid>
            )}
            
            {selectedView !== 'all' && (
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  onClick={fetchData}
                  disabled={!filterValue || loading}
                  fullWidth
                >
                  Search
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      {!loading && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Exam Attempts ({examAttempts.length} results)
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Info</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Chapter</TableCell>
                    <TableCell>Exam</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Attempted At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examAttempts && examAttempts.length > 0 ? examAttempts.map((attempt) => (
                    <TableRow key={attempt._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {attempt.username || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {attempt.email || 'N/A'}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Reg: {attempt.studentRegisterNumber || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {attempt.courseId?.courseName || (typeof attempt.courseId === 'string' ? attempt.courseId : 'N/A')}
                      </TableCell>
                      <TableCell>{attempt.chapterTitle || 'N/A'}</TableCell>
                      <TableCell>
                        {attempt.examId?.title || (typeof attempt.examId === 'string' ? attempt.examId : 'N/A')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${attempt.obtainedMarks || 0}/${attempt.totalMarks || 0}`}
                          color={getScoreColor(attempt.obtainedMarks, attempt.totalMarks)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(attempt.attemptedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetails(attempt._id)}
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteAttempt(attempt._id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No exam attempts found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {selectedView === 'all' && totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Typography sx={{ mx: 2, alignSelf: 'center' }}>
                  Page {currentPage} of {totalPages}
                </Typography>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Exam Attempt Details</DialogTitle>
        <DialogContent>
          {selectedAttempt && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Student:</Typography>
                  <Typography>{selectedAttempt.username}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Email:</Typography>
                  <Typography>{selectedAttempt.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Register Number:</Typography>
                  <Typography>{selectedAttempt.studentRegisterNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Chapter:</Typography>
                  <Typography>{selectedAttempt.chapterTitle}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Score:</Typography>
                  <Typography>
                    {selectedAttempt.obtainedMarks}/{selectedAttempt.totalMarks}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Attempted At:</Typography>
                  <Typography>{formatDate(selectedAttempt.attemptedAt)}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Answers:
              </Typography>
              
              {selectedAttempt.answers?.map((answer, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" width="100%">
                      <Typography sx={{ flexGrow: 1 }}>
                        Question {index + 1}
                      </Typography>
                      <Chip
                        label={answer.isCorrect ? 'Correct' : 'Incorrect'}
                        color={answer.isCorrect ? 'success' : 'error'}
                        size="small"
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="body2">
                        {answer.marksAwarded} marks
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Question:
                      </Typography>
                      <Typography paragraph>
                        {answer.question}
                      </Typography>
                      <Typography variant="subtitle2" gutterBottom>
                        Selected Answer:
                      </Typography>
                      <Typography>
                        {answer.selectedAnswer}
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamAnswerDashboard;
