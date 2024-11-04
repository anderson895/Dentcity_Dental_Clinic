/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Input, Button, Table, Modal, notification, TimePicker, Select, Descriptions, Tag } from 'antd';
import { getDoc, doc, collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../db';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';
import moment from 'moment';
import { format } from 'date-fns';

const localizer = momentLocalizer(moment);

export const PatientDetails = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [isAppointing, setIsAppointing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const openNotification = (type, message, description) => {
    notification[type]({
      message,
      description,
      placement: 'topRight',
    });
  };

  const fetchPatientDetails = async () => {
    setLoading(true);
    try {
      const patientDoc = await getDoc(doc(db, 'patients', id));
      setPatient({ id: patientDoc.id, ...patientDoc.data() });

      const querySnapshot = await getDocs(collection(db, 'appointments'));
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      list.shift()
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAppointments(list);

      const serviceSnapshot = await getDocs(collection(db, 'services'));
      const servicesList = serviceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      servicesList.shift()
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching data: ', error);
      openNotification('error', 'Error', 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(format(start, 'yyyy-MM-dd'));
    setIsAppointing(false);
    setIsConfirming(true);
  };

  const handleSaveAppointment = async (values) => {
    setLoading(true);
    try {
      const { time, location, service } = values;
      const [startTime, endTime] = time;
      const startTimeFormatted = dayjs(startTime, 'HH:mm');
      const endTimeFormatted = dayjs(endTime, 'HH:mm');
      const overlappingAppointment = appointments.find(appt => 
        appt.date === selectedDate &&
        (
          (dayjs(appt.startTime, 'h:mm A').isBefore(endTimeFormatted) &&
           dayjs(appt.endTime, 'h:mm A').isAfter(startTimeFormatted))
        )
      );
      if (overlappingAppointment) {
        notification.error({
          message: 'Time Conflict',
          description: 'Another appointment is already scheduled during this time range. Please select a different time.',
        });
        setLoading(false);
        return;
      }
      await addDoc(collection(db, 'appointments'), {
        patientId:id,
        date: selectedDate,
        startTime: startTimeFormatted.format('h:mm A'),
        endTime: endTimeFormatted.format('h:mm A'),
        location,
        service,
        createdAt: dayjs().format(),
        status: 'Pending'
      });
  
      notification.success({
        message: 'Success',
        description: 'Appointment added successfully!',
      });
      setIsConfirming(false);
      fetchPatientDetails(); 
    } catch (error) {
      console.error('Error saving appointment:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to save appointment.',
      });
    } finally {
      setLoading(false);
    }
  };

  const events = appointments.map(appt => ({
    title: `${appt.startTime} - ${appt.endTime} (${appt.service})`,
    start: moment(appt.date).toDate(),
    end: moment(appt.date).toDate(),
    allDay: false
  }));

  if(loading){
    return <div className=" w-full min-h-[700px] flex justify-center items-center"><p className="loader" /></div>
  }
  return (
    <div className="p-6 mx-auto">
        <div>
          <div className='flex justify-between items-center mb-4'>
            <h1 className='text-4xl font-bold'>Patient Records</h1>
            <Button type="primary" onClick={() => setIsAppointing(true)}>
              Appoint Patient
            </Button>
          </div>
          <div className='flex flex-nowrap gap-4 w-full my-4'>
            <div className='bg-white p-8 rounded-lg text-xl flex-1'>
              <p><strong className='text-sky-600'>Patient Name</strong> {patient?.firstName} {patient?.lastName}</p>
            </div>
            <div className='bg-white p-8 rounded-lg text-xl w-max'>
              <p><strong className='text-sky-600'>Id</strong> {patient?.id}</p>
            </div>
          </div>
          <div className='flex gap-8 flex-nowrap'>
            {patient && (
              <div className="mb-4 w-[400px]">
                <Descriptions column={1} title={<h1 className='bg-sky-600 p-4 absolute w-full top-0 left-0 text-center text-xl text-white'>Details</h1>} style={{borderRadius:'10px 10px 0px 0px',overflow:'hidden',position:'relative',padding:'8px 24px',background:'white',paddingBottom:'20px'}} className='shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]' layout='vertical'>
                  <Descriptions.Item label="Last Name">{patient.lastName}</Descriptions.Item>
                  <Descriptions.Item label="First Name">{patient.firstName}</Descriptions.Item>
                  <Descriptions.Item label="Gender">{patient.gender}</Descriptions.Item>
                  <Descriptions.Item label="Age">{patient.age}</Descriptions.Item>
                  <Descriptions.Item label="Contact Number">{patient.contactNumber}</Descriptions.Item>
                  <Descriptions.Item label="Address">{patient.address}</Descriptions.Item>
                </Descriptions>
              </div>
            )}
            <div className="mb-4 flex-1">
              <div className="bg-sky-600 text-white p-4 rounded-t-lg">
                <h2 className="text-xl font-semibold">Appointment History</h2>
              </div>
              <Table
                dataSource={appointments?.filter((appt) => appt.patientId === id)}
                columns={[
                  { title: 'Date', dataIndex: 'date', key: 'date' },
                  { title: 'Start Time', dataIndex: 'startTime', key: 'startTime' },
                  { title: 'End Time', dataIndex: 'endTime', key: 'endTime'},
                  { title: 'Location', dataIndex: 'location', key: 'location' },
                  { title: 'Service', dataIndex: 'service', key: 'service' }, 
                  { title: 'Status', dataIndex: 'status', key: 'status',render:((v) => <Tag color={v === 'Completed' ? 'success' : v === 'Cancelled' ? 'error' : 'orange'}>{v}</Tag>) }, 
                ]}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                className="bg-white shadow-md rounded-md"
              />
            </div>
          </div>

          <Modal
            title="Select Appointment Date"
            open={isAppointing}
            width={1000}
            onCancel={() => setIsAppointing(false)}
            footer={null}
          >
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectSlot={handleSelectSlot}
              selectable
              style={{ height: '500px' }}
            />
          </Modal>

          <Modal
            title="Confirm Appointment Details"
            open={isConfirming}
            onCancel={() => setIsConfirming(false)}
            footer={null}
          >
            <Form form={form} onFinish={handleSaveAppointment}>
              <Form.Item
                label="Appointment Time"
                name="time"
                rules={[{ required: true, message: 'Please select the appointment time!' }]}
              >
                <TimePicker.RangePicker format="h:mm A" showTime={{ format: 'h:mm A' }} />
              </Form.Item>
              <Form.Item
                label="Location"
                name="location"
                rules={[{ required: true, message: 'Please enter the location!' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Service"
                name="service"
                rules={[{ required: true, message: 'Please select a service!' }]}
              >
                <Select>
                  {services.map((service) => (
                    <Select.Option key={service.id} value={service.serviceName}>
                      {service.serviceName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Save Appointment
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
    </div>
  );
};
