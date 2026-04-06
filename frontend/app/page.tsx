"use client";

import { useEffect, useState } from "react";
import LeadForm from "./components/LeadForm";
import LeadTable from "./components/LeadTable";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_URL}/leads`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await fetch(`${API_URL}/leads/${id}`, { method: "DELETE" });
      fetchLeads();
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLead(null);
    fetchLeads();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Dentist Lead Generation
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Lead
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            All Leads ({leads.length})
          </h2>
          <LeadTable
            leads={leads}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </main>

      {showForm && (
        <LeadForm
          lead={editingLead}
          onClose={handleFormClose}
          apiUrl={API_URL}
        />
      )}
    </div>
  );
}
