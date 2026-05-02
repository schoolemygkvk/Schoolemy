import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import api from "../service/api";
import {
  FiSend,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiMail,
  FiArrowLeft,
} from "react-icons/fi";

const Complaints = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "Other",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  const categories = [
    { value: "Technical", label: "Technical Issue" },
    { value: "Billing", label: "Billing & Payment" },
    { value: "Course Content", label: "Course Content" },
    { value: "Account", label: "Account & Profile" },
    { value: "Other", label: "Other" },
  ];

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/complaints/");
      if (response.data.success) {
        setComplaints(response.data.complaints);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      setMessage({
        type: "error",
        text: "Failed to load complaints. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.post("/api/v1/complaints/", formData);

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Complaint submitted successfully!",
        });
        setFormData({
          subject: "",
          description: "",
          category: "Other",
        });
        // Refresh complaints list
        fetchComplaints();
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to submit complaint. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return <FiCheckCircle style={{ color: "#10B981" }} />;
      case "pending":
        return <FiClock style={{ color: "#F59E0B" }} />;
      default:
        return <FiAlertCircle style={{ color: "#6B7280" }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  return (
    <Container>
      <Header>
        <BackButtonContainer>
          <BackButton onClick={() => navigate("/dashboard")}>
            <FiArrowLeft />
            Back to Dashboard
          </BackButton>
        </BackButtonContainer>
        <Title>
          <FiMessageSquare />
          Complaints & Support
        </Title>
        <Subtitle>Submit your complaints and track their status</Subtitle>
      </Header>

      <Content>
        <FormSection>
          <FormCard>
            <FormTitle>Submit New Complaint</FormTitle>

            {message.text && (
              <Message type={message.type}>{message.text}</Message>
            )}

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief description of your complaint"
                  maxLength="200"
                  required
                />
                <CharCount>{formData.subject.length}/200</CharCount>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="category">Category</Label>
                <Select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Please provide detailed information about your complaint..."
                  maxLength="1000"
                  rows="6"
                  required
                />
                <CharCount>{formData.description.length}/1000</CharCount>
              </FormGroup>

              <UserInfo>
                <InfoItem>
                  <FiUser />
                  <span>{userData?.username || "User"}</span>
                </InfoItem>
                <InfoItem>
                  <FiMail />
                  <span>{userData?.email || "email@example.com"}</span>
                </InfoItem>
              </UserInfo>

              <SubmitButton type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <FiClock className="spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Submit Complaint
                  </>
                )}
              </SubmitButton>
            </Form>
          </FormCard>
        </FormSection>

        <ComplaintsSection>
          <SectionTitle>Your Complaints</SectionTitle>

          {loading ? (
            <LoadingSpinner>
              <FiClock className="spin" />
              Loading complaints...
            </LoadingSpinner>
          ) : complaints.length === 0 ? (
            <EmptyState>
              <FiMessageSquare />
              <p>No complaints submitted yet</p>
            </EmptyState>
          ) : (
            <ComplaintsList>
              {complaints.map((complaint) => (
                <ComplaintCard key={complaint._id}>
                  <ComplaintHeader>
                    <ComplaintSubject>{complaint.subject}</ComplaintSubject>
                    <StatusBadge color={getStatusColor(complaint.status)}>
                      {getStatusIcon(complaint.status)}
                      {complaint.status.charAt(0).toUpperCase() +
                        complaint.status.slice(1)}
                    </StatusBadge>
                  </ComplaintHeader>

                  <ComplaintMeta>
                    <MetaItem>
                      <strong>Reg No:</strong> {complaint.regNo || "N/A"}
                    </MetaItem>
                    <MetaItem>
                      <strong>Category:</strong> {complaint.category}
                    </MetaItem>
                    <MetaItem>
                      <strong>Submitted:</strong>{" "}
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </MetaItem>
                  </ComplaintMeta>

                  <ComplaintDescription>
                    {complaint.description}
                  </ComplaintDescription>

                  {complaint.adminResponse && (
                    <AdminResponse>
                      <ResponseHeader>
                        <FiCheckCircle />
                        Admin Response
                      </ResponseHeader>
                      <ResponseText>{complaint.adminResponse}</ResponseText>
                      {complaint.resolvedAt && (
                        <ResolvedDate>
                          Resolved on{" "}
                          {new Date(complaint.resolvedAt).toLocaleDateString()}
                        </ResolvedDate>
                      )}
                    </AdminResponse>
                  )}
                </ComplaintCard>
              ))}
            </ComplaintsList>
          )}
        </ComplaintsSection>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
  font-family: "Inter", sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const BackButtonContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #f0f9ff;
  color: #0284c7;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #0284c7;
    color: white;
    transform: translateX(-4px);
  }

  svg {
    font-size: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  svg {
    color: #3b82f6;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FormSection = styled.div``;

const FormCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
`;

const Message = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 500;

  ${({ type }) =>
    type === "success"
      ? `
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  `
      : `
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  `}
`;

const Form = styled.form``;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const CharCount = styled.div`
  text-align: right;
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const UserInfo = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
  font-size: 0.9rem;

  svg {
    color: #6b7280;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ComplaintsSection = styled.div``;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  .spin {
    font-size: 2rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;

  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    font-size: 1.1rem;
    margin: 0;
  }
`;

const ComplaintsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ComplaintCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
`;

const ComplaintHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ComplaintSubject = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
  margin-right: 1rem;
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  background: ${({ color }) => color};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ComplaintMeta = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #6b7280;
`;

const MetaItem = styled.div``;

const ComplaintDescription = styled.p`
  color: #374151;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const AdminResponse = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const ResponseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #166534;
  margin-bottom: 0.5rem;

  svg {
    color: #16a34a;
  }
`;

const ResponseText = styled.p`
  color: #166534;
  margin: 0;
  line-height: 1.5;
`;

const ResolvedDate = styled.div`
  font-size: 0.8rem;
  color: #16a34a;
  margin-top: 0.5rem;
  font-weight: 500;
`;

export default Complaints;
