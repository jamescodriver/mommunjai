// Client-safe constants/types (NO node:crypto). Import this from client components.
export const PERMISSIONS = [
  "view_leads",
  "manage_tags",
  "view_reports",
  "manage_users",
  "line_admin",
  "export_data",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_leads: "ดูข้อมูลลูกค้า/Ticket",
  manage_tags: "จัดการ Tag",
  view_reports: "ดูรายงานเฉพาะบุคคล",
  manage_users: "จัดการผู้ใช้ (Admin)",
  line_admin: "ตั้งค่า LINE",
  export_data: "ส่งออกข้อมูล",
};

export interface Session {
  sid: string;
  name: string;
  role: "admin" | "staff";
  perms: Permission[];
  exp: number;
}

export const SESSION_COOKIE = "mmj_staff";
export const SESSION_TTL_SEC = 60 * 60 * 8; // 8h
