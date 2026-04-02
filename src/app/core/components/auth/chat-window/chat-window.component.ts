import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../../../service/gemini.service';
import { ChatService } from '../../../../service/chat.service';
import { LanguageService } from '../../../../service/language.service';
import { Message } from '../../../../models/chat.model';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css'],
})
export class ChatWindowComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private myScrollContainer!: ElementRef;

  private geminiService = inject(GeminiService);
  private chatService = inject(ChatService);
  public langService = inject(LanguageService);
  t = this.langService.t;

  activeChat = this.chatService.activeChat;
  activeChatId = this.chatService.activeChatId;
  messages = this.chatService.activeMessages;
  isLoading = signal(false);
  userInput = '';
  selectedFile = signal<File | null>(null);
  filePreviewUrl = signal<string | null>(null);
  showMenu = signal(false);
  showBanner = signal(true);

  // الحل البرمجي لخطأ NG5002
  hasImage(msg: Message): boolean {
    return !!msg.parts && msg.parts.length > 1 && msg.parts.some(p => p.inlineData);
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.showMenu.update(v => !v);
  }

  deleteCurrentChat() {
    const chatId = this.activeChatId();
    if (chatId && confirm(this.t().deleteChat + '?')) {
      this.chatService.deleteChat(chatId);
      this.showMenu.set(false);
    }
  }

  formatMessage(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  ngAfterViewChecked() {
    if (this.myScrollContainer) {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    }
  }

  async sendMessage() {
    const userInputTrimmed = this.userInput.trim();
    if ((!userInputTrimmed && !this.selectedFile()) || this.isLoading()) return;
    const chatId = this.activeChatId();
    if (!chatId) return;

    const parts: any[] = [{ text: userInputTrimmed }];
    const file = this.selectedFile() as any;
    if (file && file.base64) {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: file.base64
        }
      });
    }

    const userMsg: Message = {
      role: 'user',
      parts: parts,
      timestamp: new Date()
    };

    this.chatService.addMessage(chatId, userMsg);
    
    this.userInput = '';
    this.removeFile();
    this.isLoading.set(true);

    try {
      const response = await this.geminiService.generateResponse(
        this.messages(), 
        userInputTrimmed,
        this.activeChat()?.systemInstruction
      );
      
      const modelMsg: Message = {
        role: 'model',
        parts: [{ text: response }],
        timestamp: new Date()
      };
      
      this.chatService.updateLastMessage(chatId, modelMsg);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async summarizeChat() {
    if (this.isLoading() || this.messages().length < 2) return;

    this.isLoading.set(true);
    try {
      const isAr = this.langService.currentLang() === 'ar';
      const summaryPrompt = isAr 
        ? "يرجى تقديم ملخص طبي موجز جداً لمحادثتنا حتى الآن."
        : "Please provide a very concise medical summary.";
      
      const response = await this.geminiService.generateResponse(this.messages(), summaryPrompt);
      
      const modelMsg: Message = {
        role: 'model',
        parts: [{ text: `### 📝 ${this.t().summaryTitle}\n\n${response}` }],
        timestamp: new Date()
      };
      
      this.chatService.addMessageToActiveChat(modelMsg);
    } catch (error) {
      console.error('Summary error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result.split(',')[1];
        this.selectedFile.set(file);
        this.filePreviewUrl.set(e.target.result);
        (file as any).base64 = base64;
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  async clearHistory() {
    const chatId = this.activeChatId();
    if (chatId && confirm(this.t().clearHistory + '?')) {
      this.chatService.clearHistory(chatId);
    }
  }

  removeFile() {
    this.selectedFile.set(null);
    this.filePreviewUrl.set(null);
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }

  onVoice(): void { console.log('Voice message clicked'); }
}