import {
  Avatar,
  Badge,
  Button,
  Form,
  Input,
  Layout,
  Menu,
  message,
  Modal,
  Popover,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { BsClipboard2Data } from "react-icons/bs";
import { Outlet, useNavigate } from "react-router-dom";
import { RouterUrl } from "../routes";
import { IoHomeOutline, IoNotificationsSharp } from "react-icons/io5";
import { useState, useEffect } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../db";
import { BiCalendarEvent } from "react-icons/bi";
import { RiServiceFill } from "react-icons/ri";
import { HiDocumentReport } from "react-icons/hi";
import { collection, onSnapshot, doc, writeBatch } from "firebase/firestore";

const { Sider, Content } = Layout;

export default function AdminSide() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [collapsed, setCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const user = auth.currentUser;

  const siderStyle = {
    textAlign: "center",
    lineHeight: "120px",
    color: "#fff",
    backgroundColor: "white",
    borderRight: "2px solid #E8E8E8",
  };

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      if (values.currentPassword && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          values.currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      }

      if (user.displayName !== values.displayName) {
        await updateProfile(user, { displayName: values.displayName });
      }

      if (user.email !== values.email) {
        await updateEmail(user, values.email);
      }

      if (values.newPassword) {
        await updatePassword(user, values.newPassword);
      }

      message.success("Updated Successfully");
      form.resetFields();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      const errorMessages = {
        "auth/wrong-password": "The current password is incorrect.",
        "auth/weak-password": "The new password is too weak.",
        "auth/email-already-in-use": "The email address is already in use.",
        "auth/invalid-email": "The email address is invalid.",
      };
      message.error(errorMessages[error.code] || "Failed to update information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      notificationsList.shift()
      notificationsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(notificationsList);
    });

    return () => unsubscribe();
  }, []);

  // Clear all notifications
  const handleClearNotifications = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.delete(notificationRef);
      });
      await batch.commit();
      message.success("Notifications cleared successfully.");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      message.error("Failed to clear notifications.");
    }
  };

  return (
    <Layout className="min-h-screen w-full">
      <Sider width={'max-content'} breakpoint="lg" style={siderStyle} trigger={null} collapsed={collapsed}>
        <div className="h-40 flex flex-col justify-center items-center p-4 md:p-0">
          <h1 className={`${collapsed ? 'text-xl text-wrap' : 'text-6xl'} font-bold text-sky-600`}>Dentcity</h1>
          <p className={`${collapsed ? 'text-md text-wrap' : 'text-xl'} font-semibold text-xl text-red-400`}>Dental Clinic</p>
        </div>
        <Menu
          style={{ background: "white", color: "black" }}
          className="custom-menu"
          mode="inline"
          onClick={handleMenuClick}
          items={[
            {
              label: "Home",
              key: RouterUrl.Dashboard,
              icon:<IoHomeOutline size={30}  />
            },
            {
              label: "Appointment",
              key: RouterUrl.Appointments,
              icon: <BiCalendarEvent size={30} />
            },
            {
              label: "Records",
              key: RouterUrl.Record,
              icon:<BsClipboard2Data size={30} />
            },
            {
              label: "Services",
              key: RouterUrl.Services,
              icon:<RiServiceFill size={30} />
            },
            {
              label: "Reports",
              key: RouterUrl.Reports,
              icon:<HiDocumentReport size={30} />
            },
          ]}
        />
      </Sider>
      <Layout className="w-full">
        <Content style={{ background: "#A2DCF3" }} className="p-2 h-max">
          <div className="flex justify-between flex-col md:flex-row items-center mb-12">
            <div className="flex gap-2 flex-col md:flex-row items-start md:items-center">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                }}
              />
              <h1 className="text-xl font-bold tracking-widest">
                Welcome Administrator!
              </h1>
            </div>
            <div className="flex gap-4 items-center">
            <div className="relative pt-2">
              <Popover
                content={
                  <div className="w-80 p-2">
                    <h3 className="font-bold">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p>No new notifications</p>
                    ) : (
                      <>
                        {notifications.map(notification => (
                          <div key={notification.id} className="border-b py-2">
                            <p>{notification.message}</p>
                            <small>{new Date(notification.createdAt).toLocaleString()}</small>
                          </div>
                        ))}
                        <Button
                          type="primary"
                          onClick={handleClearNotifications}
                          className="mt-2 w-full"
                        >
                          Clear Notifications
                        </Button>
                      </>
                    )}
                  </div>
                }
                trigger="click"
              >
                <Badge count={notifications.length}>
                  <IoNotificationsSharp size={30} color="white" className="cursor-pointer" />
                </Badge>
              </Popover>
            </div>
              <Popover
                placement="bottomRight"
                content={(
                  <div className="w-32 p-0">
                    <p
                      className="hover:bg-[#4e38f5] hover:text-white cursor-pointer p-2 rounded-md"
                      onClick={() => setIsOpen(true)}
                    >
                      Profile
                    </p>
                    <p
                      className="hover:bg-[#4e38f5] hover:text-white cursor-pointer p-2 rounded-md"
                      onClick={() => navigate(RouterUrl.Login)}
                    >
                      Logout
                    </p>
                  </div>
                )}
              >
                <Avatar size={40} className="cursor-pointer" />
              </Popover>
            </div>
          </div>
          <div>
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Modal
        title="Update your Information"
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
      >
        <Form
          onFinish={handleSubmit}
          layout="vertical"
          form={form}
          initialValues={{
            email: user?.email,
            displayName: user?.displayName,
          }}
        >
          <Form.Item name="displayName" label="Username">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="currentPassword" label="Current Password">
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="New Password">
            <Input.Password />
          </Form.Item>

          <div className="flex justify-end gap-4">
            <Button type="default" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save changes
            </Button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
}
