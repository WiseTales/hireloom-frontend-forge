export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string; // Full-time, Part-time, Contract
  category: string;
  salary?: string;
  description: string;
  requirements: string[];
  posted: string;
  isRemote: boolean;
}

export type JobCategory = 
  | "IT/Tech" 
  | "Sales/Marketing" 
  | "Finance" 
  | "Healthcare" 
  | "Engineering" 
  | "Design";
