import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../../service/auth.service';

export type ConsultationType = 'online' | 'inperson';
export type BookingStep      = 1 | 2 | 3;
export type PaymentMethod    = 'card' | 'cash';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
})
export class BookingComponent implements OnInit, OnDestroy {

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // ── Doctor Data ──────────────────────────────────────────
  doctorId : number | null = null;
  doctor   : any           = null;

  get doctorName(): string {
    if (!this.doctor) return 'Doctor';
    if (this.doctor._normalizedName) return this.doctor._normalizedName;
    const u     = this.doctor.user || this.doctor;
    const first = u.first_name || '';
    const last  = u.last_name  || '';
    return `${first} ${last}`.trim() || 'Doctor';
  }

  get doctorSpecialty(): string {
    return this.doctor?.specialty || this.doctor?.specialization || 'Specialist';
  }

  get doctorBio(): string {
    return this.doctor?.about || this.doctor?.bio || this.doctor?.description || '';
  }

  get doctorFee(): number {
    return Number(this.doctor?.fee ?? this.doctor?.consultation_fee ?? 0);
  }

  get doctorAvatar(): string {
    const photo =
      this.doctor?._normalizedPhoto    ||
      this.doctor?.user?.profile_image ||
      this.doctor?.profile_image       ||
      this.doctor?.avatar              ||
      null;

    if (photo) return photo;
    const name   = encodeURIComponent(this.doctorName);
    const colors = ['0052FF','00D1B2','7C3AED','059669','D97706'];
    const bg     = colors[(this.doctor?.id || 1) % colors.length];
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=128&bold=true&rounded=true`;
  }

  get doctorAvailableDays(): string[] {
    const days = this.doctor?.available_days || '';
    if (!days) return [];
    return days.split(',').map((d: string) => d.trim()).filter(Boolean);
  }

  get doctorExperience(): number | null {
    return this.doctor?.experience_years ?? null;
  }

  // ── State Signals ────────────────────────────────────────
  currentStep         = signal<BookingStep>(1);
  selectedConsultType = signal<ConsultationType>('online');
  selectedSlot        = signal<string | null>(null);
  notes               = signal<string>('');
  attachedFile        = signal<File | null>(null);
  isDragOver          = signal<boolean>(false);

  // ── Payment Signals ──────────────────────────────────────
  paymentMethod    = signal<PaymentMethod>('cash');
  cardNumber       = signal<string>('');
  cardExpiry       = signal<string>('');
  cardCvv          = signal<string>('');
  cardName         = signal<string>('');
  bookingReference = signal<string>('');

  // ── Calendar Signals ─────────────────────────────────────
  today        = new Date();
  viewYear     = signal<number>(this.today.getFullYear());
  viewMonth    = signal<number>(this.today.getMonth());
  selectedDate = signal<Date | null>(new Date());

  // ── Static Data ──────────────────────────────────────────
  readonly DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  readonly MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  get consultOptions() {
    const fee = this.doctorFee;
    return [
      { id: 'online'   as ConsultationType, label: 'Online consultation', duration: '30 minutes', price: fee || 300 },
      { id: 'inperson' as ConsultationType, label: 'In-person visit',     duration: '45 minutes', price: fee ? Math.round(fee * 1.2) : 500 },
    ];
  }

  readonly timeSlots = [
    { time: '09:00', disabled: false },
    { time: '10:00', disabled: false },
    { time: '11:00', disabled: false },
    { time: '14:00', disabled: false },
    { time: '15:00', disabled: false },
    { time: '16:00', disabled: true  },
    { time: '17:00', disabled: false },
  ];

  // ── Computed ─────────────────────────────────────────────
  selectedConsultOption = computed(() =>
    this.consultOptions.find(o => o.id === this.selectedConsultType())!
  );

  calMonthTitle    = computed(() => `${this.MONTH_NAMES[this.viewMonth()]} ${this.viewYear()}`);
  attachedFileName = computed(() => this.attachedFile()?.name ?? null);
  showCardFields   = computed(() => this.paymentMethod() === 'card');

  summaryDate       = computed(() =>
    this.selectedDate()?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '—'
  );
  selectedDateLabel = computed(() =>
    this.selectedDate()?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) ?? 'Select a date'
  );
  summaryTime       = computed(() => this.selectedSlot() ?? '—');
  summaryType       = computed(() => this.selectedConsultOption()?.label ?? '—');
  summaryPrice      = computed(() => `${this.selectedConsultOption()?.price ?? 0} EGP`);
  confirmTimeLabel  = computed(() =>
    this.selectedSlot()
      ? `${this.selectedSlot()} — ${this.selectedConsultOption()?.duration} session`
      : '—'
  );

  calendarCells = computed(() => {
    const year        = this.viewYear();
    const month       = this.viewMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: any[] = [];

    for (let i = 0; i < firstDay; i++) cells.push({ day: null, state: 'empty' });
    for (let d = 1; d <= daysInMonth; d++) {
      const date       = new Date(year, month, d);
      const isPast     = date < new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
      const isSelected = this.selectedDate()?.toDateString() === date.toDateString();
      const isToday    = date.toDateString() === this.today.toDateString();
      cells.push({
        day  : d,
        state: isSelected ? 'selected' : isToday ? 'today' : isPast ? 'disabled' : 'available'
      });
    }
    return cells;
  });

  constructor(
    private route       : ActivatedRoute,
    private router      : Router,
    private http        : HttpClient,
    private authService : AuthService,
  ) {}

  // ── Init ─────────────────────────────────────────────────
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.doctorId = idParam ? Number(idParam) : null;

    if (this.doctorId) {
      this.fetchDoctorById(this.doctorId);
    } else {
      this.loadFromLocalStorage();
    }
  }

  ngOnDestroy(): void {}

  // ── Doctor Loading ────────────────────────────────────────
  private fetchDoctorById(id: number): void {
    const stored   = this.loadFromLocalStorage();
    const storedId = stored?.id || stored?.user_id;

    if (stored && String(storedId) === String(id)) {
      console.log('[Booking] Doctor loaded from localStorage ✅');
      return;
    }

    const token = this.authService.getToken();
    this.http.get<any>(`http://localhost:8000/api/doctors/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next : (res) => {
        console.log('[Booking] Doctor from API:', res);
        this.doctor = res.data || res.doctor || res;
      },
      error: (err) => {
        console.warn('[Booking] API failed, using localStorage fallback', err);
        this.loadFromLocalStorage();
      }
    });
  }

  private loadFromLocalStorage(): any {
    try {
      const stored = localStorage.getItem('selectedDoctor');
      if (stored) {
        this.doctor = JSON.parse(stored);
        console.log('[Booking] Doctor from localStorage:', this.doctor);
        return this.doctor;
      }
    } catch {
      console.error('[Booking] Failed to parse selectedDoctor');
    }
    return null;
  }

  // ── Navigation ────────────────────────────────────────────
  nextStep(): void {
    if (this.currentStep() === 1) {
      if (!this.selectedDate() || !this.selectedSlot()) {
        
      }

      const bookingData = {
        doctorId        : this.doctorId,
        doctor          : this.doctor,
        date            : this.selectedDate()?.toISOString(),
        slot            : this.selectedSlot(),
        consultType     : this.selectedConsultType(),
        notes           : this.notes(),
        summaryDate     : this.summaryDate(),
        summaryTime     : this.summaryTime(),
        summaryType     : this.summaryType(),
        summaryPrice    : this.summaryPrice(),
        doctorName      : this.doctorName,
        doctorSpecialty : this.doctorSpecialty,
      };
      localStorage.setItem('bookingData', JSON.stringify(bookingData));
      this.router.navigate(['/doctors-follow-request']);
    }
    window.scrollTo(0, 0);
  }

  prevStep(): void {
    if (this.currentStep() > 1)
      this.currentStep.set((this.currentStep() - 1) as BookingStep);
  }

  // ── Calendar ──────────────────────────────────────────────
  selectDay(day: number | null, state: string): void {
    if (day && state !== 'disabled' && state !== 'empty') {
      this.selectedDate.set(new Date(this.viewYear(), this.viewMonth(), day));
      this.selectedSlot.set(null);
    }
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) { this.viewMonth.set(11); this.viewYear.update(y => y - 1); }
    else { this.viewMonth.update(m => m - 1); }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) { this.viewMonth.set(0); this.viewYear.update(y => y + 1); }
    else { this.viewMonth.update(m => m + 1); }
  }

  goToToday(): void {
    this.viewMonth.set(this.today.getMonth());
    this.viewYear.set(this.today.getFullYear());
    this.selectedDate.set(new Date(this.today));
  }

  // ── Slot & Payment ────────────────────────────────────────
  selectSlot(slot: any): void {
    if (!slot.disabled) this.selectedSlot.set(slot.time);
  }

  setPaymentMethod(m: PaymentMethod): void { this.paymentMethod.set(m); }

  // ── File ──────────────────────────────────────────────────
  triggerFileInput(): void  { this.fileInputRef.nativeElement.click(); }
  onFileSelected(e: any):void { const file = e.target.files[0]; if (file) this.attachedFile.set(file); }
  removeFile(): void        { this.attachedFile.set(null); }

  // ── Card Formatting ───────────────────────────────────────
  formatCardNumber(e: any): void {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    this.cardNumber.set(val.match(/.{1,4}/g)?.join(' ') ?? val);
  }

  formatExpiry(e: any): void {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    this.cardExpiry.set(val.length >= 2 ? val.substring(0, 2) + ' / ' + val.substring(2) : val);
  }

  // ── Helpers ───────────────────────────────────────────────
  isStepActive(s: number): boolean { return this.currentStep() === s; }
  isStepDone(s: number):   boolean { return this.currentStep() > s;  }

  reschedule():        void { this.currentStep.set(1); }
  cancelAppointment(): void { if (confirm('Cancel?')) this.currentStep.set(1); }
  addToCalendar():     void { alert('Added to Google Calendar'); }
  contactSupport():    void { alert('Support contacted'); }
}