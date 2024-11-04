import { useState, useEffect } from 'react';
import { Modal, Table, Form, Input, TimePicker, Select, Button, notification } from 'antd';
import { getDocs, collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../db'; // Adjust the import path as necessary
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale'; // Import locale
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';

// Setup date-fns localizer
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS }, // Use the imported locale
});

export const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Fetch appointments and patients
  const fetchAppointmentsAndPatients = async () => {
    setLoading(true);
    try {
      // Fetch all appointments
      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
      const list = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      list.shift()
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAppointments(list);

      // Fetch all patients
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      setPatients(patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })));
      const serviceSnapshot = await getDocs(collection(db, 'services'));
      const servicesList = serviceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      servicesList.shift()
      setServices(servicesList)
    } catch (error) {
      console.error('Error fetching data:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsAndPatients();
  }, []);
  const handleSaveAppointment = async (values) => {
    setLoading(true);
    try {
      const { patientId, time, location, service } = values;
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
        patientId,
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
      fetchAppointmentsAndPatients(); 
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
    id: appt.id,
    title: `${patients.find(patient => patient.id === appt.patientId)?.firstName} ${patients.find(patient => patient.id === appt.patientId)?.lastName} - ${appt.service}`,
    start: new Date(`${appt.date}T${dayjs(appt.startTime, 'h:mm A').format('HH:mm:ss')}`),
    end: new Date(`${appt.date}T${dayjs(appt.endTime, 'h:mm A').format('HH:mm:ss')}`),
    location: appt.location,
    service: appt.service,
  }));


  const handleSelectEvent = (event) => {
    notification.info({
      message: 'Appointment Info',
      description: `You have an appointment on ${format(event.start, 'yyyy-MM-dd')}.`,
    });
  };

  const handleSelectSlot = (slotInfo) => {
    const date = slotInfo.start;
      setSelectedDate(format(date, 'yyyy-MM-dd'));
      setIsConfirming(true);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    setLoading(true);
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { status: newStatus });

      notification.success({
        message: 'Success',
        description: 'Appointment status updated successfully!',
      });

      fetchAppointmentsAndPatients();
    } catch (error) {
      console.error('Error updating status:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to update appointment status.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if(loading){
    return <div className=" w-full min-h-[700px] flex justify-center items-center"><p className="loader" /></div>
  }

  return (
        <div>
          <div className='flex w-full justify-end'>
          <Button type="primary" onClick={() => setIsCalendarVisible(true)} className="mb-4">
            Add Appointment
          </Button>
          </div>
          <Table
            dataSource={appointments}
            columns={[
              { title: 'Date', dataIndex: 'date', key: 'date' },
              { title: 'Start Time', dataIndex: 'startTime', key: 'startTime' },
              { title: 'End Time', dataIndex: 'endTime', key: 'endTime' },
              { title: 'Location', dataIndex: 'location', key: 'location' },
              { title: 'Service', dataIndex: 'service', key: 'service' },
              {
                title: 'Patient Name',
                key: 'patientName',
                render: (_, record) => {
                  const patient = patients.find(p => p.id === record.patientId);
                  return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
                }
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, record) => (
                  <Select
                    value={record.status}
                    className='w-32'
                    onChange={(value) => handleStatusChange(record.id, value)}
                  >
                    <Select.Option value="Scheduled">Scheduled</Select.Option>
                    <Select.Option value="Completed">Completed</Select.Option>
                    <Select.Option value="Cancelled">Cancelled</Select.Option>
                  </Select>
                ),
              },
            ]}
            rowKey="id"
            pagination={false}
            className="custom-table mb-4 bg-white shadow-md rounded-md"
          />
          <Modal
            title="Select Appointment Date"
            open={isCalendarVisible}
            onCancel={() => setIsCalendarVisible(false)}
            footer={null}
            width={1200}
          >
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
            />
          </Modal>
          <Modal
            title={`Add Appointment for ${selectedDate}`}
            open={isConfirming}
            onCancel={() => setIsConfirming(false)}
            footer={null}
          >
            <div>
              <Form form={form} onFinish={handleSaveAppointment}>
                <Form.Item
                  label="Patient"
                  name="patientId"
                  rules={[{ required: true, message: 'Please select a patient!' }]}
                >
                  <Select placeholder="Select a patient">
                    {patients.map(patient => (
                      <Select.Option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Appointment Time"
                  name="time"
                  rules={[{ required: true, message: 'Please select an appointment time!' }]}
                >
                  <TimePicker.RangePicker format="h:mm A" />
                </Form.Item>
                <Form.Item
                  label="Location"
                  name="location"
                  rules={[{ required: true, message: 'Please enter the appointment location!' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Service"
                  name="service"
                  rules={[{ required: true, message: 'Please enter the service!' }]}
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
            </div>
          </Modal>
        </div>
  );
};
