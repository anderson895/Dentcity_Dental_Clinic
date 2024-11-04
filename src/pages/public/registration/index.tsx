import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Select, Row, Col } from 'antd';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../db';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export const RegistrationPage = () => {
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false);

    const onFinish = async (values:any) => {
        setLoading(true);
        const { email, password, firstName, lastName, age, address, gender, contactNumber } = values;

        try {
            // Create user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Add user data to Firestore
            await setDoc(doc(db, 'patients', user.uid), {
                firstName,
                lastName,
                age,
                address,
                gender,
                contactNumber,
                email,
                dateAdded: dayjs().format('YYYY-MM-DD'), 
                type:'client'
            });

            message.success('Registration successful!');
            form.resetFields()
            navigate('/')
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-full max-w-4xl">
                <Title level={2} className="text-center mb-6">Register</Title>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                label="First Name" 
                                name="firstName" 
                                rules={[{ required: true, message: 'Please enter your first name!' }]}
                            >
                                <Input placeholder="Enter your first name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Last Name" 
                                name="lastName" 
                                rules={[{ required: true, message: 'Please enter your last name!' }]}
                            >
                                <Input placeholder="Enter your last name" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                label="Age" 
                                name="age" 
                                rules={[{ required: true, message: 'Please enter your age!' }]}
                            >
                                <Input type="number" placeholder="Enter your age" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Address" 
                                name="address" 
                                rules={[{ required: true, message: 'Please enter your address!' }]}
                            >
                                <Input placeholder="Enter your address" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                label="Gender" 
                                name="gender" 
                                rules={[{ required: true, message: 'Please select your gender!' }]}
                            >
                                <Select placeholder="Select your gender">
                                    <Option value="male">Male</Option>
                                    <Option value="female">Female</Option>
                                    <Option value="other">Other</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Contact Number" 
                                name="contactNumber" 
                                rules={[{ required: true, message: 'Please enter your contact number!' }]}
                            >
                                <Input placeholder="Enter your contact number" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                label="Email" 
                                name="email" 
                                rules={[{ required: true, type: 'email', message: 'Please enter a valid email!' }]}
                            >
                                <Input placeholder="Enter your email" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Password" 
                                name="password" 
                                rules={[{ required: true, message: 'Please enter your password!' }]}
                            >
                                <Input.Password placeholder="Enter your password" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} className="w-full">
                            Register
                        </Button>
                    </Form.Item>
                </Form>
                <div className="text-center">
                    <p className="text-gray-500">Already have an account? <Link to="/" className="text-blue-600">Login here</Link></p>
                </div>
            </div>
        </div>
    );
};
