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
      setAppointments(list);

      // Fetch all patients
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      setPatients(patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })));
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

  // Handle saving the new appointment
  const handleSaveAppointment = async (values) => {
    setLoading(true);
    try {
      const { patientId, time, location, service } = values;

      // Save the new appointment
      await addDoc(collection(db, 'appointments'), {
        patientId,
        date: selectedDate,
        startTime: dayjs(time[0]).format('h:mm A'),
        endTime: dayjs(time[1]).format('h:mm A'),
        location,
        service,
        createdAt: dayjs().format(),
        status:'Pending'
      });

      notification.success({
        message: 'Success',
        description: 'Appointment added successfully!',
      });
      setIsConfirming(false);
      fetchAppointmentsAndPatients(); // Refresh the data
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

  // Convert appointments to events for the calendar
  const events = appointments.map(appt => ({
    id: appt.id,
    title: `${patients.find(patient => patient.id === appt.patientId)?.firstName} ${patients.find(patient => patient.id === appt.patientId)?.lastName} - ${appt.service}`,
    start: new Date(`${appt.date}T${dayjs(appt.startTime, 'h:mm A').format('HH:mm:ss')}`),
    end: new Date(`${appt.date}T${dayjs(appt.endTime, 'h:mm A').format('HH:mm:ss')}`),
    location: appt.location,
    service: appt.service,
  }));

  // Check if the selected date already has an appointment
  const hasAppointmentOnDate = (date) => {
    return appointments.some(appt => appt.date === format(date, 'yyyy-MM-dd'));
  };

  // Handle event selection
  const handleSelectEvent = (event) => {
    notification.info({
      message: 'Appointment Info',
      description: `You have an appointment on ${format(event.start, 'yyyy-MM-dd')}.`,
    });
  };

  // Handle date slot selection
  const handleSelectSlot = (slotInfo) => {
    const date = slotInfo.start;
    if (hasAppointmentOnDate(date)) {
      notification.error({
        message: 'Date Unavailable',
        description: `This date (${format(date, 'yyyy-MM-dd')}) already has an appointment.`,
      });
    } else {
      setSelectedDate(format(date, 'yyyy-MM-dd'));
      setIsConfirming(true);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    setLoading(true);
    try {
      // Get a reference to the specific appointment document
      const appointmentRef = doc(db, 'appointments', appointmentId);
      
      // Update the appointment's status
      await updateDoc(appointmentRef, { status: newStatus });

      notification.success({
        message: 'Success',
        description: 'Appointment status updated successfully!',
      });

      fetchAppointmentsAndPatients(); // Refresh the data
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
          {/* Button to open calendar modal */}
          <div className='flex w-full justify-end'>
          <Button type="primary" onClick={() => setIsCalendarVisible(true)} className="mb-4">
            Add Appointment
          </Button>
          </div>

          {/* Table of all appointments */}
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

          {/* Calendar Modal for selecting date */}
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

          {/* Appointment Details Form Modal */}
          <Modal
            title={`Add Appointment for ${selectedDate}`}
            open={isConfirming}
            onCancel={() => setIsConfirming(false)}
            footer={null}
          >
            <div>
              {/* Form to add a new appointment */}
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
                  <Input />
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
