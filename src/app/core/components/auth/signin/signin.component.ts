import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, LoginResponse } from '../../../../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signin.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SigninComponent implements OnInit {
  form!: FormGroup;
  robotMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  speak(message: string): void {
    if (
      typeof window === 'undefined' ||
      typeof window.speechSynthesis === 'undefined' ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return;
    }
    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = 'en-US';
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please enter a valid email and password';
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).subscribe({
      next: (res: LoginResponse) => {
        this.errorMessage = '';
        this.robotMessage = '';

        // ✅ حفظ الـ token بس وروح على طول
        this.authService.saveToken(res);
        this.router.navigate(['/welcome1']);
      },
      error: (error) => {
        console.log('Login Error:', error);

        if (error.status === 422) {
          this.errorMessage = error?.error?.message || 'Please enter valid login data.';
        } else if (error.status === 401) {
          this.errorMessage = 'Email or Password is invalid!';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server.';
        } else {
          this.errorMessage = error?.error?.message || 'Something went wrong';
        }

        this.speak(this.errorMessage);
      }
    });
  }
}