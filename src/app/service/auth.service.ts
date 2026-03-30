<<<<<<< HEAD
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

=======
// ==========================================================
// 🟣 IMPORTS
// HttpClient → علشان نبعت Request للـ API
// Injectable → علشان نقدر نستخدم السيرفيس في أي كومبوننت
// ==========================================================
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


// ==========================================================
// 🟣 Interface User
// بنحدد شكل بيانات المستخدم اللي راجعة من API
// علشان TypeScript يعرف نوع البيانات
// ==========================================================
export interface User {
  id: number;     // رقم المستخدم
  name: string;   // اسم المستخدم
  email: string;  // الايميل
  role: string;   // نوع المستخدم (admin / customer ...)
}


// ==========================================================
// 🟣 Injectable Service
// providedIn: 'root' → يعني السيرفيس متاح في كل التطبيق
// ==========================================================
>>>>>>> 487f2a7d28cee868c1bd82702439af01094e73a4
@Injectable({
  providedIn: 'root',
})
export class AuthService {

<<<<<<< HEAD
  // ✅ Base URL الصح
  private url = 'https://api.escuelajs.co/api/v1/auth';

  constructor(private http: HttpClient) {}
  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  // ✅ Login
=======
  // ==========================================================
  // 🟣 API Base URL
  // ده اللينك الأساسي الخاص بالـ authentication
  // ==========================================================
  private url = 'https://api.escuelajs.co/api/v1/auth';

  // ==========================================================
  // 🟣 Constructor
  // بنعمل Injection لـ HttpClient علشان نستخدمه
  // ==========================================================
  constructor(private http: HttpClient) {}



  // ==========================================================
  // 🟣 login()
  // 🔹 تسجيل الدخول
  // بنبعت email و password للـ API
  // API بيرجع access_token
  // ==========================================================
>>>>>>> 487f2a7d28cee868c1bd82702439af01094e73a4
  login(email: string, password: string) {
    return this.http.post(`${this.url}/login`, { email, password });
  }

<<<<<<< HEAD
  // ✅ Get Profile
=======


  // ==========================================================
  // 🟣 getProfile()
  // 🔹 جلب بيانات المستخدم بعد تسجيل الدخول
  // لازم نبعت التوكن في Authorization Header
  // Bearer + token
  // ==========================================================
>>>>>>> 487f2a7d28cee868c1bd82702439af01094e73a4
  getProfile() {
    return this.http.get<User>(`${this.url}/profile`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

<<<<<<< HEAD
  // ✅ Save Token
=======


  // ==========================================================
  // 🟣 saveToken()
  // 🔹 حفظ التوكن في localStorage بعد نجاح تسجيل الدخول
  // response.access_token → ده اللي بيرجع من API
  // ==========================================================
>>>>>>> 487f2a7d28cee868c1bd82702439af01094e73a4
  saveToken(response: any) {
    localStorage.setItem('token', response.access_token);
  }

<<<<<<< HEAD
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
=======


  // ==========================================================
  // 🟣 isAuthenticated()
  // 🔹 التحقق هل المستخدم مسجل دخول ولا لأ
  // لو في token في localStorage → يرجع true
  // لو مفيش → false
  // ==========================================================
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }



  // ==========================================================
  // 🟣 logout()
  // 🔹 تسجيل الخروج
  // بنمسح التوكن من localStorage
  // ==========================================================
  logout(): void {
    localStorage.removeItem('token');
  }

}
>>>>>>> 487f2a7d28cee868c1bd82702439af01094e73a4
