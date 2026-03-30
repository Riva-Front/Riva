import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})




export class ChatComponent implements OnInit {
  messages: any[] = [];
  newMessage: string = '';

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    // البدء في "الاستماع" للرسائل الجديدة فور فتح الصفحة
    this.chatService.getMessages().subscribe(msg => {
      this.messages.push(msg);
    });
  }

  send() {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage, 'المريض');
      // إضافة رسالتي أنا فوراً للقائمة بلون مختلف
      this.messages.push({ text: this.newMessage, user: 'me' });
      this.newMessage = ''; 
    }
  }
}