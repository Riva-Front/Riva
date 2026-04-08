import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../service/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule,RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {

  accountForm: FormGroup;
  passwordForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.accountForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthdate: [''],
      email: ['', [Validators.required, Validators.email]],
      country: ['Egypt', Validators.required],
      phone: [''],
      address: ['', Validators.required]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // جيب البيانات من الـ API مباشرة
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.accountForm.patchValue({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || ''
        });
      },
      error: (err) => {
        console.error('Failed to load profile', err);
      }
    });
  }

  onSave() {
    if (this.accountForm.valid) {
      localStorage.setItem('userAccount', JSON.stringify(this.accountForm.value));
      alert('The data was successfully saved');
    } else {
      alert('Please make sure you fill in all the fields');
    }
  }

  onUpdate() {
    this.ngOnInit(); // يرجع يجيب البيانات من الـ API تاني
  }

  onSavePassword() {
    if (this.passwordForm.valid) {
      const passData = this.passwordForm.value;
      if (passData.newPassword !== passData.confirmPassword) {
        alert('The new password does not match');
        return;
      }
      localStorage.setItem('userPassword', JSON.stringify(passData));
      alert('The password has been changed');
      this.passwordForm.reset();
    } else {
      alert('Please fill in all password fields');
    }
  }

  onUpdatePassword() {
    const savedPass = localStorage.getItem('userPassword');
    if (savedPass) {
      const parsed = JSON.parse(savedPass);
      this.passwordForm.patchValue({ currentPassword: parsed.newPassword });
      alert('The current password has been recovered');
    } else {
      alert('No password saved');
    }
  }

  onForgotPassword() {
    alert('A password reset link will be sent to: ' + this.accountForm.value.email);
  }
}