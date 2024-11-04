import React, { useState } from 'react';
import { Button, Form, Input, message, Modal } from 'antd';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../db';
import { useNavigate } from 'react-router-dom';
import { RouterUrl } from '../../../routes';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { doc, getDoc } from 'firebase/firestore';
import { saveUserInfo } from '../../../zustand/store/store.provider';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleForgotPassword = async () => {
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      message.success('Password reset email sent!');
      setIsForgotPasswordModalVisible(false);
    } catch (error: any) {
      message.error(error.message || 'Failed to send password reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const showForgotPasswordModal = () => {
    setIsForgotPasswordModalVisible(true);
  };

  const handleCancelForgotPassword = () => {
    setIsForgotPasswordModalVisible(false);
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    console.log('Login values:', values); // Log for debugging
    setLoading(true);
    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log(userCredential)
      const userId = userCredential.user.uid;
      console.log(userId)
      // Fetch user data from Firestore to check user type
      const userDoc = await getDoc(doc(db, 'patients', userId));
      const userData = userDoc.data();
      if (userDoc.exists() && userData?.type === 'client') {
        if (userData.type === 'client') {
          const payload = {
            ...userData,
            id:userId
          }
          saveUserInfo(payload)
          message.success('Login successful! Redirecting to homepage...');
          navigate(RouterUrl.ClientHome); 
        } else {
          message.success('Login successful!');
          navigate(RouterUrl.Dashboard); // Or any other route for different user types
        }
      } else {
        if(userId){
          message.success('Login successful!');
          navigate(RouterUrl.Dashboard); // Or any other route for different user types
        }
      }
      
    } catch (error: any) {
      message.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-2 md:p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-4xl md:text-8xl font-bold text-center text-sky-600">Dentcity</h1>
        <p className='w-full text-center mb-6 font-semibold text-red-400'>Dental Clinic</p>
        <Form
          layout="vertical"
          onFinish={handleLogin}
          className="space-y-4 z-50"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please input your email!' }]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>
          <div className="text-right mt-4">
            <Button type="link" className="p-0" onClick={showForgotPasswordModal}>
              Forgot password?
            </Button>
          </div>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            className="bg-blue-500 hover:bg-blue-600"
          >
            Login
          </Button>
        </Form>
        <div className="text-center mt-4">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
      <Modal
        title="Reset Password"
        open={isForgotPasswordModalVisible}
        onOk={handleForgotPassword}
        onCancel={handleCancelForgotPassword}
        okButtonProps={{ loading: resetLoading }}
      >
        <Form.Item
          label="Email"
          rules={[{ required: true, message: 'Please input your email!' }]}
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
        </Form.Item>
      </Modal>
    </div>
  );
};
