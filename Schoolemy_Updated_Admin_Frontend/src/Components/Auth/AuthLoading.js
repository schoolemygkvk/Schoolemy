import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const AuthLoading = () => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <Spin indicator={antIcon} size="large" />
      <p style={{ marginTop: "16px", color: "#666" }}>
        Checking authentication...
      </p>
    </div>
  );
};

export default AuthLoading;
