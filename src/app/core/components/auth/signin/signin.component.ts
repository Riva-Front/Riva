import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signin.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SigninComponent implements OnInit {

  // ==========================================================
  // 🟣 VARIABLES
  form!: FormGroup;
  robotMessage: string = '';
  errorMessage: string = '';

  // ==========================================================
  // 🟣 Constructor
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  // ==========================================================
  // 🟣 ngOnInit
  ngOnInit(): void {
    this.form = this.fb.group({
      email: [''],
      password: ['']
    });

    // ✅ لو المستخدم already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard-p']);
    }
  }

  // ==========================================================
  // 🟣 speak()
  speak(message: string) {
    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = 'en-US';
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  }

  // ==========================================================
  // 🟣 onSubmit()
  onSubmit(): void {
    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      // ================= SUCCESS =================
      next: (res: any) => {
        this.errorMessage = '';
        this.robotMessage = '';

        // حفظ التوكن
        this.authService.saveToken(res);
        console.log('Login Response:', res);

        // نجيب بيانات المستخدم
        this.authService.getProfile().subscribe(user => {
          console.log('User Profile:', user);

          // تخزين نوع المستخدم
          localStorage.setItem('role', user.role);
          localStorage.setItem('hasLoggedBefore', 'true');

          // ✅ توجيه ذكي
          const firstLogin = !localStorage.getItem('hasLoggedBefore');
          if (firstLogin) {
            this.router.navigate(['/welcome1']);
          } else {
            this.router.navigate(['/dashboard-p']);
          }
        });
      },

      // ================= ERROR =================
      error: (error) => {
        console.log(error);
        this.errorMessage = "Email or Password is invalid!";
        this.speak("Oops! Email or password is incorrect!");
      }
    });
  }
}