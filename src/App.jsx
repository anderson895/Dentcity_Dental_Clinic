import './App.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { RouterUrl } from './routes';
import { AdminSide, Client, Public } from './layout';
import { LoginPage } from './pages/index'
import { Dashboard } from './pages/private/dashboard';
import { PatientRecords } from './pages/private/records';
import { PatientDetails } from './pages/private/records/patientDetails';
import { ServicesPage } from './pages/private/services';
import { Appointments } from './pages/private/appointments';
import { Reports } from './pages/private/reports';
import { ClientDashboard } from './pages/private/client/dashboard';
import { ClientAppointmentPage } from './pages/private/client/appointment';
import { ClientServicesPage } from './pages/private/client/services';
import { RegistrationPage } from './pages/public/registration';

function App() {
  const router = createBrowserRouter([
    {
      path:RouterUrl.Login,
      element: <Public />,
      children: [
        { path: RouterUrl.Login, element: <LoginPage />},
        { path: RouterUrl.Register, element: <RegistrationPage />},
      ]
    },
    {
      path:RouterUrl.Login,
      element: <Client />,
      children: [
        { path: RouterUrl.ClientHome, element: <ClientDashboard />},
        { path: RouterUrl.ClientAppoint, element: <ClientAppointmentPage />},
        { path: RouterUrl.ClientService, element: <ClientServicesPage />},
      ]
    },
    {
      path: RouterUrl.Login,
      element:<AdminSide />,
      children:[
        { path: RouterUrl.Dashboard, element: <Dashboard />},
        { path: RouterUrl.Record, element: <PatientRecords />},
        { path: RouterUrl.PatientRecord, element: <PatientDetails />},
        { path: RouterUrl.Services, element: <ServicesPage />},
        { path: RouterUrl.Appointments, element: <Appointments />},
        { path: RouterUrl.Reports, element: <Reports />},
      ]
    }
  ])
  return (
    <RouterProvider router={router} fallbackElement={<h6>Loading...</h6>} />
  )
}

export default App
