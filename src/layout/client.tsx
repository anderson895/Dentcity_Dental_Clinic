import React, { CSSProperties } from 'react';
import { Layout, Menu, theme, notification } from 'antd';
import { Outlet, To, useLocation, useNavigate } from 'react-router-dom';
import { RouterUrl } from '../routes';
import { MdDashboard } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { useMediaQuery } from 'react-responsive';
import { RiServiceFill } from "react-icons/ri";
import { CiLogout } from "react-icons/ci";
import { auth } from '../db'; // Import Firebase auth
import { signOut } from 'firebase/auth'; // Import signOut from Firebase
import { logoutUser } from '../zustand/store/store.provider';

const { Header, Content, Sider } = Layout;

const items = [
  { key: RouterUrl.ClientHome, icon: <MdDashboard />, label: 'Dashboard' },
  { key: RouterUrl.ClientAppoint, icon: <FaCalendarAlt />, label: 'Appointments' },
  { key: RouterUrl.ClientService, icon: <RiServiceFill />, label: 'Services' },
  { key: 'logout', icon: <CiLogout />, label: 'Logout' }, // Use a string key for logout
];

export default function ClientSide() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const location = useLocation();
  const navigate = useNavigate(); // Hook to navigate
  const currentKey = location.pathname; // Get current URL path

  const handleMenuClick = async (e: { key: To; }) => {
    if (e.key === 'logout') {
      try {
        await signOut(auth); // Sign out the user
        logoutUser()
        notification.success({
          message: 'Logout Successful',
          description: 'You have been logged out.',
        });
        navigate(RouterUrl.Login); // Redirect to the login page
      } catch (error) {
        notification.error({
          message: 'Logout Error',
          description: 'Failed to log out. Please try again.',
        });
      }
    } else {
      navigate(e.key); // Navigate to the selected key
    }
  };

  const siderStyle: CSSProperties = {
    minHeight: '100vh',
    zIndex: '999',
    position: isMobile ? 'fixed' : 'relative', // Use fixed positioning on mobile
  };

  return (
    <Layout className='min-h-screen client'>
      <Sider
        className='client'
        style={siderStyle}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          className='client'
          mode="inline"
          selectedKeys={[currentKey]}
          items={items}
          onClick={handleMenuClick} // Attach click handler
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div className='flex flex-col'>
            <h1 className="text-4xl font-bold text-center flex flex-col text-sky-600">
              Dentcity
              <span className='text-center font-semibold text-sm text-red-400'>Dental Clinic</span>
            </h1>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
