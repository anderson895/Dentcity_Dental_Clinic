import { useState, useEffect } from "react";
import { Card, Table, List, Pagination } from "antd";
import { UserOutlined, ScheduleOutlined, CalendarOutlined } from "@ant-design/icons"; // Ant Design Icons
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../db";

export const Dashboard = () => {
  const [loading,setLoading] = useState(false)
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalPatients, setTotalPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Function to fetch all appointments
  const fetchAppointments = async () => {
    setLoading(true)
    const q = query(collection(db, "appointments"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const allAppointments = querySnapshot.docs.map((doc) => doc.data());
    setAppointments(allAppointments);
    setTotalAppointments(allAppointments.length);
  };

  // Function to fetch today's appointments
  const fetchTodayAppointments = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayString = `${year}-${month}-${day}`; // Create string format 'YYYY-MM-DD'

    const q = query(
      collection(db, "appointments"),
      where("date", "==", todayString), // Match today's date as string
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    const todayAppts = querySnapshot.docs.map((doc) => doc.data());
    setTodayAppointments(todayAppts);
  };

  // Fetch the total number of patients
  const fetchTotalPatients = async () => {
    const patientsSnapshot = await getDocs(collection(db, "patients"));
    setTotalPatients(
      patientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
    setLoading(false)
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAppointments();
    fetchTodayAppointments();
    fetchTotalPatients();
  }, []);

  // Pagination for today's appointments
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Columns for the appointment table
  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Start Time", dataIndex: "startTime", key: "startTime" },
    { title: "End Time", dataIndex: "endTime", key: "endTime" },
    { title: "Location", dataIndex: "location", key: "location" },
    { title: "Service", dataIndex: "service", key: "service" },
    {
      title: "Patient Name",
      key: "patientName",
      render: (_, record) => {
        const patient = totalPatients.find((p) => p.id === record.patientId);
        return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown";
      },
    },
  ];

  if(loading){
    return <div className=" w-full min-h-[700px] flex justify-center items-center"><p className="loader" /></div>
  }

  return (
    <div className="p-4">
      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Appointments Today */}
        <Card
          title="Total Appointments Today"
          bordered={false}
          className="shadow-md"
          style={{ backgroundColor: "#f0f5ff" }}
          icon={<ScheduleOutlined />}
        >
          <div className="flex items-center">
            <ScheduleOutlined style={{ fontSize: '24px', marginRight: '10px', color: '#1890ff' }} />
            <span className="text-lg">{todayAppointments.length}</span>
          </div>
        </Card>

        {/* Total Appointments */}
        <Card
          title="Total Appointments"
          bordered={false}
          className="shadow-md"
          style={{ backgroundColor: "#f0f5ff" }}
        >
          <div className="flex items-center">
            <CalendarOutlined style={{ fontSize: '24px', marginRight: '10px', color: '#52c41a' }} />
            <span className="text-lg">{totalAppointments}</span>
          </div>
        </Card>

        {/* Total Patients */}
        <Card
          title="Total Patients"
          bordered={false}
          className="shadow-md"
          style={{ backgroundColor: "#f0f5ff" }}
        >
          <div className="flex items-center">
            <UserOutlined style={{ fontSize: '24px', marginRight: '10px', color: '#faad14' }} />
            <span className="text-lg">{totalPatients.length}</span>
          </div>
        </Card>
      </div>

      {/* Layout for Table and List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Side - All Appointments Table */}
        <div className="md:col-span-2">
          <Table
            columns={columns}
            dataSource={appointments}
            pagination={false}
            rowKey="id"
            className="shadow-md custom-table"
          />
        </div>

        {/* Right Side - Today's Appointments List */}
        <div className="md:col-span-1 bg-white rounded-t-md overflow-hidden">
          <List
            className="custom-list text-center rounded-t-md"
            header={<div>Appointments Today</div>}
            dataSource={todayAppointments.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )}
            renderItem={(item) => {
              const patient = totalPatients.find(p => p.id === item.patientId);
              const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
              
              return (
                <List.Item >
                  <div className="pl-6 text-left">
                    <strong>{patientName}</strong> {/* Show patient name */}
                    <p>{new Date(item.date).toLocaleDateString()}</p> {/* Display readable date */}
                    <p>Start Time: {item.startTime}</p> {/* Show start time */}
                    <p>End Time: {item.endTime}</p>   {/* Show end time */}
                    <p>Location: {item.location}</p>   {/* Show location */}
                  </div>
                </List.Item>
              );
            }}
          />
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            align="center"
            total={todayAppointments.length}
            onChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};
