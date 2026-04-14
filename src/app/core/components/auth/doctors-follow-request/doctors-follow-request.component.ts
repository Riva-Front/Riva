import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject, PLATFORM_ID, NgZone, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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

  paymentForm: FormGroup;

  countries = ['United States', 'Egypt', 'United Kingdom', 'Germany', 'Saudi Arabia', 'UAE'];

  isLoading       = false;
  successMessage  = '';
  errorMessage    = '';

  // ── Booking Summary ──────────────────────────────────────
  doctorId        = 0;
  doctorName      = '';
  doctorSpecialty = '';
  summaryDate     = '';
  summaryTime     = '';
  summaryType     = '';
  summaryPrice    = '';

  constructor(
    private fb          : FormBuilder,
    private authService : AuthService,
    private router      : Router,
    private zone        : NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.paymentForm = this.fb.group({
      email      : ['', [Validators.required, Validators.email]],
      cardHolder : ['John Smith', Validators.required],
      cardNumber : ['', Validators.required],
      expiry     : ['', Validators.required],
      cvc        : ['', Validators.required],
      country    : ['Egypt'],
      address    : ['', Validators.required],
      saveInfo   : [true],
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/signin']);
      return;
    }

    // ── قراءة بيانات الدكتور ──
    try {
      const raw = localStorage.getItem('selectedDoctor');
      if (raw) {
        const d          = JSON.parse(raw);
        this.doctorId    = Number(d.id || d.user_id || 0);
        this.doctorName  = d._normalizedName
          || `${d.user?.first_name || ''} ${d.user?.last_name || ''}`.trim()
          || 'Doctor';
        this.doctorSpecialty = d.specialty || d.specialization || '';
      }
    } catch { console.error('[Payment] Failed to parse selectedDoctor'); }

    // ── قراءة بيانات الحجز ──
    try {
      const raw = localStorage.getItem('bookingData');
      if (raw) {
        const b              = JSON.parse(raw);
        this.summaryDate     = b.summaryDate     || '';
        this.summaryTime     = b.summaryTime     || '';
        this.summaryType     = b.summaryType     || '';
        this.summaryPrice    = b.summaryPrice    || '';
        this.doctorName      = b.doctorName      || this.doctorName;
        this.doctorSpecialty = b.doctorSpecialty || this.doctorSpecialty;
        if (!this.doctorId && b.doctorId) this.doctorId = Number(b.doctorId);
      }
    } catch { console.error('[Payment] Failed to parse bookingData'); }

    console.log('[Payment] doctorId:', this.doctorId);
  }

  // ── Card Formatting ──────────────────────────────────────
  formatCardNumber(event: any): void {
    const v         = event.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
    this.paymentForm.patchValue({ cardNumber: formatted });
  }

  formatExpiry(event: any): void {
    let v = event.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    this.paymentForm.patchValue({ expiry: v });
  }

  // ── Submit → Follow Request ───────────────────────────────
  onSubmit(): void {
    if (!this.doctorId) {
      this.errorMessage = 'Doctor not found. Please go back and select a doctor.';
      return;
    }

    this.isLoading      = true;
    this.errorMessage   = '';
    this.successMessage = '';

    const token = this.authService.getToken();

    console.log(`[Payment] POST → /api/doctors/${this.doctorId}/follow-request`);

    fetch(`http://localhost:8000/api/doctors/${this.doctorId}/follow-request`, {
      method : 'POST',
      headers: {
        Authorization : `Bearer ${token}`,
        Accept        : 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(async res => {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        console.log('[Payment] Response:', res.status, data);
        if (!res.ok) throw new Error(data.message || 'Error: ' + res.status);
        return data;
      })
      .then(() => {
        this.zone.run(() => {
          this.successMessage = `✅ Payment successful! You are now following Dr. ${this.doctorName}`;
          this.isLoading      = false;
          localStorage.removeItem('bookingData');
          setTimeout(() => this.router.navigate(['/dashboard-p']), 1500);
        });
      })
      .catch(err => {
        this.zone.run(() => {
          console.error('[Payment] Error:', err);
          this.errorMessage = '❌ ' + (err.message || 'Payment failed. Please try again.');
          this.isLoading    = false;
        });
      });
  }
}