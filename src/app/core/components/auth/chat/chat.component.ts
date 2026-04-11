import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { interval, Subscription, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

export interface Message {
  id?: number;
  sender: 'doctor' | 'patient';
  content: string;
  timestamp: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: Message[] = [];
  newMessage: string = '';
  isLoading = true;
  showTip = true;
  isSending = false;

  private pollingSubscription!: Subscription;
  private shouldScrollToBottom = false;
  private apiUrl = 'http://localhost:8000/api/messages/1';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMessages();

    this.pollingSubscription = interval(5000).pipe(
      switchMap(() =>
        this.http.get<Message[]>(this.apiUrl).pipe(
          catchError(() => of(this.messages))
        )
      )
    ).subscribe((msgs) => {
      if (msgs.length !== this.messages.length) {
        this.messages = msgs;
        this.shouldScrollToBottom = true;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }

  loadMessages(): void {
    this.isLoading = true;
    this.http.get<Message[]>(this.apiUrl).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content) return;

    // أضف الرسالة فورًا وامسح الـ input - مش فيه spinner خالص
    const newMsg: Message = {
      sender: 'patient',
      content,
      timestamp: new Date().toISOString()
    };

    this.messages = [...this.messages, newMsg];
    this.newMessage = '';
    this.shouldScrollToBottom = true;

    // POST للـ backend في الخلفية - مش بينتظر response
    this.http.post<Message>(this.apiUrl, { sender: 'patient', content }).subscribe({
      next: (saved) => {
        // لو الـ server رجع id/timestamp، حدّث الرسالة
        const idx = this.messages.indexOf(newMsg);
        if (idx !== -1 && saved) {
          const updated = [...this.messages];
          updated[idx] = saved;
          this.messages = updated;
        }
      },
      error: (err) => {
        // الرسالة بتفضل ظاهرة حتى لو POST فشل
        console.warn('POST failed (message shown locally):', err.status);
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatTime(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}