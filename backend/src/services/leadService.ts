import Lead, { ILead } from "../models/Lead";

export const findAllLeads = async (): Promise<ILead[]> => {
  return Lead.find().sort({ createdAt: -1 });
};

export const findLeadById = async (id: string): Promise<ILead | null> => {
  return Lead.findById(id);
};

export const createNewLead = async (data: Partial<ILead>): Promise<ILead> => {
  return Lead.create(data);
};

export const updateLeadById = async (
  id: string,
  data: Partial<ILead>
): Promise<ILead | null> => {
  return Lead.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

export const deleteLeadById = async (id: string): Promise<ILead | null> => {
  return Lead.findByIdAndDelete(id);
};
