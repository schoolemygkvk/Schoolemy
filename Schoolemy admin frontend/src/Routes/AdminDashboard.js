import React, { useState } from "react";
import { Layout } from "antd";
import { useLocation } from "react-router-dom";

import LayoutHeaderSidebar from "../Components/Dashboard/LayoutHeaderSidebar";
import Pages from "./PageRoutes";
import DashboardFooter from "../Components/Dashboard/DashboardFooter";

const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

    // Only show footer on main course page
  const showFooter = location.pathname === "/schoolemy";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <LayoutHeaderSidebar collapsed={collapsed} setCollapsed={setCollapsed}>
        <Layout.Content>
          <Pages />
        </Layout.Content>
        {showFooter && <DashboardFooter />}
      </LayoutHeaderSidebar>
    </Layout>
  );
};

export default AdminDashboard;