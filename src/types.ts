export interface Location {
  area: string;
  city: string;
  district: string;
  pincode: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface Issue {
  id: string;
  citizenName: string;
  citizenPhone: string;
  title: string;
  category: string;
  location: Location;
  description: string;
  translatedDescription: string;
  photoUrl: string;
  status: "submitted" | "accepted" | "in_progress" | "waiting_verification" | "resolved" | "rejected";
  upvotes: string[];
  downvotes: string[];
  risk: "low" | "moderate" | "high" | "emergency";
  priority: "low" | "medium" | "high" | "critical";
  raisedDate: string;
  resolvedDate: string | null;
  resolvedPhotoUrl: string | null;
  resolvedNote: string | null;
  verificationUpvotes: string[];
  verificationDownvotes: string[];
}

export interface User {
  phone: string;
  name: string;
  points: number;
  acceptedCount: number;
  role: "citizen" | "authority";
}

export type Category = 
  | "Road Problem"
  | "Garbage Issue"
  | "Water Related"
  | "Sewage & Drainage"
  | "Streetlight Failure"
  | "Electricity Outage"
  | "Public Health & Hygiene"
  | "Others";
