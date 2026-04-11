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

  accountForm: FormGroup;
  passwordForm: FormGroup;

  isLoading = false;
  isSaving = false;
  isSavingPassword = false;
  successMessage = '';
  errorMessage = '';
  passwordSuccess = '';
  passwordError = '';
  profileImageUrl: string = '';

  activeTab: 'personal' | 'security' | 'notifications' | 'medical' = 'personal';

  conditions = {
    diabetes: false,
    hypertension: false,
    cancer: false,
  };

  customConditions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.accountForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      country: ['Egypt', Validators.required],
      age: [''],
      gender: [''],
      description: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/signin']);
      return;
    }

    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;

    this.authService.getProfile().subscribe({
      next: (res: any) => {
        this.zone.run(() => {
          console.log('PROFILE RESPONSE:', res);

          const user = res.user || res;
          const roleProfile = res.role_profile || res.roleProfile || {};

          const medicalHistory =
            roleProfile.medical_history ||
            user.medical_history ||
            '';

          this.accountForm.patchValue({
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            country: user.country || 'Egypt',
            age: roleProfile.age || user.age || '',
            gender: roleProfile.gender || user.gender || '',
            description: roleProfile.about || user.about || '',
          });

          const conditionsArray = medicalHistory
            ? medicalHistory
                .split(',')
                .map((c: string) => c.trim())
                .filter((c: string) => c.length > 0)
            : [];

          this.conditions = {
            diabetes: conditionsArray.some((c: string) => c.toLowerCase() === 'diabetes'),
            hypertension: conditionsArray.some((c: string) => c.toLowerCase() === 'hypertension'),
            cancer: conditionsArray.some((c: string) => c.toLowerCase() === 'cancer'),
          };

          this.customConditions = conditionsArray.filter((c: string) => {
            const lower = c.toLowerCase();
            return lower !== 'diabetes' && lower !== 'hypertension' && lower !== 'cancer';
          });

          const savedImage = localStorage.getItem('profileImage');
          this.profileImageUrl =
            savedImage ||
            roleProfile.profile_image ||
            user.profile_image ||
            `https://ui-avatars.com/api/?name=${user.first_name || 'User'}+${user.last_name || ''}&background=E6F0FF&color=2D5BFF`;

          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Profile Error:', err.status, err.error);
          this.errorMessage = 'Failed to load profile. Please login again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  get selectedConditions(): string[] {
    const fixedConditions: string[] = [];
    if (this.conditions.diabetes) fixedConditions.push('Diabetes');
    if (this.conditions.hypertension) fixedConditions.push('Hypertension');
    if (this.conditions.cancer) fixedConditions.push('Cancer');
    return [...fixedConditions, ...this.customConditions];
  }

  get selectedConditionsText(): string {
    return this.selectedConditions.join(', ');
  }

  addCondition(event: Event): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (!value) return;

    const exists = this.selectedConditions.some(
      c => c.toLowerCase() === value.toLowerCase()
    );

    if (!exists) {
      this.customConditions.push(value);
    }
    input.value = '';
  }

  removeCondition(condition: string): void {
    const lower = condition.toLowerCase();
    if (lower === 'diabetes') { this.conditions.diabetes = false; return; }
    if (lower === 'hypertension') { this.conditions.hypertension = false; return; }
    if (lower === 'cancer') { this.conditions.cancer = false; return; }
    this.customConditions = this.customConditions.filter(c => c.toLowerCase() !== lower);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB.');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, or GIF files are allowed.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const base64 = e.target?.result as string;
        this.profileImageUrl = base64;
        localStorage.setItem('profileImage', base64);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('profilePhotoInput') as HTMLInputElement;
    fileInput?.click();
  }

  clearImage(): void {
    localStorage.removeItem('profileImage');
    const firstName = this.accountForm.get('firstName')?.value || 'User';
    const lastName = this.accountForm.get('lastName')?.value || '';
    this.profileImageUrl =
      `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=E6F0FF&color=2D5BFF`;
    this.cdr.detectChanges();
  }

  onSave(): void {
    console.log('onSave called!');
    console.log('form valid:', this.accountForm.valid);
    console.log('form values:', this.accountForm.value);

    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const token = this.authService.getToken();
    const v = this.accountForm.value;

    const body = {
      first_name: v.firstName || '',
      last_name: v.lastName || '',
      phone: v.phone || '',
      address: v.address || '',
      age: v.age ? Number(v.age) : null,
      gender: v.gender || '',
      medical_history: this.selectedConditionsText || '',
    };

    console.log('BODY SENT:', body);

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
        const data = await res.json();
        if (!res.ok) {
          console.error('PROFILE SAVE ERROR:', data);
          throw new Error(data.message || 'Server error: ' + res.status);
        }
        return data;
      })
      .then((data) => {
        console.log('PROFILE SAVE RESPONSE:', data);
        this.zone.run(() => {
          this.successMessage = '✅ Profile saved successfully!';
          this.isSaving = false;
          this.loadProfile();
          this.cdr.detectChanges();
        });
      })
      .catch(err => {
        this.zone.run(() => {
          console.error(err);
          this.errorMessage = '❌ Failed to save. Please try again.';
          this.isSaving = false;
          this.cdr.detectChanges();
        });
      });
  }

  // ✅ التعديل الوحيد - بنستخدم authService.changePassword
  onSavePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.passwordError = 'Please fill in all password fields.';
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.passwordError = 'Passwords do not match.';
      return;
    }

    this.isSavingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: (data) => {
        this.zone.run(() => {
          console.log('PASSWORD UPDATE RESPONSE:', data);
          this.passwordSuccess = '✅ Password updated successfully!';
          this.isSavingPassword = false;
          this.passwordForm.reset();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('PASSWORD UPDATE ERROR:', err);
          this.passwordError = `❌ ${err?.error?.message || 'Failed to update password. Please try again.'}`;
          this.isSavingPassword = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onForgotPassword(): void {
    alert('A password reset link will be sent to: ' + this.accountForm.value.email);
  }

  setTab(tab: 'personal' | 'security' | 'notifications' | 'medical'): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';
  }

  get firstInitial(): string {
    return this.accountForm.get('firstName')?.value?.charAt(0)?.toUpperCase() || 'U';
  }

  get fullName(): string {
    const f = this.accountForm.get('firstName')?.value || '';
    const l = this.accountForm.get('lastName')?.value || '';
    return `${f} ${l}`.trim() || 'User';
  }
}