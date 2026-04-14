import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../service/auth.service';

@Component({
  selector: 'app-signup2',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup2.component.html',
  styleUrl: './signup2.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Signup2Component implements OnInit {

  userRole: 'patient' | 'doctor' = 'patient';

  profileImageUrl: string = 'https://ui-avatars.com/api/?name=User&background=E6F0FF&color=2D5BFF';
  selectedFile: File | null = null;
  hasCustomImage: boolean = false;
  gender: string = '';
  description: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Patient
  age: number | null = null;
  address: string = '';
  conditions = { diabetes: false, hypertension: false, cancer: false };

  // Doctor
  specialization: string = '';
  yearsOfExperience: number | null = null;
  consultationFee: number | null = null;
  clinicAddress: string = '';
  availableDays: string[] = [];

  readonly dayOptions = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  readonly specializationOptions = [
    'General Practice', 'Cardiology', 'Endocrinology', 'Neurology',
    'Oncology', 'Psychiatry', 'Radiology', 'Surgery'
  ];

  constructor(private authService: AuthService, private router: Router) {}

ngOnInit(): void {
  const fromService = (this.authService as any).getUserRole?.();
  const fromStorage = localStorage.getItem('userRole');
  const fromRole    = localStorage.getItem('role');

  const raw = fromService ?? fromStorage ?? fromRole ?? '';

  this.userRole = raw.toLowerCase().includes('doctor') ? 'doctor' : 'patient';

  // 🔥 FIX: خزّن profile data
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!user.id) {
    console.warn('No user id found!');
  }

  localStorage.setItem('profile_completed', 'true');
}

  private tryGetRoleFromUserObject(): string {
    try {
      for (const key of ['user','userData','authUser','currentUser']) {
        const str = localStorage.getItem(key);
        if (str) {
          const obj = JSON.parse(str);
          const role = obj?.role ?? obj?.type ?? obj?.user_type ?? '';
          if (role) return role;
        }
      }
      return '';
    } catch { return ''; }
  }

  get isDoctor():  boolean { return this.userRole === 'doctor';  }
  get isPatient(): boolean { return this.userRole === 'patient'; }

  // ── Image ───────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) { alert('File size exceeds 2MB.'); return; }
    const allowed = ['image/jpeg','image/png','image/gif','image/jpg'];
    if (!allowed.includes(file.type)) { alert('Only JPG, PNG, or GIF.'); return; }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      this.profileImageUrl = b64;
      this.hasCustomImage = true;
      localStorage.setItem('profileImage', b64);
    };
    reader.readAsDataURL(file);
  }

  triggerFileInput(): void {
    (document.getElementById('profilePhotoInput') as HTMLInputElement)?.click();
  }

  clearImage(): void {
    this.profileImageUrl = 'https://ui-avatars.com/api/?name=User&background=E6F0FF&color=2D5BFF';
    this.selectedFile = null;
    this.hasCustomImage = false;
    localStorage.removeItem('profileImage');
    const fi = document.getElementById('profilePhotoInput') as HTMLInputElement;
    if (fi) fi.value = '';
  }

  // ── Patient helpers ──────────────────────────────────────
  get selectedConditionsArray(): string[] {
    return Object.entries(this.conditions).filter(([,v]) => v).map(([k]) => k);
  }
  get selectedConditionsText(): string {
    return this.selectedConditionsArray.join(', ') || 'Select all that apply';
  }

  // ── Doctor helpers ───────────────────────────────────────
  toggleDay(day: string): void {
    const i = this.availableDays.indexOf(day);
    i === -1 ? this.availableDays.push(day) : this.availableDays.splice(i, 1);
  }
  isDaySelected(day: string): boolean { return this.availableDays.includes(day); }

  goBack(): void { this.router.navigate(['/signup']); }

  // ── Submit ───────────────────────────────────────────────
  onSubmit(): void {
    console.log('[Signup2] onSubmit called!');
    console.log('[Signup2] Current values:', {
      gender:            this.gender,
      description:       this.description,
      isDoctor:          this.isDoctor,
      // Doctor fields
      specialization:    this.specialization,
      yearsOfExperience: this.yearsOfExperience,
      consultationFee:   this.consultationFee,
      clinicAddress:     this.clinicAddress,
      // Patient fields
      age:               this.age,
      address:           this.address,
    });

    // ── Validation مع رسالة تفصيلية ──────────────────────
    const missing: string[] = [];

    if (!this.gender)           missing.push('Gender');
    if (!this.description.trim()) missing.push('Bio / Description');

    if (this.isDoctor) {
      if (!this.specialization)          missing.push('Specialization');
      if (!this.yearsOfExperience)       missing.push('Years of Experience');
      if (!this.consultationFee)         missing.push('Consultation Fee');
      if (!this.clinicAddress.trim())    missing.push('Clinic Address');
    } else {
      if (!this.age)                     missing.push('Age');
      if (!this.address.trim())          missing.push('Address');
    }

    if (missing.length > 0) {
      this.errorMessage = 'Missing required fields: ' + missing.join(', ');
      console.warn('[Signup2] Validation failed. Missing:', missing);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const token = this.authService.getToken();
    const body  = this.isDoctor ? this.buildDoctorBody() : this.buildPatientBody();

    console.log('[Signup2] BODY SENT:', JSON.stringify(body, null, 2));

    fetch('http://localhost:8000/api/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const d = await res.json();
        console.log('[Signup2] RESPONSE STATUS:', res.status);
        console.log('[Signup2] RESPONSE BODY:', JSON.stringify(d, null, 2));
        if (!res.ok) throw new Error(d.message || JSON.stringify(d.errors) || 'Unknown error');
        return d;
      })
      .then(() => {
        this.successMessage = 'Profile updated successfully!';
        setTimeout(() => this.router.navigate(['/signin']), 1500);
      })
      .catch((err) => {
        this.errorMessage = 'Error: ' + err.message;
        console.error('[Signup2] ERROR:', err);
      })
      .finally(() => { this.isLoading = false; });
  }

  private buildPatientBody() {
    return {
      gender:          this.gender,
      about:           this.description,
      medical_history: this.selectedConditionsArray.join(', '),
      age:             this.age,
      address:         this.address,
    };
  }

  private buildDoctorBody() {
    return {
      gender:           this.gender,
      about:            this.description,
      // ✅ الأسماء الصح من الـ API response
      specialty:        this.specialization,
      experience_years: this.yearsOfExperience,
      fee:              this.consultationFee,
      address:          this.clinicAddress,       // clinic address → address
      available_days:   this.availableDays.join(', '),
    };
  }
}