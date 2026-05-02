import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../../../Utils/api";
import { usePcmSubjects } from "../../../Hooks/usePcmSubjects";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
} from "@mui/material";
import { ArrowBack, Save, Add, Delete, Visibility, Close } from "@mui/icons-material";
import styled, { ThemeProvider } from "styled-components";
import { HiArrowUpRight } from "react-icons/hi2";
import { FaAtom, FaFlask, FaCalculator, FaClock } from "react-icons/fa";

// --- Styled components & theme for CTA preview (user-side design) ---

const SectionWrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.sectionPadding} 5%;
  background: #EFEBE5;
`;

const Container = styled.div`
  max-width: 1300px;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[12]};
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size["4xl"]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size["2xl"]};
  }
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.size.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  max-width: 750px;
  margin: 0 auto;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.base};
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[8]};
  margin-top: ${({ theme }) => theme.spacing[10]};

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[6]};
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }
`;

const PreviewCard = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius["2xl"]};
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: ${({ theme }) => theme.transitions.base};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ $gradientColor }) => $gradientColor};
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing[6]};
  }
`;

const IconCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ $bgColor }) => $bgColor};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto ${({ theme }) => theme.spacing[6]};
  transition: ${({ theme }) => theme.transitions.base};

  ${PreviewCard}:hover & {
    transform: scale(1.1) rotate(10deg);
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
`;

const CardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.size["2xl"]};
  font-weight: ${({ theme }) => theme.typography.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.xl};
  }
`;

const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.size.base};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0 0 ${({ theme }) => theme.spacing[6]} 0;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.sm};
  }
`;

const JoinButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  padding-right: ${({ theme }) => theme.spacing[3]};
  background-color: ${({ $bgColor }) => $bgColor};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  font-size: ${({ theme }) => theme.typography.size.base};
  transition: ${({ theme }) => theme.transitions.base};
  width: fit-content;
  margin: 0 auto;

  &:hover {
    transform: translateX(5px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.sm};
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[5]};
  }
`;

const ButtonText = styled.span`
  padding-left: ${({ theme }) => theme.spacing[2]};
`;

const ButtonIconWrapper = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: ${({ theme }) => theme.transitions.base};

  ${JoinButton}:hover & {
    background-color: rgba(255, 255, 255, 0.5);
    transform: rotate(45deg);
  }

  @media (max-width: 768px) {
    width: 30px;
    height: 30px;
    font-size: 0.9rem;
  }
`;

const StatusBadge = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing[4]};
  right: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.typography.size.xs};
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};

  ${({ $status }) => {
    if ($status === "live") {
      return `
        background-color: #10b981;
        color: white;
      `;
    } else if ($status === "upcoming") {
      return `
        background-color: #f59e0b;
        color: white;
      `;
    } else {
      return `
        background-color: #6b7280;
        color: white;
      `;
    }
  }}

  @media (max-width: 768px) {
    top: ${({ theme }) => theme.spacing[3]};
    right: ${({ theme }) => theme.spacing[3]};
    padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[3]};
  }
`;

const TimerText = styled.div`
  font-size: ${({ theme }) => theme.typography.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing[2]};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-weight: ${({ theme }) => theme.typography.weight.medium};

  svg {
    color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const DisabledButton = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  padding-right: ${({ theme }) => theme.spacing[3]};
  background-color: #9ca3af;
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.typography.weight.semibold};
  font-size: ${({ theme }) => theme.typography.size.base};
  width: fit-content;
  margin: 0 auto;
  cursor: not-allowed;
  opacity: 0.6;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.size.sm};
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[5]};
  }
`;

const previewTheme = {
  spacing: {
    sectionPadding: "4rem",
    12: "3rem",
    10: "2.5rem",
    8: "2rem",
    6: "1.5rem",
    4: "1rem",
    3: "0.75rem",
    2: "0.5rem",
    1: "0.25rem",
  },
  typography: {
    fonts: {
      accent:
        "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    size: {
      "4xl": "2.25rem",
      "2xl": "1.5rem",
      xl: "1.25rem",
      lg: "1.125rem",
      base: "1rem",
      sm: "0.875rem",
      xs: "0.75rem",
    },
    weight: {
      bold: 700,
      semibold: 600,
      medium: 500,
    },
    lineHeight: {
      relaxed: 1.6,
    },
  },
  colors: {
    text: {
      primary: "#111827",
      secondary: "#4B5563",
    },
    primary: {
      500: "#3b82f6",
    },
  },
  borderRadius: {
    "2xl": "1.5rem",
    full: "9999px",
  },
  shadows: {
    lg: "0 10px 25px rgba(15, 23, 42, 0.1)",
    xl: "0 20px 30px rgba(15, 23, 42, 0.15)",
    md: "0 4px 6px rgba(15, 23, 42, 0.1)",
  },
  transitions: {
    base: "all 0.2s ease-in-out",
  },
};

