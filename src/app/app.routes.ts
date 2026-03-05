import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { sign } from 'crypto';
import { SigninComponent } from './core/components/auth/signin/signin.component';
import { ForgetPasswordComponent } from './core/components/auth/forget-password/forget-password.component';
import { NewPasswordComponent } from './core/components/auth/new-password/new-password.component';
import { SignupComponent } from './core/components/auth/signup/signup.component';
import { ProfileAccountComponent } from './core/components/auth/profile-account/profile-account.component';
import { HomeComponent } from './features/components/home/home.component';
import { Welcome1Component } from './core/components/auth/welcome1/welcome1.component';
import { DashboardPComponent } from './core/components/dashboard-p/dashboard-p.component';
export const routes: Routes = [
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      {path:'signin', component:SigninComponent},
      {path:'forget-password', component:ForgetPasswordComponent},
      {path:'new-password', component:NewPasswordComponent},
      {path:'signup', component:SignupComponent},
      {path:'profile-account', component:ProfileAccountComponent},
      {path:'home', component:HomeComponent},
      {path:'dashboard-p', component:DashboardPComponent},
      {path:'welcome1', component:Welcome1Component}


];
    
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
