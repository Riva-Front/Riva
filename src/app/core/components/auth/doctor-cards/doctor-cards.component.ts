import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-doctor-cards',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './doctor-cards.component.html',
  styleUrls: ['./doctor-cards.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DoctorCardsComponent implements OnInit {

  isLoading = true;
  errorMessage = '';
  doctors: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<any>('http://localhost:8000/api/doctors').subscribe({
      next: (data) => {
        console.log('API Response:', data);
        const doctorsArray = Array.isArray(data)
          ? data
          : data?.data || data?.doctors || [];
        this.doctors = doctorsArray.map((d: any) => this.normalizeDoctor(d));
        // ── DEBUG: شوف structure أول دكتور ──
        if (doctorsArray.length > 0) {
          console.log('=== FIRST DOCTOR RAW ===', JSON.stringify(doctorsArray[0], null, 2));
          console.log('=== FIRST DOCTOR NORMALIZED ===', JSON.stringify(this.doctors[0], null, 2));
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load doctors';
        this.isLoading = false;
      }
    });
  }

  normalizeDoctor(d: any): any {
    // ── اسم الدكتور ──────────────────────────────────────
    const firstName = d.user?.first_name || d.first_name || '';
    const lastName  = d.user?.last_name  || d.last_name  || '';
    const name      = d.user?.name || d.name || d.full_name
      || `${firstName} ${lastName}`.trim()
      || '';

    // ── صورة الدكتور: من الـ API فقط، مش localStorage ──
    // بنجرب كل الأماكن الممكنة في الـ response
    const photo =
      d.user?.profile_image   ||   // users.profile_image
      d.user?.avatar          ||   // users.avatar
      d.profile_image         ||   // role_profile.profile_image
      d.avatar                ||   // role_profile.avatar
      d.photo                 ||
      d.image                 ||
      null;                        // null → هنعمل avatar بالاسم

    return {
      ...d,
      _normalizedName:  name,
      _normalizedPhoto: photo,
      specialty: d.specialty || d.specialization || 'General',
      bio: d.about || d.description || d.bio || d.notes || 'No description available',
    };
  }

  getDoctorName(d: any): string {
    return d._normalizedName?.trim() || 'Unknown Doctor';
  }

  getAvatarUrl(d: any): string {
    // لو الـ API بيرجع صورة حقيقية استخدمها
    const photo =
      d._normalizedPhoto            ||
      d.user?.profile_image         ||
      d.user?.image                 ||
      d.user?.avatar                ||
      d.profile_image               ||
      null;

    if (photo) return photo;

    // الـ backend مش بيحفظ صور → نولد avatar بالاسم
    const name    = encodeURIComponent(this.getDoctorName(d) || 'Doctor');
    // كل دكتور بلون مختلف بناءً على الـ id
    const colors  = ['0052FF','00D1B2','7C3AED','DC2626','059669','D97706','0891B2'];
    const bg      = colors[(d.id || 1) % colors.length];
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=128&bold=true&rounded=true`;
  }

  getSpecialty(d: any): string {
    return d.specialty || 'General';
  }

  getBio(d: any): string {
    return d.bio || '';
  }

  getRating(doctor: any): string | null {
    const rating = Number(doctor?.rating);
    if (!rating || isNaN(rating)) return null;
    return rating.toFixed(1);
  }

  selectDoctor(doctor: any): void {
    // حفظ الداتا في localStorage
    localStorage.setItem('selectedDoctor', JSON.stringify(doctor));
    // navigate لـ profile-d أولاً
    const id = doctor.id || doctor.user_id;
    this.router.navigate(['/profile-d', id]);
  }
}