// Icon mapping for subjects (code to icon)
const ICON_MAP = {
  physics: FaAtom,
  chemistry: FaFlask,
  mathematics: FaCalculator,
};

// Default gradient colors per subject code
const GRADIENT_MAP = {
  physics: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  chemistry: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  mathematics: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
};

const LandingCtaPreview = ({ title, subtitle }) => {
  const { subjects: dbSubjects, loading: dbLoading } = usePcmSubjects();
  const [classesData, setClassesData] = useState({});
  const [timers, setTimers] = useState({});
  const [loading, setLoading] = useState(true);

  // Build subjects array dynamically from DB with icons and gradients
  const subjects = useMemo(() => {
    return dbSubjects
      .filter((s) => s.isActive !== false) // Only show active subjects
      .map((dbSubject) => ({
        id: dbSubject._id,
        title: dbSubject.name,
        key: dbSubject.code,
        icon: ICON_MAP[dbSubject.code.toLowerCase()] || FaAtom,
        description:
          dbSubject.description ||
          `Learn about ${dbSubject.name} with expert instructors.`,
        color: dbSubject.color || "#3498db",
        gradient:
          GRADIENT_MAP[dbSubject.code.toLowerCase()] ||
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }));
  }, [dbSubjects]);

  // Fetch classes for all active subjects
  useEffect(() => {
    if (subjects.length === 0) {
      setLoading(false);
      return;
    }

    const fetchClasses = async () => {
      try {
        const responses = await Promise.all(
          subjects.map((subject) =>
            axios
              .post(`/pcm/classes-pcm`, { subject: subject.key })
              .catch((err) => {
                console.error(`Error fetching ${subject.key}:`, err);
                return { data: { success: false, data: [] } };
              })
          )
        );

        const newClassesData = {};
        responses.forEach((response, index) => {
          const subjectKey = subjects[index].key;

          if (
            response.data.success &&
            response.data.data &&
            response.data.data.length > 0
          ) {
            const sortedClasses = response.data.data.sort((a, b) => {
              const aTime = new Date(a.startTime).getTime();
              const bTime = new Date(b.startTime).getTime();
              return aTime - bTime;
            });

            const activeClass =
              sortedClasses.find((cls) => cls.status !== "completed") ||
              sortedClasses[0];
            newClassesData[subjectKey] = activeClass;
          }
        });

        setClassesData(newClassesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setLoading(false);
      }
    };

    fetchClasses();
    const interval = setInterval(fetchClasses, 60000);
    return () => clearInterval(interval);
  }, [subjects]);

  useEffect(() => {
    const updateTimers = () => {
      const newTimers = {};

      Object.keys(classesData).forEach((subjectKey) => {
        const classItem = classesData[subjectKey];
        if (classItem) {
          const now = new Date();
          const startTime = new Date(classItem.startTime);
          const endTime = new Date(classItem.endTime);
          const fifteenMinutesBefore = new Date(
            startTime.getTime() - 15 * 60 * 1000
          );

          if (now >= fifteenMinutesBefore && now <= endTime) {
            newTimers[subjectKey] = { status: "joinable", time: null };
          } else if (now < fifteenMinutesBefore) {
            const diff = fifteenMinutesBefore.getTime() - now.getTime();
            newTimers[subjectKey] = { status: "upcoming", time: diff };
          } else {
            newTimers[subjectKey] = { status: "ended", time: null };
          }
        }
      });

      setTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [classesData]);

  const formatTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor(
      (milliseconds % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleJoinClass = (classData) => {
    if (classData && classData.meetLink) {
      window.open(classData.meetLink, "_blank", "noopener,noreferrer");
    } else {
      alert("Meet link is not available for this class");
    }
  };

  const getStatusBadge = (subjectKey) => {
    const timer = timers[subjectKey];
    if (!timer) return null;

    if (timer.status === "joinable") {
      return <StatusBadge $status="live">🔴 Join Now Available</StatusBadge>;
    } else if (timer.status === "upcoming") {
      return <StatusBadge $status="upcoming">⏰ Upcoming</StatusBadge>;
    }
    return null;
  };

  const renderButton = (subject) => {
    const classItem = classesData[subject.key];
    const timer = timers[subject.key];

    if (loading) {
      return (
        <DisabledButton>
          <ButtonText>Loading...</ButtonText>
          <ButtonIconWrapper>
            <HiArrowUpRight />
          </ButtonIconWrapper>
        </DisabledButton>
      );
    }

    if (!classItem) {
      return (
        <DisabledButton>
          <ButtonText>No Class Scheduled</ButtonText>
          <ButtonIconWrapper>
            <HiArrowUpRight />
          </ButtonIconWrapper>
        </DisabledButton>
      );
    }

    if (timer?.status === "joinable") {
      return (
        <>
          <JoinButton
            as="button"
            onClick={() => handleJoinClass(classItem)}
            $bgColor={subject.color}
          >
            <ButtonText>Join Now</ButtonText>
            <ButtonIconWrapper>
              <HiArrowUpRight />
            </ButtonIconWrapper>
          </JoinButton>
          <TimerText>
            <FaClock />
            Class is live!
          </TimerText>
        </>
      );
    } else if (timer?.status === "upcoming" && timer?.time) {
      return (
        <>
          <DisabledButton>
            <ButtonText>Waiting to Join</ButtonText>
            <ButtonIconWrapper>
              <HiArrowUpRight />
            </ButtonIconWrapper>
          </DisabledButton>
          <TimerText>
            <FaClock />
            Available in: {formatTimeRemaining(timer.time)}
          </TimerText>
        </>
      );
    } else {
      return (
        <DisabledButton>
          <ButtonText>Class Ended</ButtonText>
          <ButtonIconWrapper>
            <HiArrowUpRight />
          </ButtonIconWrapper>
        </DisabledButton>
      );
    }
  };

  return (
    <ThemeProvider theme={previewTheme}>
      <SectionWrapper>
        <Container>
          <SectionHeader>
            <SectionTitle>
              {title || "Master Core Subjects & Build Your Foundation"}
            </SectionTitle>
            <SectionSubtitle>
              {subtitle ||
                "Choose your path in Physics, Chemistry, or Mathematics. Our expert-led courses help you develop deep understanding and practical skills for academic and career success."}
            </SectionSubtitle>
          </SectionHeader>

          <CardsGrid>
            {subjects.map((subject) => (
              <PreviewCard
                key={subject.id}
                $gradientColor={subject.gradient}
              >
                {getStatusBadge(subject.key)}
                <IconCircle $bgColor={subject.color}>
                  <subject.icon />
                </IconCircle>
                <CardTitle>{subject.title}</CardTitle>
                <CardDescription>{subject.description}</CardDescription>
                {renderButton(subject)}
              </PreviewCard>
            ))}
          </CardsGrid>
        </Container>
      </SectionWrapper>
    </ThemeProvider>
  );
};

const CtaSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    subjects: [
      {
        title: "",
        description: "",
        icon: "",
        color: "#6366f1",
        gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/userdashboard/cta");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFormData({
          title: data.title || "",
          subtitle: data.subtitle || "",
          subjects:
            data.subjects && data.subjects.length > 0
              ? data.subjects
              : [
                  {
                    title: "",
                    description: "",
                    icon: "",
                    color: "#6366f1",
                    gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  },
                ],
        });
      }
    } catch (error) {
      console.error("Error fetching CTA data:", error);
      setMessage({
        type: "error",
        text: "Failed to load CTA section data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...formData.subjects];
    newSubjects[index][field] = value;
    setFormData((prev) => ({ ...prev, subjects: newSubjects }));
  };

  const handleAddSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          title: "",
          description: "",
          icon: "",
          color: "#6366f1",
          gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        },
      ],
    }));
  };

  const handleRemoveSubject = (index) => {
    if (formData.subjects.length > 1) {
      setFormData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.put("/api/userdashboard/cta", {
        title: formData.title,
        subtitle: formData.subtitle,
        subjects: formData.subjects.filter((s) => s.title.trim() !== ""),
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "CTA section updated successfully!",
        });
        setTimeout(() => {
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving CTA data:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save CTA data. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton onClick={() => navigate("/schoolemy/user-landing-page")}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          CTA Section Management
        </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={() => setPreviewOpen(true)}
          sx={{ textTransform: "none" }}
        >
          View
        </Button>
      </Box>

      {message.text && (
        <Alert
          severity={message.type}
          onClose={() => setMessage({ type: "", text: "" })}
          sx={{ mb: 3 }}
        >
          {message.text}
        </Alert>
      )}

      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.02)",
          borderLeft: "4px solid",
          borderColor: "primary.main",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              CTA Section Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your CTA section content including heading, subtitle, and
              subject cards shown on the user landing page.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="h4"
              color="primary.main"
              fontWeight="bold"
            >
              {formData.subjects?.filter(
                (s) => s.title && s.title.trim() !== ""
              ).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.subjects?.filter(
                (s) => s.title && s.title.trim() !== ""
              ).length === 1
                ? "Active Subject"
                : "Active Subjects"}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {formData.title ? "Header Configured" : "Header Not Set"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Section Title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                  margin="normal"
                   multiline
                   minRows={4}
                   maxRows={12}
                   InputProps={{
                     style: { overflow: "auto", resize: "vertical" },
                   }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {formData.subjects.map((subject, index) => (
          <Card key={index} sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Subject {index + 1}</Typography>
                {formData.subjects.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveSubject(index)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Subject Title"
                    value={subject.title}
                    onChange={(e) =>
                      handleSubjectChange(index, "title", e.target.value)
                    }
                    margin="normal"
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Icon (e.g., FaSpa)"
                    value={subject.icon}
                    onChange={(e) =>
                      handleSubjectChange(index, "icon", e.target.value)
                    }
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={subject.description}
                    onChange={(e) =>
                      handleSubjectChange(index, "description", e.target.value)
                    }
                    margin="normal"
                     multiline
                     minRows={4}
                     maxRows={12}
                     InputProps={{
                       style: { overflow: "auto", resize: "vertical" },
                     }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mt: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <TextField
                        fullWidth
                        label="Color (Hex)"
                        value={subject.color}
                        onChange={(e) =>
                          handleSubjectChange(index, "color", e.target.value)
                        }
                        margin="normal"
                        placeholder="#6366f1"
                      />
                      <Box
                        component="input"
                        type="color"
                        value={subject.color || "#6366f1"}
                        onChange={(e) =>
                          handleSubjectChange(index, "color", e.target.value)
                        }
                        sx={{
                          width: 60,
                          height: 60,
                          border: "2px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          cursor: "pointer",
                          padding: 0,
                          mt: 1,
                          flexShrink: 0,
                          "&::-webkit-color-swatch-wrapper": {
                            padding: 0,
                          },
                          "&::-webkit-color-swatch": {
                            border: "none",
                            borderRadius: "4px",
                          },
                        }}
                        title="Pick a color"
                      />
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: subject.color || "#6366f1",
                        border: "2px solid",
                        borderColor: "divider",
                        boxShadow: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        minHeight: 50,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "white",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          fontWeight: 500,
                        }}
                      >
                        Color Preview
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "white",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          fontFamily: "monospace",
                          backgroundColor: "rgba(0,0,0,0.2)",
                          px: 1,
                          py: 0.5,
                          borderRadius: 0.5,
                        }}
                      >
                        {subject.color || "#6366f1"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      label="Gradient CSS"
                      value={subject.gradient}
                      onChange={(e) =>
                        handleSubjectChange(index, "gradient", e.target.value)
                      }
                      margin="normal"
                      placeholder="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                      multiline
                      minRows={3}
                      maxRows={8}
                    />
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        backgroundImage:
                          subject.gradient ||
                          "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        backgroundColor: subject.gradient
                          ? "transparent"
                          : "#6366f1",
                        border: "2px solid",
                        borderColor: "divider",
                        boxShadow: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        minHeight: 50,
                        mt: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "white",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          fontWeight: 500,
                        }}
                      >
                        Gradient Preview
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "white",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          fontFamily: "monospace",
                          backgroundColor: "rgba(0,0,0,0.2)",
                          px: 1,
                          py: 0.5,
                          borderRadius: 0.5,
                          maxWidth: "60%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={subject.gradient || "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"}
                      >
                        {subject.gradient ||
                          "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddSubject}
            sx={{ mb: 2 }}
          >
            Add New Subject
          </Button>
        </Box>

        <Box
          sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/schoolemy/user-landing-page")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </form>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            overflow: "auto",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">CTA Section Preview</Typography>
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <LandingCtaPreview
            title={formData.title}
            subtitle={formData.subtitle}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CtaSection;
