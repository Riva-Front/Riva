/* eslint-disable @angular-eslint/prefer-inject */

// =======================================================
// 🟣 بنستورد Injectable علشان نخلي الكلاس Service
// CanActivate علشان نستخدمه كـ Route Guard
// Router علشان نعمل Redirect لو المستخدم مش مسجل دخول
// AuthService علشان نعرف هل المستخدم عامل Login ولا لأ
// =======================================================

import { Injectable } from "@angular/core";
import { CanActivate, Router } from '@angular/router';
import { AuthService } from "../service/auth.service";

// =======================================================
// 🟣 providedIn: 'root'
// يعني السيرفيس دي Global ومتاحة في المشروع كله
// Angular بيعمل منها نسخة واحدة بس
// =======================================================

@Injectable({ providedIn: 'root' })

// =======================================================
// 🟣 AuthGuard بيطبق CanActivate
// يعني قبل ما أي صفحة تفتح يسأل:
// هل ينفع المستخدم يدخل الصفحة دي؟
// =======================================================

export class AuthGuard implements CanActivate {

  // =====================================================
  // 🟣 Constructor
  // بنعمل Injection لـ:
  // auth → علشان نستخدم isAuthenticated()
  // router → علشان نعمل تحويل لصفحة login لو مش مسجل
  // =====================================================
  constructor(private auth: AuthService, private router: Router) {}

  // =====================================================
  // 🟣 canActivate()
  // دي بتتنفذ تلقائيًا قبل فتح أي Route
  // لازم ترجع true أو false
  // =====================================================
  canActivate(): boolean {

    // لو المستخدم عنده Token ومحفوظ في LocalStorage
    if (this.auth.isAuthenticated()) {

      // نسمح له يدخل الصفحة
      return true;

    } else {

      // لو مش مسجل دخول
      // نطبع رسالة في الكونسول للتأكد أثناء التطوير
      console.log('Redirecting to login');

      // نحوله لصفحة تسجيل الدخول
<<<<<<< HEAD
      this.router.navigate(['/signin']);
=======
      this.router.navigate(['/login']);
>>>>>>> 487f2a7d28cee868c1bd82702439af01094e73a4

      // نمنع فتح الصفحة المطلوبة
      return false;
    }
  }
}