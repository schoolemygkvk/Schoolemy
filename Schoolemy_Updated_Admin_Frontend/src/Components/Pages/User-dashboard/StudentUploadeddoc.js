import React from 'react';
import { Alert, Typography, Space, Button } from 'antd';
import { ToolOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const StudentUploadedDoc = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      minHeight: '50vh',
      position: 'relative'
    }}>
      <Button 
        type="primary" 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack}
        style={{ 
          position: 'absolute',
          left: '2rem',
          top: '2rem'
        }}
      >
        Back
      </Button>
      <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 600 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Student Uploaded Documents</Title>
        <Alert
          message="Under Development"
          description="This page is currently under development. New features and updates coming soon!"
          type="info"
          showIcon
          icon={<ToolOutlined />}
          style={{ fontSize: '16px' }}
        />
      </Space>
    </div>
  );
};

export default StudentUploadedDoc;
