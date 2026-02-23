<<<<<<< HEAD
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { sign } from 'crypto';
import { SigninComponent } from './core/components/auth/signin/signin.component';
import { ForgetPasswordComponent } from './core/components/auth/forget-password/forget-password.component';
import { NewPasswordComponent } from './core/components/auth/new-password/new-password.component';
import { SignupComponent } from './core/components/auth/signup/signup.component';
import { ProfileAccountComponent } from './core/components/auth/profile-account/profile-account.component';
export const routes: Routes = [
      { path: '', redirectTo: '/signin', pathMatch: 'full' },
      {path:'signin', component:SigninComponent},
      {path:'forget-password', component:ForgetPasswordComponent},
      {path:'new-password', component:NewPasswordComponent},
      {path:'signup', component:SignupComponent},
      {path:'profile-account', component:ProfileAccountComponent},

];
    
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
=======
import { Routes } from '@angular/router';

export const routes: Routes = [];
>>>>>>> 762c4c4769f95ce6c5c401bc650818b17f94d6d6
