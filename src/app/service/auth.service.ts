import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  [x: string]: any;
    private url = 'https://api.escuelajs.co/api/v1/auth';
  constructor(private http: HttpClient) {}

  // جلب الدور من LocalStorage
  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  // تسجيل الدخول من API
  login(email: string, password: string) {
    return this.http.post(`${this.url}/login`, { email, password })
  }

  // جلب البروفايل
  getProfile() {
    return this.http.get<User>(`${this.url}/profile`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  // حفظ التوكن
  saveToken(response: any) {
    localStorage.setItem("token", response.access_token);
  }

  // جلب التوكن
  getToken() {
    return localStorage.getItem("token");
  }

  // تسجيل الخروج
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  }

  // التحقق من حالة تسجيل الدخول
  isAuthenticated(): boolean {
    const token = localStorage.getItem("token");
    return !!token; // true لو فيه توكن
  }
  isAdmin(): boolean {
    return localStorage.getItem('role') === 'admin';
  }}
