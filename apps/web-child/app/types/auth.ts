/**
 * Authentication related types
 */

export interface User {
  id: string;
  email: string;
  nickname: string;
  role: 'parent' | 'child';
  created_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
  role: 'child';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
}

export interface PairingRequest {
  pairing_code: string;
}

export interface PairingCodeResponse {
  code: string;
  expires_in_minutes: number;
}
