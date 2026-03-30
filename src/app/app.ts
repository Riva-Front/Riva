import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './service/auth.service';

import { ForgetPasswordComponent } from './core/components/auth/forget-password/forget-password.component';
import { NewPasswordComponent } from './core/components/auth/new-password/new-password.component';
import { SignupComponent } from './core/components/auth/signup/signup.component';
import { ProfileAccountComponent } from './core/components/auth/profile-account/profile-account.component';
import { SigninComponent } from './core/components/auth/signin/signin.component';
import { NavbarComponent } from "./core/components/layout/navbar/navbar.component";
import { FooterComponent } from "./core/components/layout/footer/footer.component";
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    SigninComponent,
    ForgetPasswordComponent,
    NewPasswordComponent,
    SignupComponent,
    ProfileAccountComponent,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {


  protected readonly title = signal('project-riva');

  constructor(
    public router: Router,
    private auth: AuthService
  ) {}

  // ✅ AUTO LOGIN هنا
  ngOnInit(): void {
      this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {
      window.scrollTo(0, 0);
    });


    const token = this.auth.getToken();

    // لو فيه توكن يدخل dashboard مباشرة
    if (token) {
      // this.router.navigate(['/dashboard-p']);
    } else {
      this.router.navigate(['/signin']);
    }
  }

  // علشان نخفي navbar و footer في صفحات auth
  isAuthPage(): boolean {
    const authRoutes = [
      'signin',
      'signup',
      'forget-password',
      'new-password',
      'profile-account',
      'dashboard-p',
      'welcome1',
      'add-new-medication',
      'doctor-cards'

    ];

    return authRoutes.some(route =>
      this.router.url.includes(route)
    );
  }
}