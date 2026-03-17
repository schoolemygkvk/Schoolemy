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
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { examAnswerApi } from '../../../../Utils/examAnswerApi';

const UserExamStats = () => {
  const [userId, setUserId] = useState('');
  const [userStats, setUserStats] = useState(null);
  const [userAttempts, setUserAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUserData = async () => {
    if (!userId.trim()) {
      setError('Please enter a valid User ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch both stats and attempts in parallel
      const [statsResponse, attemptsResponse] = await Promise.all([
        examAnswerApi.getUserExamStats(userId),
        examAnswerApi.getUserExamAttempts(userId)
      ]);

      setUserStats(statsResponse.data.data);
      setUserAttempts(attemptsResponse.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch user data');
      setUserStats(null);
      setUserAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      fetchUserData();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'success' };
    if (percentage >= 80) return { grade: 'A', color: 'success' };
    if (percentage >= 70) return { grade: 'B+', color: 'info' };
    if (percentage >= 60) return { grade: 'B', color: 'info' };
    if (percentage >= 50) return { grade: 'C+', color: 'warning' };
    if (percentage >= 40) return { grade: 'C', color: 'warning' };
    return { grade: 'F', color: 'error' };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        <SchoolIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Student Exam Statistics
      </Typography>

      {/* Search Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Enter Student User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter user ID to view statistics"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                onClick={fetchUserData}
                disabled={!userId.trim() || loading}
                fullWidth
                sx={{ height: '56px' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Search'}
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

      {/* Statistics Display */}
      {userStats && (
        <>
          {/* Overall Statistics */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Overall Performance
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="h4">{userStats.overall.totalAttempts}</Typography>
                    <Typography variant="body2">Total Attempts</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                    <Typography variant="h4">{userStats.overall.totalObtainedMarks}</Typography>
                    <Typography variant="body2">Total Marks Obtained</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                    <Typography variant="h4">{userStats.overall.totalMarks}</Typography>
                    <Typography variant="body2">Total Marks</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                    <Typography variant="h4">
                      {(userStats.overall.averageScore * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">Average Score</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Grade Display */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                {(() => {
                  const { grade, color } = getGrade(userStats.overall.averageScore * 100);
                  return (
                    <Chip
                      icon={<TrophyIcon />}
                      label={`Overall Grade: ${grade}`}
                      color={color}
                      size="large"
                      sx={{ fontSize: '1.1rem', py: 3 }}
                    />
                  );
                })()}
              </Box>
            </CardContent>
          </Card>

          {/* Course-wise Statistics */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Course-wise Performance
              </Typography>
              
              <Grid container spacing={2}>
                {userStats.courseWise && userStats.courseWise.length > 0 ? userStats.courseWise.map((course, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {course.course?.[0]?.courseName || `Course ${typeof course._id === 'string' ? course._id : 'Unknown'}`}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Attempts: {course.attempts || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Score: {course.obtainedMarks || 0}/{course.totalMarks || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">Average:</Typography>
                            <Chip
                              label={`${((course.averageScore || 0) * 100).toFixed(1)}%`}
                              size="small"
                              color={getGrade((course.averageScore || 0) * 100).color}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )) : (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" textAlign="center">
                      No course-wise data available
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Attempts */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Exam Attempts
              </Typography>
              
              <List>
                {userAttempts && userAttempts.length > 0 ? userAttempts.slice(0, 10).map((attempt, index) => (
                  <React.Fragment key={attempt._id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1">
                              {attempt.chapterTitle || 'N/A'}
                            </Typography>
                            <Chip
                              label={`${attempt.obtainedMarks || 0}/${attempt.totalMarks || 0}`}
                              size="small"
                              color={getGrade(((attempt.obtainedMarks || 0) / (attempt.totalMarks || 1)) * 100).color}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Course: {attempt.courseId?.courseName || (typeof attempt.courseId === 'string' ? attempt.courseId : 'N/A')}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Date: {formatDate(attempt.attemptedAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(userAttempts.length - 1, 9) && <Divider />}
                  </React.Fragment>
                )) : (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="textSecondary" textAlign="center">
                          No recent attempts found
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
              
              {userAttempts.length > 10 && (
                <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ mt: 2 }}>
                  Showing 10 of {userAttempts.length} attempts
                </Typography>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default UserExamStats;
