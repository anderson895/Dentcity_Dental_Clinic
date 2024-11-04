/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { Form, Input, Button, Table, Modal, notification } from 'antd';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../../db';

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Function to display notifications
  const openNotification = (type, message, description) => {
    notification[type]({
      message,
      description,
      placement: 'topRight',
    });
  };

  // Fetch services from Firestore
  const fetchServices = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      const servicesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      servicesList?.shift()
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching services: ', error);
      openNotification('error', 'Error', 'Failed to fetch services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle adding or updating service
  const handleAddOrUpdateService = async (values) => {
    setLoading(true);
    try {


      if (isEditing && editingService) {
        // Update service
        await updateDoc(doc(db, 'services', editingService.id), {
          serviceName: values.serviceName,
          price: values.price,
        });
        openNotification('success', 'Success', 'Service updated successfully!');
      } else {
        // Add new service
        await addDoc(collection(db, 'services'), {
          serviceName: values.serviceName,
          price: values.price,
        });
        openNotification('success', 'Success', 'Service added successfully!');
      }
      form.resetFields();
      setIsModalVisible(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service: ', error);
      openNotification('error', 'Error', 'Failed to save service.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete service
  const handleDeleteService = async (id) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'services', id));
      openNotification('success', 'Success', 'Service deleted successfully!');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service: ', error);
      openNotification('error', 'Error', 'Failed to delete service.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEditService = (record) => {
    setIsEditing(true);
    setEditingService(record);
    setIsModalVisible(true);
    form.setFieldsValue(record);

  };

  // Handle add service button click
  const handleAddService = () => {
    setIsEditing(false);
    setEditingService(null);
    setIsModalVisible(true);
    form.resetFields(); 
  };

  // Handle modal close
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Columns for the Ant Design Table
  const columns = [
    { title: 'Service Name', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'Price', dataIndex: 'price', key: 'price' },
    {
      title: 'Service Logo',
      dataIndex: 'serviceLogo',
      render: (text) => <img src={text} alt="Service Logo" style={{ width: '50px', height: '50px', borderRadius: '4px' }} />,
    },
    {
      title: 'Actions',
      render: (text, record) => (
        <div>
          <Button type="link" onClick={() => handleEditService(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDeleteService(record.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className=" w-full min-h-[700px] flex justify-center items-center"><p className="loader" /></div>;
  }

  return (
    <div className="p-6 mx-auto">
      {/* Table to display services */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Services</h2>
        <Button type="primary" onClick={handleAddService}>
          Add Service
        </Button>
      </div>
      <Table
        dataSource={services}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        className="bg-white shadow-md rounded-md custom-table w-full"
      />

      {/* Modal for adding or editing a service */}
      <Modal
        title={isEditing ? 'Edit Service' : 'Add Service'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddOrUpdateService}
        >
          <Form.Item
            label="Service Name"
            name="serviceName"
            rules={[{ required: true, message: 'Please enter service name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditing ? 'Update Service' : 'Add Service'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
