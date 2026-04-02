import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginResponse, User } from '../../../../service/auth.service';


@Component({
  selector: 'app-profile-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-account.component.html',
  styleUrl: './profile-account.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfileAccountComponent {

  // ── بيانات الصورة ──────────────────────────────────────────
  profileImageUrl: string = 'https://ui-avatars.com/api/?name=User&background=E6F0FF&color=2D5BFF';
  selectedFile: File | null = null;
  hasCustomImage: boolean = false;

  // ── بيانات الـ Form ─────────────────────────────────────────
  hourlyFee: number | null = null;
  gender: string = '';
  description: string = '';

  // ── حالة الـ Loading والـ Error ─────────────────────────────
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  router: any;

  constructor(private authService: AuthService) {}

  // ── اختيار الصورة ───────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB. Please choose a smaller image.');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, GIF, or PNG files are allowed.');
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.profileImageUrl = e.target?.result as string;
        this.hasCustomImage = true;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('profilePhotoInput') as HTMLInputElement;
    fileInput?.click();
  }

  clearImage(): void {
    this.profileImageUrl = 'https://ui-avatars.com/api/?name=User&background=E6F0FF&color=2D5BFF';
    this.selectedFile = null;
    this.hasCustomImage = false;
    const fileInput = document.getElementById('profilePhotoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // ── Submit الـ Form ─────────────────────────────────────────
  onSubmit(): void {
    // Validation بسيط
    if (!this.hourlyFee || !this.gender || !this.description.trim()) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // تجميع الداتا في FormData عشان نبعت الصورة مع باقي البيانات
    const formData = new FormData();
    formData.append('hourly_fee', this.hourlyFee.toString());
    formData.append('gender', this.gender);
    formData.append('description', this.description);

    if (this.selectedFile) {
      formData.append('profile_image', this.selectedFile);
    }

    // استخدام الـ token من الـ AuthService
    const token = this.authService.getToken();

    // بعت الداتا للسيرفر
    fetch('http://localhost:8000/api/profile/update', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // ملاحظة: متضيفش Content-Type لأن FormData بتحدده أوتوماتيك
      },
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Server error: ' + res.status);
        return res.json();
      })
      .then((data) => {
        this.successMessage = 'Profile updated successfully!';
        console.log('Response:', data);
        // هنا تقدر تنقل للصفحة التالية لو حبيت
        this.router.navigate(['/signin']);
      })
      .catch((err) => {
        this.errorMessage = 'Something went wrong. Please try again.';
        console.error('Upload error:', err);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}