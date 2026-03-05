import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router'; // 1. استيراد الروتر

@Component({
  selector: 'app-welcome1',
  standalone: true,
  imports: [], // لو هتستخدمي routerLink في الـ HTML ضيفي RouterModule هنا
  templateUrl: './welcome1.component.html',
  styleUrl: './welcome1.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Welcome1Component {

  // 2. تعريف الروتر في الـ Constructor
  constructor(private router: Router) {}

  // 3. دالة التنقل اللي هناديها من الزرار
  goToNextPage() {
    this.router.navigate(['/dashboard-p']); // اكتبي هنا مسار الصفحة اللي عوزاها
  }
}