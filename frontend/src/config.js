// ============================================================
// KONFIGURASI APLIKASI — SESUAIKAN DI SINI
// ============================================================

// URL Web App Apps Script (endpoint /exec).
// Dev: gunakan '/api' agar diproxy Vite (lihat vite.config.js).
// Prod: ganti dengan URL asli https://script.google.com/macros/s/XXXX/exec
export const APPSCRIPT_URL =
  import.meta.env.VITE_APPSCRIPT_URL || '/api';

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'AirNav Billing';
export const TIMEZONE = 'Asia/Makassar';
export const UNITS = ['WAWW', 'WAFO', 'WAWP', 'WAWB', 'WAWR', 'WAWD'];
export const CURRENCY = 'IDR';
export const DEFAULT_KURS = 15000;

export const STATUS = {
  VALIDATION: 'VALIDATION',
  INVOICED: 'INVOICED',
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  VOID: 'VOID',
};

export const BATCH_STATUS = {
  ACTIVE: 'ACTIVE',
  SENT: 'SENT',
  PROOF_SUBMITTED: 'PROOF_SUBMITTED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  REJECTED_FINAL: 'REJECTED_FINAL',
};

export const CATEGORY = {
  EXTEND: 'EXTEND',
  ADVANCE: 'ADVANCE',
};

export const DOM_INT = {
  DOMESTIK: 'DOMESTIK',
  INTERNATIONAL: 'INTERNATIONAL',
};