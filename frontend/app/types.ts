export interface Lead {
  _id: string;
  dentistName: string;
  clinicName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes: string;
  createdAt: string;
}
