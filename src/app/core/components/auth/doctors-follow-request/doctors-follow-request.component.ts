import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID, NgZone, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-doctors-follow-request',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './doctors-follow-request.component.html',
  styleUrl: './doctors-follow-request.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DoctorsFollowRequestComponent implements OnInit {

  // ── بيانات الكارت (بدون FormGroup عشان منتمعشش في validation) ──
  cardHolder = '';
  cardNumber = '';
  expiry     = '';
  cvc        = '';
  email      = '';
  address    = '';
  country    = 'Egypt';
  saveInfo   = true;

  countries = ['United States', 'Egypt', 'United Kingdom', 'Germany', 'Saudi Arabia', 'UAE'];

  isLoading      = false;
  successMessage = '';
  errorMessage   = '';

  // ── Doctor & Booking Data ─────────────────────────────────
  doctorId        = 0;
  doctorName      = '';
  doctorSpecialty = '';
  summaryDate     = '';
  summaryTime     = '';
  summaryType     = '';
  summaryPrice    = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.authService.isAuthenticated()) { this.router.navigate(['/signin']); return; }

    this.loadDoctorData();
    this.loadBookingData();

    console.log('[FollowRequest] ngOnInit done — doctorId:', this.doctorId, '| doctorName:', this.doctorName);
  }

  private loadDoctorData(): void {
    try {
      const raw = localStorage.getItem('selectedDoctor');
      console.log('[FollowRequest] selectedDoctor raw:', raw);
      if (raw) {
        const d = JSON.parse(raw);
        this.doctorId       = Number(d.id || d.user_id || 0);
        this.doctorName     = d._normalizedName
          || `${d.user?.first_name || ''} ${d.user?.last_name || ''}`.trim()
          || 'Doctor';
        this.doctorSpecialty = d.specialty || d.specialization || '';
      }
    } catch (e) { console.error('[FollowRequest] parse error:', e); }

    // fallback من الـ URL
    if (!this.doctorId) {
      const parts = window.location.pathname.split('/');
      const last  = Number(parts[parts.length - 1]);
      if (last) { this.doctorId = last; console.log('[FollowRequest] doctorId from URL:', last); }
    }
  }

  private loadBookingData(): void {
    try {
      const raw = localStorage.getItem('bookingData');
      if (!raw) return;
      const b = JSON.parse(raw);
      this.summaryDate     = b.summaryDate     || '';
      this.summaryTime     = b.summaryTime     || '';
      this.summaryType     = b.summaryType     || '';
      this.summaryPrice    = b.summaryPrice    || '';
      this.doctorName      = b.doctorName      || this.doctorName;
      this.doctorSpecialty = b.doctorSpecialty || this.doctorSpecialty;
      if (!this.doctorId && b.doctorId) this.doctorId = Number(b.doctorId);
    } catch (e) { console.error('[FollowRequest] bookingData parse error:', e); }
  }

  // ── Card Formatting ───────────────────────────────────────
  formatCardNumber(event: any): void {
    const v = event.target.value.replace(/\D/g, '').substring(0, 16);
    this.cardNumber = v.match(/.{1,4}/g)?.join(' ') || v;
    event.target.value = this.cardNumber;
  }

  formatExpiry(event: any): void {
    let v = event.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    this.expiry = v;
    event.target.value = v;
  }

  // ── Submit ────────────────────────────────────────────────
  onSubmit(): void {
    console.log('[FollowRequest] onSubmit called! doctorId:', this.doctorId);
    this.errorMessage = '';

    if (!this.doctorId) {
      this.errorMessage = 'Doctor not found. Please go back and select a doctor.';
      console.error('[FollowRequest] No doctorId!');
      return;
    }

    this.isLoading = true;
    const token    = this.authService.getToken();

    console.log(`[FollowRequest] POST → /api/doctors/${this.doctorId}/follow-request`);

    fetch(`http://localhost:8000/api/doctors/${this.doctorId}/follow-request`, {
      method: 'POST',
      headers: {
        Authorization : `Bearer ${token}`,
        Accept        : 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payment_method: 'card' }),
    })
      .then(async res => {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        console.log('[FollowRequest] Response:', res.status, data);
        if (!res.ok) throw new Error(data.message || 'Error: ' + res.status);
        return data;
      })
      .then(() => {
        this.zone.run(() => {
          this.successMessage = `✅ Follow request sent to Dr. ${this.doctorName}! Waiting for approval.`;
          this.isLoading      = false;
          localStorage.removeItem('bookingData');
          setTimeout(() => this.router.navigate(['/dashboard-p']), 1500);
        });
      })
      .catch(err => {
        this.zone.run(() => {
          console.error('[FollowRequest] Error:', err);
          this.errorMessage = '❌ ' + (err.message || 'Request failed. Please try again.');
          this.isLoading    = false;
        });
      });
  }
}