import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
export class SigninComponent {

  form!: FormGroup;
  robotMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: [''],
      password: ['']
    });
  }

  // ✨ كتابة حرف حرف
  typeMessage(message: string) {
    this.robotMessage = '';
    let i = 0;

    const typing = setInterval(() => {
      if (i < message.length) {
        this.robotMessage += message.charAt(i);
        i++;
      } else {
        clearInterval(typing);
      }
    }, 40);
  }

  // 🔊 صوت الروبوت
  speak(message: string) {
    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = 'en-US'; // غيريها لـ ar-EG لو عايزة عربي
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  }

  onSubmit(): void {

    if (this.form.invalid) {
      const msg = "Please enter email and password!";
      this.typeMessage(msg);
      this.speak(msg);
      return;
    }

    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({

      next: (res: any) => {
        this.robotMessage = '';
        this.errorMessage = '';
        this.router.navigate(['/ProductApi']);
      },

      error: () => {
        this.errorMessage = "Email or Password is invalid!";
        const msg = "Oops! Email or password is incorrect!";
        this.typeMessage(msg);
        this.speak(msg); // ✅ الصوت بيشتغل هنا
      }

    });
  }
}