import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-patient-cards',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  templateUrl: './patient-cards.component.html',
  styleUrls: ['./patient-cards.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PatientCardsComponent implements OnInit {

  isLoading = true;
  errorMessage = '';
  patients: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;

    this.http.get<any>('http://localhost:8000/api/doctor-patients').subscribe({
      next: (data) => {
        console.log('API Response:', data);

        const arr = Array.isArray(data)
          ? data
          : data?.data || data?.patients || [];

        this.patients = arr.map((p: any) => this.normalizePatient(p));

        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load patients';
        this.isLoading = false;
      }
    });
  }

  // ================= NORMALIZE =================
  normalizePatient(p: any) {
    return {
      ...p,

      name:
        p.user?.name ||
        p.user?.first_name ||
        p.name ||
        '',

      photo:
        p.user?.profile_image ||
        p.user?.avatar ||
        p.photo ||
        p.image ||
        '',

      specialty:
        p.specialty ||
        'Patient',

      bio:
        p.about ||
        p.description ||
        p.bio ||
        'No description available',

      rating:
        Number(p.rating) || null
    };
  }

  // ================= HELPERS =================

  getName(p: any): string {
    return p.name || 'Unknown User';
  }

  getAvatar(p: any): string {
    const img =
      p.user?.profile_image ||
      p.user?.avatar ||
      p.photo ||
      p.image;

    return img || `https://ui-avatars.com/api/?name=${p.name || 'User'}`;
  }

  getSpecialty(p: any): string {
    return p.specialty || 'Patient';
  }

  getBio(p: any): string {
    return p.bio || '';
  }

  getRating(p: any): string | null {
    const r = Number(p.rating);
    if (!r || isNaN(r)) return null;
    return r.toFixed(1);
  }

  selectPatient(patient: any) {
    localStorage.setItem('selectedPatient', JSON.stringify(patient));
    this.router.navigate(['/chat']);
  }
}