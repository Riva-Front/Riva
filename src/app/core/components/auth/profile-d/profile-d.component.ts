import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../service/auth.service';

interface Review {
  id: number;
  patientName: string;
  patientAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

@Component({
  selector: 'app-profile-d',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile-d.component.html',
  styleUrl: './profile-d.component.css',
})
export class ProfileDComponent implements OnInit {

  // ── Doctor Data ───────────────────────
  doctorId: number | null = null;
  doctorName = '';
  doctorAvatar = '';
  doctorEmail = '';
  doctorPhone = '';
  specialty = '';
  experienceYears: number | null = null;
  fee: number | null = null;
  clinicAddress = '';
  availableDays: string[] = [];
  about = '';

  // ── UI State ─────────────────────────
  isLoading = true;
  isFollowing = false;
  isSubmittingReview = false;
  errorMessage = '';
  successMessage = '';

  // ── Reviews ──────────────────────────
  reviews: Review[] = [];
  averageRating = 0;
  totalReviews = 0;

  // ── Review Form ──────────────────────
  newRating = 0;
  newComment = '';
  hoveredStar = 0;

  readonly allDays = [
    'Monday','Tuesday','Wednesday',
    'Thursday','Friday','Saturday','Sunday'
  ];

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/signin']);
      return;
    }

    const idFromParams = this.route.snapshot.paramMap.get('id');
    const idFromState = history.state?.doctorId;

    this.doctorId =
      idFromParams ? Number(idFromParams)
      : idFromState || null;

    console.log('Doctor ID on init:', this.doctorId);

    this.loadDoctorProfile();
    this.loadReviews();
    this.checkFollowStatus();
  }

  // =====================================================
  // LOAD DOCTOR PROFILE
  // =====================================================
