import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ForgetPasswordComponent } from './core/components/auth/forget-password/forget-password.component';
import { NewPasswordComponent } from './core/components/auth/new-password/new-password.component';
import { SignupComponent } from './core/components/auth/signup/signup.component';
import { ProfileAccountComponent } from './core/components/auth/profile-account/profile-account.component';
import { SigninComponent } from './core/components/auth/signin/signin.component';
import { NavbarComponent } from "./core/components/layout/navbar/navbar.component";
import { FooterComponent } from "./core/components/layout/footer/footer.component";

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
export class App {

  protected readonly title = signal('project-riva');

  constructor(public router: Router) {}

  isAuthPage(): boolean {
    const authRoutes = ['signin', 'signup', 'forget-password', 'new-password', 'profile-account', 'welcome1', 'dashboard-p'];
    return authRoutes.some(route => this.router.url.includes(route));
  }

}