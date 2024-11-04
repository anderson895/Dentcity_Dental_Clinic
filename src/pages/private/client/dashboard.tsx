import React from 'react';
import { Card, Col, Row, Typography } from 'antd';
import useStore from '../../../zustand/store/store';
import { selector } from '../../../zustand/store/store.provider';

const { Title, Text } = Typography;

export const ClientDashboard = () => {
  const client = useStore(selector('user'));

  return (
    <div className="min-h-screen p-6 ">
      <Title level={2} className="text-center text-blue-600">Welcome, {client.info?.firstName}!</Title>
      <Text className="text-center text-lg mb-6">Here’s an overview of your account:</Text>

      <Row gutter={[16, 24]}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Account Information" bordered={true} className="shadow-md">
            <p><strong>Name:</strong> {client.info?.firstName} {client.info?.lastName}</p>
            <p><strong>Email:</strong> {client.info?.email}</p>
            <p><strong>Contact Number:</strong> {client.info?.contactNumber}</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card title="Account Details" bordered={true} className="shadow-md">
            <p><strong>Age:</strong> {client.info?.age}</p>
            <p><strong>Address:</strong> {client.info?.address}</p>
            <p><strong>Gender:</strong> {client.info?.gender}</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card title="Account Status" bordered={true} className="shadow-md">
            <p><strong>Account Type:</strong> Client</p>
            <p><strong>Status:</strong> {client.info?.isVerified ? 'Verified' : 'Not Verified'}</p>
            <p><strong>Date Created:</strong> {client.info?.dateAdded}</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClientDashboard;
