import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  MenuBook as BookIcon,
  Quiz as QuizIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { examAnswerApi } from '../../../../Utils/examAnswerApi';

const CourseExamAnalytics = () => {
  const [courseId, setCourseId] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [viewType, setViewType] = useState('course'); // 'course' or 'chapter'
  const [examAttempts, setExamAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);

  const fetchData = async () => {
    if (!courseId.trim()) {
      setError('Please enter a valid Course ID');
      return;
    }

    if (viewType === 'chapter' && !chapterTitle.trim()) {
      setError('Please enter a chapter title for chapter view');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      if (viewType === 'course') {
        response = await examAnswerApi.getCourseExamAttempts(courseId);
      } else {
        response = await examAnswerApi.getChapterExamAttempts(courseId, chapterTitle);
      }

      setExamAttempts(response.data.data);
      calculateAnalytics(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exam data');
      setExamAttempts([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (attempts) => {
    if (attempts.length === 0) {
      setAnalytics(null);
      return;
    }

    const totalAttempts = attempts.length;
    const totalMarks = attempts.reduce((sum, attempt) => sum + attempt.totalMarks, 0);
    const totalObtained = attempts.reduce((sum, attempt) => sum + attempt.obtainedMarks, 0);
    const averageScore = totalObtained / totalMarks;
    
    // Grade distribution
    const gradeDistribution = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'F': 0
    };
    
    attempts.forEach(attempt => {
      const percentage = (attempt.obtainedMarks / attempt.totalMarks) * 100;
      if (percentage >= 90) gradeDistribution['A+']++;
      else if (percentage >= 80) gradeDistribution['A']++;
      else if (percentage >= 70) gradeDistribution['B+']++;
      else if (percentage >= 60) gradeDistribution['B']++;
      else if (percentage >= 50) gradeDistribution['C+']++;
      else if (percentage >= 40) gradeDistribution['C']++;
      else gradeDistribution['F']++;
    });

    // Chapter-wise breakdown (for course view)
    const chapterStats = {};
    if (viewType === 'course') {
      attempts.forEach(attempt => {
        if (!chapterStats[attempt.chapterTitle]) {
          chapterStats[attempt.chapterTitle] = {
            attempts: 0,
            totalMarks: 0,
            obtainedMarks: 0
          };
        }
        chapterStats[attempt.chapterTitle].attempts++;
        chapterStats[attempt.chapterTitle].totalMarks += attempt.totalMarks;
        chapterStats[attempt.chapterTitle].obtainedMarks += attempt.obtainedMarks;
      });
    }

    setAnalytics({
      totalAttempts,
      totalMarks,
      totalObtained,
      averageScore,
      gradeDistribution,
      chapterStats
    });
  };

  const handleSearch = () => {
    fetchData();
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
        <BookIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Course Exam Analytics
      </Typography>

      {/* Search Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>View Type</InputLabel>
                <Select
                  value={viewType}
                  onChange={(e) => setViewType(e.target.value)}
                  label="View Type"
                >
                  <MenuItem value="course">Entire Course</MenuItem>
                  <MenuItem value="chapter">Specific Chapter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Course ID"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="Enter course ID"
              />
            </Grid>
            
            {viewType === 'chapter' && (
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Chapter Title"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Enter chapter title"
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loading}
                fullWidth
                sx={{ height: '56px' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Analyze'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Analytics Dashboard */}
      {analytics && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <QuizIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4">{analytics.totalAttempts}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Attempts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4">
                    {(analytics.averageScore * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Score
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {analytics.totalObtained}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Marks Obtained
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {analytics.totalMarks}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Marks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Grade Distribution */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Grade Distribution
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
                  <Grid item xs={12/7} key={grade}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color={
                        grade === 'A+' || grade === 'A' ? 'success.main' :
                        grade === 'B+' || grade === 'B' ? 'info.main' :
                        grade === 'C+' || grade === 'C' ? 'warning.main' : 'error.main'
                      }>
                        {count}
                      </Typography>
                      <Typography variant="body2">{grade}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Chapter-wise Stats (for course view) */}
          {viewType === 'course' && Object.keys(analytics.chapterStats).length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chapter-wise Performance
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Chapter</TableCell>
                        <TableCell>Attempts</TableCell>
                        <TableCell>Total Marks</TableCell>
                        <TableCell>Obtained Marks</TableCell>
                        <TableCell>Average Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(analytics.chapterStats).map(([chapter, stats]) => (
                        <TableRow key={chapter}>
                          <TableCell>{chapter}</TableCell>
                          <TableCell>{stats.attempts}</TableCell>
                          <TableCell>{stats.totalMarks}</TableCell>
                          <TableCell>{stats.obtainedMarks}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${((stats.obtainedMarks / stats.totalMarks) * 100).toFixed(1)}%`}
                              color={getScoreColor(stats.obtainedMarks, stats.totalMarks)}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Detailed Attempts Table */}
      {examAttempts.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Individual Attempts ({examAttempts.length} results)
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Email</TableCell>
                    {viewType === 'course' && <TableCell>Chapter</TableCell>}
                    <TableCell>Score</TableCell>
                    <TableCell>Percentage</TableCell>
                    <TableCell>Attempted At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examAttempts.map((attempt) => (
                    <TableRow key={attempt._id}>
                      <TableCell>{attempt.username || 'N/A'}</TableCell>
                      <TableCell>{attempt.email}</TableCell>
                      {viewType === 'course' && (
                        <TableCell>{attempt.chapterTitle}</TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={`${attempt.obtainedMarks}/${attempt.totalMarks}`}
                          color={getScoreColor(attempt.obtainedMarks, attempt.totalMarks)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {((attempt.obtainedMarks / attempt.totalMarks) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>{formatDate(attempt.attemptedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CourseExamAnalytics;
