// BUG 2.8.1 FIX: Enrollment badge component to show enrollment status
import React, { useState } from "react";
import styled from "styled-components";
import { FaCheckCircle } from "react-icons/fa";

const BadgeContainer = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  z-index: 8;
  animation: ${props => props.show ? "slideIn" : "none"} 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  svg {
    font-size: 0.9rem;
  }

  &:hover {
    box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
    transform: translateY(-2px);
  }
`;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;

  &:hover .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(-8px);
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateY(0) translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  margin-bottom: 8px;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 20;

  &:after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }

  @media (max-width: 768px) {
    position: fixed;
    bottom: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    white-space: normal;
    max-width: 120px;
  }
`;

const EnrollmentBadge = ({ isEnrolled, enrolledDate }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isEnrolled) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Enrolled";
    const date = new Date(dateString);
    return `Enrolled ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  return (
    <TooltipContainer
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <BadgeContainer show={true}>
        <FaCheckCircle />
        ENROLLED
      </BadgeContainer>
      <Tooltip className="tooltip">
        {formatDate(enrolledDate)}
      </Tooltip>
    </TooltipContainer>
  );
};

export default EnrollmentBadge;
