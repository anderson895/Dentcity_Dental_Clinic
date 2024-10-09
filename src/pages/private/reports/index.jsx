import { useState, useEffect } from 'react';
import { notification, Card } from 'antd';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../db'; // Adjust the import path as necessary
import { currencyFormat } from '../../../utils/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell, Tooltip as PieTooltip } from 'recharts';

// Color palette for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Reports = () => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch appointments and services
  const fetchAppointmentsAndServices = async () => {
    setLoading(true);
    try {
      // Fetch all appointments
      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
      const appointmentList = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      appointmentList.shift(); // This will remove the first element, if needed
      setAppointments(appointmentList);

      // Fetch all services
      const servicesSnapshot = await getDocs(collection(db, 'services')); // Assuming you have a 'services' collection
      const serviceList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      serviceList.shift(); // This will remove the first element, if needed
      setServices(serviceList);
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

  // Calculate total income and number of appointments for each service
  const calculateIncome = () => {
    const incomeMap = {};
    const countMap = {}; // To keep track of the number of appointments

    appointments.forEach(appt => {
      const service = services.find(s => s.serviceName === appt.service);
      if (service) {
        const price = service.price || 0;
        if (incomeMap[service.serviceName]) {
          incomeMap[service.serviceName] += Number(price);
          countMap[service.serviceName] += 1; // Increment the appointment count
        } else {
          incomeMap[service.serviceName] = Number(price);
          countMap[service.serviceName] = 1; // Initialize the appointment count
        }
      }
    });

    return Object.entries(incomeMap).map(([serviceName, totalIncome]) => ({
      serviceName,
      totalIncome,
      appointmentCount: countMap[serviceName], // Add appointment count to the data
    }));
  };

  const incomeData = calculateIncome();
  
  // Prepare data for pie chart
  const pieData = incomeData.map(data => ({
    name: data.serviceName,
    value: data.totalIncome,
  }));

  const totalIncome = incomeData.reduce((sum, data) => sum + data.totalIncome, 0);
  const totalAppointments = incomeData.reduce((sum, data) => sum + data.appointmentCount, 0);

  if(loading){
    return <div className=" w-full min-h-[700px] flex justify-center items-center"><p className="loader" /></div>
  }
  return (
    <div className="p-6 mx-auto">

          <div className="flex gap-4 mb-6">
            {/* Summary Statistics */}
            <Card title="Summary Statistics" className="w-1/3 custom-cardHeader">
              <p>Total Income: {currencyFormat(totalIncome)}</p>
              <p>Total Appointments: {totalAppointments}</p>
            </Card>

            {/* Pie Chart */}
            <Card title="Income Distribution" className="w-2/3 custom-cardHeader">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={150}
                    fill="#8884d8"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <PieTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Line Chart */}
          <ResponsiveContainer width="100%" height={500} className='bg-white rounded-md p-4'>
            <LineChart data={incomeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="serviceName" />
              <YAxis tickFormatter={(value) => currencyFormat(value)} />
              <Tooltip formatter={(value) => currencyFormat(value)} />
              <Legend />
              <Line type="monotone" dataKey="totalIncome" stroke="#8884d8" name="Total Income" />
              <Line type="monotone" dataKey="appointmentCount" stroke="#82ca9d" name="Appointment Count" />
            </LineChart>
          </ResponsiveContainer>
    </div>
  );
};