submitReview(): void {

  if (!this.doctorId) {
    this.errorMessage = 'Doctor not found.';
    return;
  }

  if (!this.newRating) {
    this.errorMessage = 'Please select a rating.';
    return;
  }

  if (!this.newComment.trim()) {
    this.errorMessage = 'Please write a comment.';
    return;
  }

  this.isSubmittingReview = true;
  this.errorMessage = '';
  this.successMessage = '';

  const token = this.authService.getToken();

  fetch(`http://localhost:8000/api/doctors/${this.doctorId}/reviews`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      rating: this.newRating,
      comment: this.newComment
    })
  })
  .then(async res => {
    const data = await res.json();

    if (!res.ok) throw data;

    return data;
  })
  .then(() => {

    this.zone.run(() => {

      this.successMessage = 'Review submitted successfully ✅';

      // reset form
      this.newRating = 0;
      this.newComment = '';

      // reload reviews
      this.loadReviews();

      this.isSubmittingReview = false;
      this.cdr.detectChanges();
    });
  })
  .catch(err => {

    this.zone.run(() => {

      console.error(err);

      this.errorMessage =
        err?.message ||
        'Failed to submit review.';

      this.isSubmittingReview = false;
      this.cdr.detectChanges();
    });
  });
}
  loadDoctorProfile(): void {

    this.isLoading = true;

    const token = this.authService.getToken();

    const url = this.doctorId
      ? `http://localhost:8000/api/doctors/${this.doctorId}`
      : `http://localhost:8000/api/doctors`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
    })
      .then(async res => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.message);
        return d;
      })
      .then((res: any) => {

        this.zone.run(() => {

          const raw = Array.isArray(res)
            ? res[0]
            : (res.data && Array.isArray(res.data))
              ? res.data[0]
              : res;

          // ⭐⭐⭐ FIX الرئيسي
          this.doctorId = raw.id || raw.user_id || this.doctorId;

          console.log('Doctor ID after API:', this.doctorId);

          const user = raw.user || {};

          this.doctorName =
            `${user.first_name || ''} ${user.last_name || ''}`.trim()
            || 'Doctor';

          this.doctorEmail = user.email || '';
          this.doctorPhone = user.phone || '';
          this.specialty = raw.specialty || '';
          this.experienceYears = raw.experience_years || null;
          this.fee = raw.fee || null;

          this.clinicAddress =
            raw.clinic_address ||
            raw.address ||
            user.address ||
            '';

          this.about = raw.about || '';

          const days = raw.available_days || '';

          this.availableDays = days
            ? days.split(',').map((d: string) => d.trim()).filter(Boolean)
            : [];

          this.doctorAvatar =
            user.profile_image ||
            `https://ui-avatars.com/api/?name=${this.doctorName}&background=E6F0FF&color=2D5BFF`;

          // نخزن الدكتور للـ booking fallback
          localStorage.setItem('selectedDoctor', JSON.stringify(raw));

          this.isLoading = false;
          this.cdr.detectChanges();
        });
      })
      .catch(err => {
        this.zone.run(() => {
          console.error(err);
          this.errorMessage = 'Failed to load doctor profile.';
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      });
  }

  // =====================================================
  // FOLLOW / BOOKING
  // =====================================================

  toggleFollow(): void {

    if (!this.doctorId) {
      console.error('Doctor ID missing ❌');
      return;
    }

    const followed: number[] =
      JSON.parse(localStorage.getItem('followedDoctors') || '[]');

    if (this.isFollowing) {

      const idx = followed.indexOf(this.doctorId);
      if (idx > -1) followed.splice(idx, 1);
      this.isFollowing = false;

    } else {

      followed.push(this.doctorId);
      this.isFollowing = true;

      console.log('Go booking with id:', this.doctorId);

      // ✅ NAVIGATION الصح
      this.router.navigate(
        ['/booking', this.doctorId],
        { state: { doctorId: this.doctorId } }
      );
    }

    localStorage.setItem('followedDoctors', JSON.stringify(followed));

    const token = this.authService.getToken();
    const method = this.isFollowing ? 'POST' : 'DELETE';

    fetch(`http://localhost:8000/api/doctors/${this.doctorId}/follow`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    }).catch(() => {});
  }

  // =====================================================
  // REVIEWS
  // =====================================================

  loadReviews(): void {
    if (!this.doctorId) return;

    const token = this.authService.getToken();

    fetch(`http://localhost:8000/api/doctors/${this.doctorId}/reviews`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
    })
      .then(async res => {
        const d = await res.json();
        if (!res.ok) throw d;
        return d;
      })
      .then((res: any) => {

        this.zone.run(() => {

          const list = res.reviews || res.data || res || [];

          this.reviews = list.map((r: any) => ({
            id: r.id,
            patientName:
              r.patient_name ||
              r.user?.first_name ||
              'Anonymous',

            patientAvatar:
              `https://ui-avatars.com/api/?name=${r.patient_name || 'P'}&background=F0F4FF&color=2D5BFF`,

            rating: r.rating || r.stars || 0,
            comment: r.comment || r.body || '',

            date: r.created_at
              ? new Date(r.created_at).toLocaleDateString('en-GB',{
                  day:'numeric',month:'short',year:'numeric'
                })
              : '',
          }));

          this.totalReviews = this.reviews.length;

          this.averageRating = this.totalReviews
            ? Math.round(
                (this.reviews.reduce((s,r)=>s+r.rating,0)
                / this.totalReviews) * 10
              ) / 10
            : 0;

          this.cdr.detectChanges();
        });
      })
      .catch(()=> this.reviews = []);
  }

  // =====================================================
  // HELPERS
  // =====================================================

  checkFollowStatus(): void {
    const followed =
      JSON.parse(localStorage.getItem('followedDoctors') || '[]');

    this.isFollowing =
      this.doctorId ? followed.includes(this.doctorId) : false;
  }

  setRating(star:number){ this.newRating = star; }
  hoverStar(star:number){ this.hoveredStar = star; }
  clearHover(){ this.hoveredStar = 0; }

  getStars(r:number):boolean[]{
    return Array.from({length:5},(_,i)=> i < Math.round(r));
  }

  isDayAvailable(day:string){
    return this.availableDays.includes(day);
  }

  goBack(){
    this.router.navigate(['/doctor-cards']);
  }
}