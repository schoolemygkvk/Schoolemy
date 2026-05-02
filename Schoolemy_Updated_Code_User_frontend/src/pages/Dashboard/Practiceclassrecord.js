// File: user-frontend/pages/MyMaterials.js

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import api from "../../service/api"; // Use centralized API instance
import { FaFilePdf, FaBookOpen, FaDownload } from "react-icons/fa";

// --- Professional Styling ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
`;

const Header = styled.div`
  margin-bottom: 2.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
`;

const Title = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MaterialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const MaterialCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.07);
  border: 1px solid #e9ecef;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  animation: ${fadeIn} 0.5s ease-out forwards;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const PdfIcon = styled(FaFilePdf)`
  font-size: 2.5rem;
  color: #dc3545; // PDF Red
`;

const MaterialInfo = styled.div``;

const MaterialName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #343a40;
  margin: 0;
  line-height: 1.4;
`;

const CourseName = styled.p`
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0.25rem 0 0 0;
`;

const DownloadButton = styled.a`
  margin-top: auto; // Pushes the button to the bottom
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background-color: #007bff;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }
`;

const StatusText = styled.div`
  text-align: center;
  padding: 4rem;
  font-size: 1.2rem;
  color: #6c757d;
`;

// --- Component ---
const MyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        // USER BACKEND PORT (8000) - Data-va kekkura edam
        const { data } = await api.get("/api/v1/materials/");

        setMaterials(data);
      } catch (error) {
        console.error("Failed to fetch materials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  if (loading) return <StatusText>Loading your materials...</StatusText>;

  return (
    <PageContainer>
      <Header>
        <Title>
          <FaBookOpen /> My Study Materials
        </Title>
      </Header>

      {materials.length === 0 ? (
        <StatusText>You have not received any materials yet.</StatusText>
      ) : (
        <MaterialGrid>
          {materials.map((material) => (
            <MaterialCard key={material._id}>
              <CardHeader>
                <PdfIcon />
                <MaterialInfo>
                  <MaterialName>{material.materialName}</MaterialName>
                  <CourseName>{material.courseName}</CourseName>
                </MaterialInfo>
              </CardHeader>
              <DownloadButton
                // ADMIN BACKEND PORT (5000) - File-a serve panra edam
                href={`${process.env.REACT_APP_ADMIN_API_URL || "http://localhost:8000"}${material.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                download // Idhu file-a open panradhukku badhila download panna sollum
              >
                <FaDownload /> Download
              </DownloadButton>
            </MaterialCard>
          ))}
        </MaterialGrid>
      )}
    </PageContainer>
  );
};

// Unga file peru 'practice class.js'-a irundha kooda, component per-a 'MyMaterials' nu vechukonga
export default MyMaterials;
