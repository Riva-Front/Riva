import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface CalendarDay {
  number: number;
  date: Date;
  other: boolean;
  selected: boolean;
  isToday: boolean;
}

interface TimeSlot {
  time: string;
  disabled: boolean;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html', // سنضع الـ HTML في ملف منفصل أو هنا
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {

  currentStep: number = 1;
  notes: string = '';
  selectedTime: string = '';
  selectedDateLabel: string = '';

  dayNames: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  currentDate: Date = new Date(2025, 10, 1);
  selectedDay: number = 2;
  calendarDays: CalendarDay[] = [];
  currentMonthLabel: string = '';

  timeSlots: TimeSlot[] = [
    { time: '17:00', disabled: false },
    { time: '18:10', disabled: false },
    { time: '18:45', disabled: false },
    { time: '16:16', disabled: true },
    { time: '19:20', disabled: false },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.buildCalendar();
    this.updateDateLabel();
  }

  get currentMonthLabelGetter(): string {
    return this.monthNames[this.currentDate.getMonth()] + ' ' + this.currentDate.getFullYear();
  }

  buildCalendar(): void {
    this.currentMonthLabel = this.monthNames[this.currentDate.getMonth()] + ' ' + this.currentDate.getFullYear();
    const days: CalendarDay[] = [];
    const today = new Date();

    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const prevMonthTotal = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({
        number: prevMonthTotal - i,
        date: new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, prevMonthTotal - i),
        other: true,
        selected: false,
        isToday: false
      });
    }

    const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), d);
      days.push({
        number: d,
        date,
        other: false,
        selected: d === this.selectedDay,
        isToday:
          d === today.getDate() &&
          this.currentDate.getMonth() === today.getMonth() &&
          this.currentDate.getFullYear() === today.getFullYear()
      });
    }

    this.calendarDays = days;
  }

  selectDay(day: CalendarDay): void {
    if (day.other) return;
    this.selectedDay = day.number;
    this.buildCalendar();
    this.updateDateLabel();
  }

  updateDateLabel(): void {
    const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.selectedDay);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.selectedDateLabel = `${dayNames[date.getDay()]}, ${this.monthNames[this.currentDate.getMonth()].slice(0, 3)} ${this.selectedDay}`;
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedDay = today.getDate();
    this.buildCalendar();
    this.updateDateLabel();
  }

  selectTime(time: string): void {
    this.selectedTime = time;
  }

  nextStep(): void {
    if (!this.selectedTime) {
      alert('Please select an available time slot.');
      return;
    }
    this.currentStep = 2;
    // this.router.navigate(['/payment']);
  }
}