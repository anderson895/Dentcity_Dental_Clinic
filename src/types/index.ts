// Define the Patient interface
export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    contactNumber?: string; // Optional field if not all patients have this
    email?: string; // Optional field if you want to include email
  }
  
  // Define the Service interface
 export interface Service {
    id: string;
    serviceName: string;
    price: number; // Assuming price is a number
  }
  
 export interface Appointment {
    id: string;
    patientId: string;
    date: string; // Format 'yyyy-MM-dd'
    startTime: string; // Format 'h:mm A'
    endTime: string; // Format 'h:mm A'
    location: string;
    service: string; // Assuming this refers to the service name
    createdAt: string; // Date created
    status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled'; // Status can be an enum if you prefer
  }
  