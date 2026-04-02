// 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  patient?: unknown;
  doctor?: unknown;
  caregiver?: unknown;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  role: 'patient' | 'doctor' | 'caregiver' | 'admin';
  address?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  [x: string]: any;
  private readonly url = 'http://localhost:8000/api/auth';

  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/register`, payload);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/login`, { email, password });
  }

  getProfile(): Observable<User> {
    const token = this.getToken();
    return this.http.get<User>(`${this.url}/me`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    });
  }

  saveToken(response: LoginResponse): void {
    if (!this.isBrowser) return;
    localStorage.setItem('token', response.token);
    localStorage.setItem('role', response.user.role);
  }

  getToken(): string {
    if (!this.isBrowser) return '';
    return localStorage.getItem('token') || '';
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }
}