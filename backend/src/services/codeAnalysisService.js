import { GeminiService } from './geminiService.js';

/**
 * Kod analizi servisi - tüm analiz işlemlerini koordine eder
 */
export class CodeAnalysisService {
  constructor(geminiService) {
    if (!geminiService) {
      throw new Error('GeminiService is required');
    }
    this.geminiService = geminiService;
  }

  /**
   * Kapsamlı kod analizi yapar - tüm analiz türlerini birleştirir
   */
  async performFullAnalysis(code, language = 'javascript') {
    try {
      // İstekleri sıralı olarak çalıştır ve her istekten sonra bekle - Google'ın rate limit'ini aşmamak için
      let analysis = null;
      let documentation = null;
      let apiDocumentation = null;

      // Helper function: bekleme süresi ekle
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // İlk istekten önce bekle (rate limit'i aşmamak için)
      await delay(3000);

      // 1. Kod analizi
      try {
        analysis = await this.geminiService.analyzeCode(code, language);
        console.log('✓ Kod analizi tamamlandı');
      } catch (error) {
        console.error('✗ Kod analizi başarısız:', error.message);
        analysis = { error: error.message || 'Kod analizi başarısız' };
      }

      // İstekler arasında 5 saniye bekle (rate limit'i aşmamak için - Google'ın modeli overloaded olduğunda daha uzun bekleme gerekir)
      await delay(5000);

      // 2. Fonksiyon dokümantasyonu
      try {
        documentation = await this.geminiService.generateFunctionDocumentation(code, language);
        console.log('✓ Fonksiyon dokümantasyonu tamamlandı');
      } catch (error) {
        console.error('✗ Fonksiyon dokümantasyonu başarısız:', error.message);
        documentation = { error: error.message || 'Dokümantasyon üretimi başarısız' };
      }

      // İstekler arasında 5 saniye bekle
      await delay(5000);

      // 3. API dokümantasyonu
      try {
        apiDocumentation = await this.geminiService.generateApiDocumentation(code, language);
        console.log('✓ API dokümantasyonu tamamlandı');
      } catch (error) {
        console.error('✗ API dokümantasyonu başarısız:', error.message);
        apiDocumentation = { error: error.message || 'API dokümantasyonu üretimi başarısız' };
      }

      return {
        analysis,
        documentation,
        apiDocumentation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Full analysis error:', error);
      throw new Error(`Analiz sırasında hata oluştu: ${error.message}`);
    }
  }

  /**
   * Sadece bug detection yapar
   */
  async detectBugs(code, language = 'javascript') {
    const analysis = await this.geminiService.analyzeCode(code, language);
    return {
      bugs: analysis.bugs || [],
      codeQuality: analysis.codeQuality || {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Sadece fonksiyon dokümantasyonu üretir
   */
  async generateDocs(code, language = 'javascript') {
    const documentation = await this.geminiService.generateFunctionDocumentation(code, language);
    return {
      ...documentation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Sadece API dokümantasyonu üretir
   */
  async generateApiDocs(code, language = 'javascript') {
    const apiDocs = await this.geminiService.generateApiDocumentation(code, language);
    return {
      ...apiDocs,
      timestamp: new Date().toISOString()
    };
  }
}

