import express from 'express';
import { GeminiService } from '../services/geminiService.js';
import { CodeAnalysisService } from '../services/codeAnalysisService.js';

const router = express.Router();

// Gemini servisini lazy initialization ile oluştur (dependency injection)
// Environment değişkenleri yüklendikten sonra kullanılacak
let geminiService = null;
let codeAnalysisService = null;

function getServices() {
  if (!geminiService) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('❌ GOOGLE_API_KEY environment variable is not set!');
      throw new Error('GOOGLE_API_KEY environment variable is not set. Please check your .env file.');
    }
    
    // API key formatını kontrol et
    if (apiKey.length < 20) {
      console.warn('⚠️  API key çok kısa görünüyor. Lütfen doğru API key kullandığınızdan emin olun.');
    }
    
    console.log('🔑 GeminiService oluşturuluyor...');
    geminiService = new GeminiService(apiKey);
    codeAnalysisService = new CodeAnalysisService(geminiService);
    console.log('✓ Servisler hazır');
  }
  return { geminiService, codeAnalysisService };
}

/**
 * POST /api/code-analysis/full
 * Kapsamlı kod analizi yapar
 */
router.post('/full', async (req, res, next) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required and must be a string' });
    }

    if (code.length > 50000) {
      return res.status(400).json({ error: 'Code is too long. Maximum 50000 characters allowed.' });
    }

    const { codeAnalysisService } = getServices();
    const result = await codeAnalysisService.performFullAnalysis(code, language);
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /full endpoint:', error.message);
    console.error('Stack:', error.stack);
    
    // Hata mesajını daha kullanıcı dostu hale getir
    const errorMessage = error.message || 'Kod analizi sırasında bir hata oluştu';
    res.status(500).json({ 
      error: {
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  }
});

/**
 * POST /api/code-analysis/bugs
 * Sadece bug detection yapar
 */
router.post('/bugs', async (req, res, next) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required and must be a string' });
    }

    const { codeAnalysisService } = getServices();
    const result = await codeAnalysisService.detectBugs(code, language);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/code-analysis/documentation
 * Fonksiyon dokümantasyonu üretir
 */
router.post('/documentation', async (req, res, next) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required and must be a string' });
    }

    const { codeAnalysisService } = getServices();
    const result = await codeAnalysisService.generateDocs(code, language);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/code-analysis/api-docs
 * API dokümantasyonu üretir
 */
router.post('/api-docs', async (req, res, next) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required and must be a string' });
    }

    const { codeAnalysisService } = getServices();
    const result = await codeAnalysisService.generateApiDocs(code, language);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as codeAnalysisRouter };

