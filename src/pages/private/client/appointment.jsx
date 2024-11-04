import { useState, useEffect } from 'react';
import { Modal, Form, Input, TimePicker, Button, notification, Select, Card, Col, Row } from 'antd';
import { getDocs, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../db';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';
import useStore from '../../../zustand/store/store';
import { selector } from '../../../zustand/store/store.provider';

const localizer = dateFnsLocalizer({
  format, 
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS }, 
});

export const ClientAppointmentPage = () => {
  const user = useStore(selector('user'));
  const clientId = user.info.id; 
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchAppointmentsAndServices = async () => {
    setLoading(true);
    try {
      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
      const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      appointmentsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAppointments(appointmentsList);

      const servicesSnapshot = await getDocs(collection(db, 'services'));
      const servicesList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      servicesList.shift();
      setServices(servicesList);
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
    fetchAppointmentsAndServices();
  }, []);

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
      const appointmentRef = await addDoc(collection(db, 'appointments'), {
        patientId: clientId, 
        date: selectedDate,
        startTime: startTimeFormatted.format('h:mm A'),
        endTime: endTimeFormatted.format('h:mm A'),
        location,
        service,
        createdAt: dayjs().format(),
        status: 'Pending'
      });

      await addDoc(collection(db, 'notifications'), {
        appointmentId: appointmentRef.id,
        message: `New appointment scheduled for ${service} on ${selectedDate} from ${dayjs(time[0]).format('h:mm A')} to ${dayjs(time[1]).format('h:mm A')}`,
        createdAt: dayjs().format(),
        read: false 
      });

      notification.success({
        message: 'Success',
        description: 'Appointment added successfully!',
      });
      setIsConfirming(false);
      fetchAppointmentsAndServices(); 
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

  const handleSelectDate = (slotInfo) => {
    const date = slotInfo.start;
    setSelectedDate(dayjs(date).format('YYYY-MM-DD'));
    setIsConfirming(true);
  };

  const events = appointments?.filter(appt => appt.patientId === clientId)?.map(appt => ({
    id: appt.id,
    title: `${appt.service} - ${appt.startTime} - ${appt.location}`,
    start: new Date(`${appt.date}T${dayjs(appt.startTime, 'h:mm A').format('HH:mm:ss')}`),
    end: new Date(`${appt.date}T${dayjs(appt.endTime, 'h:mm A').format('HH:mm:ss')}`),
    location: appt.location,
    service: appt.service,
  }));

  return (
    <div className="p-4 md:p-8">
      <div className='flex w-full justify-end'>
        <Button 
          type="primary" 
          onClick={() => setIsCalendarVisible(true)} 
          className="mb-4"
        >
          Add Appointment
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {appointments?.filter(appt => appt.patientId === clientId)?.map((appointment) => (
          <Col xs={24} sm={12} md={8} key={appointment.id}>
            <Card title={`Appointment on ${appointment.date}`} bordered>
              <p><strong>Service:</strong> {appointment.service}</p>
              <p><strong>Time:</strong> {appointment.startTime} - {appointment.endTime}</p>
              <p><strong>Location:</strong> {appointment.location}</p>
              <p><strong>Status:</strong> {appointment.status}</p>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="Select Appointment Date"
        open={isCalendarVisible}
        onCancel={() => setIsCalendarVisible(false)}
        footer={null}
        width="100%"
        style={{ maxWidth: '1200px' }}
        bodyStyle={{ padding: 0 }}
        centered
      >
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '70vh', padding: '10px' }}
          selectable
          onSelectSlot={handleSelectDate}
          dayLayoutAlgorithm="no-overlap"
          views={['month', 'week', 'day']}
          popup={true}
        />
      </Modal>

      <Modal
        title={`Add Appointment for ${selectedDate}`}
        open={isConfirming}
        onCancel={() => setIsConfirming(false)}
        footer={null}
        width="100%"
        style={{ maxWidth: '600px' }}
      >
        <div>
          <Form form={form} onFinish={handleSaveAppointment}>
            <Form.Item
              label="Appointment Time"
              name="time"
              rules={[{ required: true, message: 'Please select an appointment time!' }]}
            >
              <TimePicker.RangePicker format="h:mm A" className="w-full" />
            </Form.Item>
            <Form.Item
              label="Location"
              name="location"
              rules={[{ required: true, message: 'Please enter the appointment location!' }]}
            >
              <Input className="w-full" />
            </Form.Item>
            <Form.Item
              label="Service"
              name="service"
              rules={[{ required: true, message: 'Please enter the service!' }]}
            >
              <Select className="w-full">
                {services.map((service) => (
                  <Select.Option key={service.id} value={service.serviceName}>
                    {service.serviceName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} className="w-full">
                Save Appointment
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};
