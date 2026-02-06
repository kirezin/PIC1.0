import { Member, AttendanceRecord } from '../types';

const KEYS = {
  MEMBERS: 'church_app_members',
  ATTENDANCE: 'church_app_attendance',
};

export const StorageService = {
  getMembers: (): Member[] => {
    try {
      const data = localStorage.getItem(KEYS.MEMBERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load members", e);
      return [];
    }
  },

  saveMember: (member: Member): void => {
    const members = StorageService.getMembers();
    const index = members.findIndex(m => m.id === member.id);
    if (index >= 0) {
      members[index] = member;
    } else {
      members.push(member);
    }
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
  },

  deleteMember: (id: string): void => {
    const members = StorageService.getMembers().filter(m => m.id !== id);
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
  },

  getAttendance: (): AttendanceRecord[] => {
    try {
      const data = localStorage.getItem(KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load attendance", e);
      return [];
    }
  },

  logAttendance: (member: Member): AttendanceRecord | null => {
    const records = StorageService.getAttendance();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    // Prevent double check-in for the same person on the same day within 1 hour
    const recent = records.find(r => 
      r.memberId === member.id && 
      r.dateStr === dateStr &&
      (now.getTime() - new Date(r.timestamp).getTime()) < 60 * 60 * 1000 // 1 hour buffer
    );

    if (recent) return null;

    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      timestamp: now.toISOString(),
      dateStr: dateStr
    };

    records.unshift(newRecord); // Add to top
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
    return newRecord;
  },
  
  clearData: () => {
      localStorage.removeItem(KEYS.MEMBERS);
      localStorage.removeItem(KEYS.ATTENDANCE);
  }
};