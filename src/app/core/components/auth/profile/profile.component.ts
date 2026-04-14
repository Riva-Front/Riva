import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../service/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {

  // ── Role ────────────────────────────────────────────────
  userRole: 'patient' | 'doctor' = 'patient';
  get isDoctor():  boolean { return this.userRole === 'doctor';  }
  get isPatient(): boolean { return this.userRole === 'patient'; }

  // ── Forms ────────────────────────────────────────────────
  accountForm:  FormGroup;
  passwordForm: FormGroup;

  // ── State ────────────────────────────────────────────────
  isLoading        = false;
  isSaving         = false;
  isSavingPassword = false;
  successMessage   = '';
  errorMessage     = '';
  passwordSuccess  = '';
  passwordError    = '';
  profileImageUrl  = '';

  activeTab: 'personal' | 'medical' = 'personal';

  // ── Patient fields ───────────────────────────────────────
  conditions = { diabetes: false, hypertension: false, cancer: false };
  customConditions: string[] = [];

  // ── Doctor fields ────────────────────────────────────────
  specialization    = '';
  yearsOfExperience : number | null = null;
  consultationFee   : number | null = null;
  clinicAddress     = '';
  availableDays     : string[] = [];

  readonly dayOptions = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  readonly specializationOptions = [
    'General Practice','Cardiology','Dermatology','Endocrinology',
    'Gastroenterology','Neurology','Oncology','Orthopedics',
    'Pediatrics','Psychiatry','Radiology','Surgery','Urology'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.accountForm = this.fb.group({
      firstName:   ['', Validators.required],
      lastName:    ['', Validators.required],
      email:       ['', [Validators.required, Validators.email]],
      phone:       [''],
      address:     [''],
      country:     ['Egypt', Validators.required],
      age:         [''],
      gender:      [''],
      description: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.authService.isAuthenticated()) { this.router.navigate(['/signin']); return; }
    this.resolveRole();
    this.loadProfile();
  }

  // ── Role detection ────────────────────────────────────────
  private resolveRole(): void {
    const raw = localStorage.getItem('role') ?? '';
    this.userRole = raw.toString().toLowerCase().includes('doctor') ? 'doctor' : 'patient';
    console.log('[Profile] userRole:', this.userRole);
  }

  // ── Load ─────────────────────────────────────────────────
  loadProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (res: any) => {
        this.zone.run(() => {
          console.log('=== PROFILE RAW RESPONSE ===', JSON.stringify(res, null, 2));

          const user        = res.user || res;
          const roleProfile = res.role_profile || res.roleProfile || res.doctor || res.patient || res.profile || res.data || {};

          // Override role from API
          const roleFromApi = res.role ?? user.role ?? user.type ?? '';
          if (roleFromApi) {
            this.userRole = roleFromApi.toString().toLowerCase().includes('doctor') ? 'doctor' : 'patient';
          }

          this.accountForm.patchValue({
            firstName:   user.first_name                    || '',
            lastName:    user.last_name                     || '',
            email:       user.email                         || '',
            phone:       user.phone                         || '',
            address:     roleProfile.address || user.address || '',
            country:     user.country                       || 'Egypt',
            age:         roleProfile.age     || user.age     || '',
            gender:      roleProfile.gender  || user.gender  || '',
            description: roleProfile.about   || user.about   || '',
          });

          if (this.isPatient) this.loadPatientFields(roleProfile, user);
          else                this.loadDoctorFields(roleProfile, user);

          const savedImage = localStorage.getItem('profileImage');
          this.profileImageUrl =
            savedImage ||
            roleProfile.profile_image ||
            user.profile_image ||
            `https://ui-avatars.com/api/?name=${user.first_name||'User'}+${user.last_name||''}&background=E6F0FF&color=2D5BFF`;

          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.errorMessage = 'Failed to load profile. Please login again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private loadPatientFields(roleProfile: any, user: any): void {
    const med = roleProfile.medical_history || user.medical_history || '';
    const arr = med ? med.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
    this.conditions = {
      diabetes:     arr.some((c: string) => c.toLowerCase() === 'diabetes'),
      hypertension: arr.some((c: string) => c.toLowerCase() === 'hypertension'),
      cancer:       arr.some((c: string) => c.toLowerCase() === 'cancer'),
    };
    this.customConditions = arr.filter((c: string) => {
      const l = c.toLowerCase();
      return l !== 'diabetes' && l !== 'hypertension' && l !== 'cancer';
    });
  }

  private loadDoctorFields(roleProfile: any, user: any): void {
    this.specialization    = roleProfile.specialty       || user.specialty       || '';
    this.yearsOfExperience = roleProfile.experience_years || user.experience_years || null;
    this.consultationFee   = roleProfile.fee              || user.fee              || null;
    this.clinicAddress     = roleProfile.clinic_address   || user.address          || '';
    const days = roleProfile.available_days || user.available_days || '';
    this.availableDays = days ? days.split(',').map((d: string) => d.trim()).filter(Boolean) : [];
  }

  // ── Patient helpers ───────────────────────────────────────
  get selectedConditions(): string[] {
    const fixed: string[] = [];
    if (this.conditions.diabetes)     fixed.push('Diabetes');
    if (this.conditions.hypertension) fixed.push('Hypertension');
    if (this.conditions.cancer)       fixed.push('Cancer');
    return [...fixed, ...this.customConditions];
  }

  get selectedConditionsText(): string { return this.selectedConditions.join(', '); }

  addCondition(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (!value) return;
    if (!this.selectedConditions.some(c => c.toLowerCase() === value.toLowerCase()))
      this.customConditions.push(value);
    input.value = '';
  }

  removeCondition(condition: string): void {
    const l = condition.toLowerCase();
    if (l === 'diabetes')     { this.conditions.diabetes     = false; return; }
    if (l === 'hypertension') { this.conditions.hypertension = false; return; }
    if (l === 'cancer')       { this.conditions.cancer       = false; return; }
    this.customConditions = this.customConditions.filter(c => c.toLowerCase() !== l);
  }

  // ── Doctor helpers ────────────────────────────────────────
  toggleDay(day: string): void {
    const i = this.availableDays.indexOf(day);
    i === -1 ? this.availableDays.push(day) : this.availableDays.splice(i, 1);
  }
  isDaySelected(day: string): boolean { return this.availableDays.includes(day); }

  // ── Image ─────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) { alert('File size exceeds 2MB.'); return; }
    if (!['image/jpeg','image/png','image/gif','image/jpg'].includes(file.type)) { alert('Only JPG, PNG, or GIF.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      this.profileImageUrl = b64;
      localStorage.setItem('profileImage', b64);
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  triggerFileInput(): void {
    (document.getElementById('profilePhotoInput') as HTMLInputElement)?.click();
  }

  clearImage(): void {
    localStorage.removeItem('profileImage');
    const f = this.accountForm.get('firstName')?.value || 'User';
    const l = this.accountForm.get('lastName')?.value  || '';
    this.profileImageUrl = `https://ui-avatars.com/api/?name=${f}+${l}&background=E6F0FF&color=2D5BFF`;
    this.cdr.detectChanges();
  }

  // ── Save Profile ──────────────────────────────────────────
  onSave(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isSaving      = true;
    this.errorMessage  = '';
    this.successMessage = '';

    const token = this.authService.getToken();
    const v     = this.accountForm.value;

    const body = this.isDoctor
      ? {
          first_name:       v.firstName   || '',
          last_name:        v.lastName    || '',
          phone:            v.phone       || '',
          gender:           v.gender      || '',
          about:            v.description || '',
          specialty:        this.specialization,
          experience_years: this.yearsOfExperience,
          fee:              this.consultationFee,
          address:          this.clinicAddress,
          available_days:   this.availableDays.join(', '),
        }
      : {
          first_name:      v.firstName   || '',
          last_name:       v.lastName    || '',
          phone:           v.phone       || '',
          address:         v.address     || '',
          age:             v.age ? Number(v.age) : null,
          gender:          v.gender      || '',
          about:           v.description || '',
          medical_history: this.selectedConditionsText || '',
        };

    console.log('[Profile] BODY SENT:', JSON.stringify(body, null, 2));

    fetch('http://localhost:8000/api/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(async res => {
        const d = await res.json();
        console.log('[Profile] SAVE RESPONSE:', JSON.stringify(d, null, 2));
        if (!res.ok) throw new Error(d.message);
        return d;
      })
      .then(() => {
        this.zone.run(() => {
          this.successMessage = '✅ Profile saved successfully!';
          this.isSaving = false;
          this.loadProfile();
          this.cdr.detectChanges();
        });
      })
      .catch(() => {
        this.zone.run(() => {
          this.errorMessage = '❌ Failed to save. Please try again.';
          this.isSaving = false;
          this.cdr.detectChanges();
        });
      });
  }

  // ── Misc ──────────────────────────────────────────────────
  setTab(tab: 'personal' | 'medical'): void {
    this.activeTab      = tab;
    this.successMessage = '';
    this.errorMessage   = '';
  }

  get firstInitial(): string { return this.accountForm.get('firstName')?.value?.charAt(0)?.toUpperCase() || 'U'; }
  get fullName(): string {
    const f = this.accountForm.get('firstName')?.value || '';
    const l = this.accountForm.get('lastName')?.value  || '';
    return `${f} ${l}`.trim() || 'User';
  }
}