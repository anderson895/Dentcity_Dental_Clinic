/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { Form, Input, Button, Table, Modal, Select, notification } from 'antd';
import { addDoc, collection, doc, updateDoc, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import { db } from '../../../db';
import { useNavigate } from 'react-router-dom';

export const PatientRecords = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm();
  const [patients, setPatients] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [loading, setLoading] = useState(false); 
  const openNotification = (type, message, description) => {
    notification[type]({
      message,
      description,
      placement: 'topRight',
    });
  };
  const handleAddOrUpdatePatient = async (values) => {
    setLoading(true); // Set loading to true when adding/updating
    try {
      if (isEditing && editingPatient) {
        // Update existing patient
        await updateDoc(doc(db, 'patients', editingPatient.id), {
          lastName: values.lastName,
          firstName: values.firstName,
          gender: values.gender,
          age: values.age,
          contactNumber: values.contactNumber,
          address: values.address,
        });
        openNotification('success', 'Success', 'Patient record updated successfully!');
      } else {
        // Add new patient
        await addDoc(collection(db, 'patients'), {
          lastName: values.lastName,
          firstName: values.firstName,
          gender: values.gender,
          age: values.age,
          contactNumber: values.contactNumber,
          dateAdded: dayjs().format('YYYY-MM-DD'), // Current date
          address: values.address,
        });
        openNotification('success', 'Success', 'Patient record added successfully!');
      }
      form.resetFields();
      setIsModalVisible(false);
      fetchPatients(); // Refresh patient list after adding/updating
    } catch (error) {
      console.error('Error saving document: ', error);
      openNotification('error', 'Error', 'Failed to save patient record.');
    } finally {
      setLoading(false); // Stop loading after operation
    }
  };
  const fetchPatients = async () => {
    setLoading(true); // Set loading to true while fetching data
    try {
      const querySnapshot = await getDocs(collection(db, 'patients'));
      const patientList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      patientList.shift()
      setPatients(patientList.map((v,id) =>({...v,key:id+1})));
    } catch (error) {
      console.error('Error fetching patient records: ', error);
      openNotification('error', 'Error', 'Failed to fetch patient records.');
    } finally {
      setLoading(false); // Stop loading after fetching data
    }
  };
  useEffect(() => {
    fetchPatients();
  }, []);

  const navigateToPatientDetails = (patientId) => {
    navigate(`/Dashboard/Record/patients/${patientId}`);
  };
  const columns = [
    { title: 'No.', dataIndex: 'key', key: 'key', align: 'center' }, // Row number column
    { title: 'Last Name', dataIndex: 'lastName', key: 'lastName' },
    { title: 'First Name', dataIndex: 'firstName', key: 'firstName' },
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    { title: 'Age', dataIndex: 'age', key: 'age' },
    { title: 'Contact Number', dataIndex: 'contactNumber', key: 'contactNumber' },
    { title: 'Date Added', dataIndex: 'dateAdded', key: 'dateAdded' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    {
      title: 'Actions',
      render: (text, record) => (
        <div className='space-x-4'>
        <Button type="primary" onClick={() => handleEditPatient(record)}>
          Edit
        </Button>
        <Button type="default" onClick={() => navigateToPatientDetails(record.id)}>
          View
        </Button>
      </div>
      ),
    },
  ];
  const handleEditPatient = (record) => {
    setIsEditing(true);
    setEditingPatient(record);
    setIsModalVisible(true);
    form.setFieldsValue({
      ...record,
      dateAdded: dayjs(record.dateAdded),
    });
  };
  const handleAddPatient = () => {
    setIsEditing(false);
    setEditingPatient(null);
    setIsModalVisible(true);
    form.resetFields();
  };
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };
  if(loading){
    return <div className=" w-full min-h-[700px] flex justify-center items-center"><p className="loader" /></div>
  }
  return (
    <div className="p-6 mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Patient Records</h2>
        <Button type="primary" onClick={handleAddPatient}>
          Add Patient
        </Button>
      </div>
        <Table
          dataSource={patients}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          className="bg-white shadow-md rounded-md custom-table"
        />
      <Modal
        title={isEditing ? 'Edit Patient Record' : 'Add Patient Record'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddOrUpdatePatient}
        >
          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: 'Please enter last name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: 'Please enter first name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Gender"
            name="gender"
            rules={[{ required: true, message: 'Please select gender' }]}
          >
            <Select>
              <Select.Option value="Male">Male</Select.Option>
              <Select.Option value="Female">Female</Select.Option>
              <Select.Option value="Others">Others</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Age"
            name="age"
            rules={[{ required: true, message: 'Please enter age' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Contact Number"
            name="contactNumber"
            rules={[{ required: true, message: 'Please enter contact number' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditing ? 'Update Patient' : 'Add Patient'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
