// ==========================================================
// 🟣 IMPORTS
// بنستورد Component عشان نعمل Angular Component
// بنستورد CUSTOM_ELEMENTS_SCHEMA عشان نسمح باستخدام عناصر مخصصة زي 3D أو spline
// FormBuilder → علشان نبني الفورم بسهولة
// FormGroup → بيمثل الفورم كلها
// ReactiveFormsModule → علشان الفورم تشتغل
// CommonModule → فيه directives زي *ngIf و *ngFor
// AuthService → السيرفيس اللي فيه login وبيتكلم مع الـ API
// Router → علشان ننتقل لصفحة تانية بعد النجاح
// ==========================================================
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../service/auth.service';
import { Router } from '@angular/router';

@Component({
  // الاسم اللي نستخدمه في HTML
  selector: 'app-signin',

  // standalone يعني مش محتاجة Module تقليدي
  standalone: true,

  // الحاجات اللي الكومبوننت محتاجاها علشان تشتغل
  imports: [CommonModule, ReactiveFormsModule],

  // ملف الـ HTML
  templateUrl: './signin.component.html',

  // علشان نستخدم عناصر مخصصة بدون Errors
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SigninComponent {

  // ==========================================================
  // 🟣 المتغيرات
  // form → بيمثل الفورم كله (email + password)
  // علامة ! معناها هنحط قيمة له بعدين في ngOnInit
  // robotMessage → لو هنخلي الروبوت يكتب كلام (حالياً مش مستخدم)
  // errorMessage → الرسالة اللي تظهر لو البيانات غلط
  // ==========================================================
  form!: FormGroup;
  robotMessage: string = '';
  errorMessage: string = '';

  // ==========================================================
  // 🟣 Constructor
  // بنعمل Injection للحاجات اللي هنستخدمها:
  // fb → علشان نعمل الفورم
  // authService → علشان نعمل login ونتكلم مع الـ API
  // router → علشان نغير الصفحة بعد النجاح
  // ==========================================================
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  // ==========================================================
  // 🟣 ngOnInit
  // بتشتغل أول ما الصفحة تفتح
  // هنا بننشئ الفورم ونعمل فيه email و password
  // الاتنين بيبدأوا بقيم فاضية
  // ==========================================================
  ngOnInit(): void {
    this.form = this.fb.group({
      email: [''],
      password: ['']
    });
  }

  // ==========================================================
  // 🟣 speak()
  // دالة الصوت
  // بتستخدم SpeechSynthesisUtterance علشان تخلي المتصفح ينطق الكلام
  // نحدد اللغة – السرعة – طبقة الصوت
  // وبعدين نقول للمتصفح ينطق الجملة
  // ==========================================================
  speak(message: string) {
    const speech = new SpeechSynthesisUtterance(message);

    // اللغة (لو عايزة عربي غيريها لـ ar-EG)
    speech.lang = 'en-US';

    // سرعة الكلام
    speech.rate = 1;

    // طبقة الصوت
    speech.pitch = 1;

    // تشغيل الصوت
    window.speechSynthesis.speak(speech);
  }

  // ==========================================================
  // 🟣 onSubmit()
  // دي بتشتغل لما المستخدم يضغط زرار Login
  // ==========================================================
  // ==========================================================
  // 🟣 onSubmit()
  // بتشتغل لما المستخدم يضغط Login
  // ==========================================================
  onSubmit(): void {

    // نجيب القيم اللي المستخدم كتبها
    const { email, password } = this.form.value;

    // نبعت البيانات للـ API عن طريق السيرفيس
    this.authService.login(email, password).subscribe({

      // ======================================================
      // ✅ لو تسجيل الدخول نجح
      // نحفظ التوكن
      // نجيب بيانات المستخدم
      // نخزن الـ role
      // نروح صفحة ProductApi
      // ======================================================
      next: (res: any) => {

        // مسح أي رسائل قديمة
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

          // (لو حابة تضيفي متغير userRole في الكلاس)
          // this.userRole = user.role;

        });

        // الانتقال لصفحة ProductApi
        this.router.navigate(['/welcome1']);
      },

      // ======================================================
      // ❌ لو حصل خطأ (بيانات غلط مثلاً)
      // نحط رسالة خطأ
      // ونخلي الروبوت يقولها بصوت
      // ======================================================
      error: (error) => {

        console.log(error);

        // رسالة الخطأ
        this.errorMessage = "Email or Password is invalid!";

        // رسالة الروبوت
        const msg = "Oops! Email or password is incorrect!";

        // تشغيل الصوت
        this.speak(msg);
      }

    });
  }
}