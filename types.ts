export interface Member {
  id: string;
  name: string;
  photoUrl: string; // Base64 string for display
  faceDescriptor?: number[]; // Biometric data (array of 128 floats)
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string; // Denormalized for easier export
  timestamp: string; // ISO string
  dateStr: string; // YYYY-MM-DD for grouping
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CHECKIN = 'CHECKIN',
  MEMBERS = 'MEMBERS',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}

export interface AttendanceStats {
  totalPresent: number;
  uniqueMembers: number;
  topAttendees: { name: string; count: number }[];
}