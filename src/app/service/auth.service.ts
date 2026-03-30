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

  // ✅ Base URL الصح
  private url = 'https://api.escuelajs.co/api/v1/auth';

  constructor(private http: HttpClient) {}
  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  // ✅ Login
  login(email: string, password: string) {
    return this.http.post(`${this.url}/login`, { email, password });
  }

  // ✅ Get Profile
  getProfile() {
    return this.http.get<User>(`${this.url}/profile`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  // ✅ Save Token
  saveToken(response: any) {
    localStorage.setItem('token', response.access_token);
  }

  getToken() {
    return localStorage.getItem("token");
  }
  // ✅ Is Authenticated
  isAuthenticated(): boolean {
     const token = localStorage.getItem("token");
    return !!token; // true لو فيه توكن
  }

  // ✅ Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem("role");

  }
  

}
