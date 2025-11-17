// Environment değişkenlerini EN ÖNCE yükle (diğer modüllerden önce)
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env dosyasını backend klasöründen yükle
dotenv.config({ path: join(__dirname, '../.env') });

// API key'in yüklendiğini kontrol et
if (!process.env.GOOGLE_API_KEY) {
  console.error('⚠️  UYARI: GOOGLE_API_KEY environment değişkeni bulunamadı!');
  console.error('Lütfen backend/.env dosyasında GOOGLE_API_KEY tanımladığınızdan emin olun.');
} else {
  console.log('✓ GOOGLE_API_KEY yüklendi (ilk 10 karakter:', process.env.GOOGLE_API_KEY.substring(0, 10) + '...)');
}

import express from 'express';
import cors from 'cors';
import { codeAnalysisRouter } from './routes/codeAnalysis.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware'ler
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/code-analysis', codeAnalysisRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Eğer response zaten gönderildiyse, error handler'ı express'e bırak
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

