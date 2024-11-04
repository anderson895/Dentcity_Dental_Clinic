import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Spin, Typography, message } from 'antd';
import { db } from '../../../db';

const { Title } = Typography;

export const ClientServicesPage = () => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  // Fetch services from Firestore
  const fetchServices = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      const servicesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Remove the first item if necessary
      servicesList.shift();
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching services: ', error);
      message.error('Failed to fetch services. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <Title level={2} className="text-center text-blue-600 mb-6">Services Offered</Title>
      {loading ? (
        <div className="flex justify-center items-center">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 24]}>
          {services.length > 0 ? (
            services.map((service) => (
              <Col key={service.id} xs={24} sm={12} md={8}>
                <Card 
                  title={service.name} 
                  bordered={true} 
                  className="shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <p><strong>Name:</strong> {service.serviceName}</p>
                  <p><strong>Price:</strong> ₱{service.price}</p>
                </Card>
              </Col>
            ))
          ) : (
            <div className="text-center w-full">
              <p>No services available at the moment.</p>
            </div>
          )}
        </Row>
      )}
    </div>
  );
};

export default ClientServicesPage;
