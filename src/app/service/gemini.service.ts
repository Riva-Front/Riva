import { Injectable, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import { Message } from '../models/chat.model';
import { GEMINI_CONFIG } from '../constants';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  systemInstruction?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private isBrowser: boolean;
  
  private configSignal = signal<GeminiConfig>({
    apiKey: GEMINI_CONFIG.apiKey,
    model: GEMINI_CONFIG.model,
    systemInstruction: GEMINI_CONFIG.systemInstruction
  });

  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  readonly config = computed(() => this.configSignal());
  readonly isConfigured = computed(() => 
    this.configSignal().apiKey !== 'YOUR_GEMINI_API_KEY' && 
    this.configSignal().apiKey.trim() !== ''
  );

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.initializeFromEnv();
    }
  }

  private initializeFromEnv(): void {
    if (!this.isBrowser) return;
    
    const storedApiKey = localStorage.getItem('gemini_api_key');
    const config = this.configSignal();
    
    if (storedApiKey) {
      this.updateConfig({ ...config, apiKey: storedApiKey });
    } else {
      this.initializeModel(config);
    }
  }

  updateConfig(newConfig: Partial<GeminiConfig>): void {
    const currentConfig = this.configSignal();
    const updatedConfig = { ...currentConfig, ...newConfig };
    this.configSignal.set(updatedConfig);
    
    if (newConfig.apiKey && this.isBrowser) {
      localStorage.setItem('gemini_api_key', newConfig.apiKey);
    }
    
    this.initializeModel(updatedConfig);
  }

  private initializeModel(config: GeminiConfig): void {
    if (!this.isBrowser) return;
    
    try {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: config.model,
        systemInstruction: config.systemInstruction,
      });
      console.log('Gemini model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini model:', error);
    }
  }

  updateSystemInstruction(instruction: string): void {
    const config = this.configSignal();
    this.updateConfig({ ...config, systemInstruction: instruction });
  }

  switchModel(modelName: string): void {
    const config = this.configSignal();
    this.updateConfig({ ...config, model: modelName });
  }

  async generateResponse(history: Message[], userInput: string, systemPrompt?: string): Promise<string> {
    if (!this.isBrowser) {
      return this.getMockResponse(userInput);
    }
    
    if (!this.isConfigured()) {
      console.warn('Gemini API not configured. Using mock response.');
      return this.getMockResponse(userInput);
    }

    try {
      const activeModel = systemPrompt 
        ? this.genAI!.getGenerativeModel({ model: this.configSignal().model, systemInstruction: systemPrompt })
        : this.model!;

      const allHistory = history
        .map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: m.parts.map(part => {
            if (typeof part === 'string') return { text: part };
            if (part.text) return { text: part.text };
            if (part.inlineData) return { inlineData: part.inlineData };
            return part;
          })
        }));

      const firstUserIndex = allHistory.findIndex(m => m.role === 'user');
      const formattedHistory = firstUserIndex !== -1 ? allHistory.slice(firstUserIndex) : [];

      const lastMsg = formattedHistory[formattedHistory.length - 1];
      let result;

      if (lastMsg && lastMsg.role === 'user' && (lastMsg.parts.length > 1 || lastMsg.parts.some(p => p.inlineData))) {
        const historyWithoutLast = formattedHistory.slice(0, -1);
        const chat = activeModel.startChat({
          history: historyWithoutLast,
        });
        result = await chat.sendMessage(lastMsg.parts);
      } else {
        const chat = activeModel.startChat({
          history: formattedHistory,
        });
        result = await chat.sendMessage(userInput);
      }

      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API Error:', error);

      if (error.message?.includes('API_KEY_INVALID')) {
        return "I'm sorry, there seems to be an issue with my connection settings. Please contact support.";
      }

      return "I'm sorry, I'm having a bit of trouble connecting to my medical records right now. Could you please try again in a moment? I'm here for you.";
    }
  }

  private getMockResponse(userInput: string): string {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! How are you feeling today? I'm here to help with any questions about your health.";
    }
    
    if (lowerInput.includes('thank')) {
      return "You're very welcome! Take care of yourself, and don't hesitate to reach out if you need anything.";
    }
    
    if (lowerInput.includes('pain') || lowerInput.includes('hurt')) {
      return "I understand you're experiencing some discomfort. Can you tell me more about where it hurts and when it started?";
    }
    
    if (lowerInput.includes('medicine') || lowerInput.includes('medication')) {
      return "It's important to take your medication as prescribed. Have you experienced any side effects?";
    }
    
    if (lowerInput.includes('appointment')) {
      return "I'd be happy to help you schedule an appointment. What day works best for you?";
    }

    if (userInput.includes('مرحبا') || userInput.includes('السلام')) {
      return "وعليكم السلام! كيف حالك اليوم؟ أنا هنا لمساعدتك في أي أسئلة عن صحتك.";
    }

    if (userInput.includes('شكرا') || userInput.includes(' merci')) {
      return "عفواً! الله يحفظك. لا تتردد في التواصل معي في أي وقت.";
    }
    
    return "I hear you, and I'm here to support you. Can you tell me more about what you're experiencing?";
  }

  clearConfig(): void {
    if (this.isBrowser) {
      localStorage.removeItem('gemini_api_key');
    }
    this.configSignal.set({
      apiKey: GEMINI_CONFIG.apiKey,
      model: GEMINI_CONFIG.model,
      systemInstruction: this.configSignal().systemInstruction
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.isBrowser || !this.isConfigured() || !this.model) return false;
    
    try {
      const result = await this.model.startChat().sendMessage('Hello');
      return result.response !== undefined;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}
