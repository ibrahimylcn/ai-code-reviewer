# 🤖 AI Kod İnceleme Paneli

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)

Yapay zeka destekli kod inceleme ve debugging paneli. Google Gemini 2.5 Flash API kullanarak kod analizi, bug detection, fonksiyon dokümantasyonu ve API dokümantasyonu üretir.

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknolojiler](#-teknolojiler)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Proje Yapısı](#-proje-yapısı)
- [Mimari](#-mimari)
- [Güvenlik](#-güvenlik)
- [Sorun Giderme](#-sorun-giderme)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

## ✨ Özellikler

### 🔍 Otomatik Kod Analizi
- **Bug Detection**: Yüksek, orta ve düşük seviyeli bug'ları otomatik tespit eder
- **Kod Kalitesi Skoru**: Bug sayısına ve severity'sine göre 0-100 arası kalite skoru hesaplar
- **Güvenlik Açıkları**: SQL injection, XSS, URL injection gibi güvenlik sorunlarını tespit eder
- **Performans Sorunları**: N+1 queries, timeout sorunları, memory leak'leri tespit eder
- **Code Quality Issues**: Best practice'lere uygunluk kontrolü

### 📝 Dokümantasyon Üretimi
- **Fonksiyon Dokümantasyonu**: Her fonksiyon için detaylı açıklama, parametreler, dönüş değerleri ve kullanım örnekleri
- **API Dokümantasyonu**: REST API endpoint'leri için method, path, parametreler ve response formatları

### 🎨 Modern Kullanıcı Arayüzü
- **Responsive Design**: Tüm cihazlarda mükemmel görünüm
- **Syntax Highlighting**: Kod görüntüleme için renkli syntax highlighting
- **Tab-based Navigation**: Bug analizi, dokümantasyon ve API docs için ayrı sekmeler
- **Real-time Feedback**: Analiz sırasında loading state'leri ve hata mesajları
- **Error Handling**: Kullanıcı dostu hata mesajları ve çözüm önerileri

### 🌐 Çoklu Dil Desteği
JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust

## 🛠 Teknolojiler

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **Google Gemini 2.5 Flash API** - AI model (v1beta endpoint)
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool ve dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Syntax Highlighter** - Code syntax highlighting

### Mimari Prensipleri
- **Clean Architecture** - Katmanlı mimari yapısı
- **Dependency Injection** - Loose coupling
- **SOLID Principles** - Yazılım tasarım prensipleri
- **Error Handling** - Kapsamlı hata yönetimi
- **Rate Limiting** - API rate limit koruması (sıralı istekler, exponential backoff)

## 🚀 Kurulum

### Gereksinimler

- **Node.js** 18.0.0 veya üzeri
- **npm** 9.0.0 veya üzeri (veya yarn)
- **Google Gemini API Key** ([Almak için tıklayın](https://makersuite.google.com/app/apikey))

### Adım 1: Projeyi Klonlayın

```bash
git clone https://github.com/kullaniciadi/ai-code-reviewer.git
cd ai-code-reviewer
```

### Adım 2: Bağımlılıkları Yükleyin

```bash
npm run install:all
```

Bu komut root, backend ve frontend klasörlerindeki tüm bağımlılıkları yükler.

### Adım 3: Environment Değişkenlerini Ayarlayın

Backend klasöründe `.env` dosyası oluşturun:

```bash
cd backend
cp .env.example .env
```

`.env` dosyasını düzenleyip Google API key'inizi ekleyin:

```env
GOOGLE_API_KEY=your_google_api_key_here
PORT=3001
NODE_ENV=development
```

**⚠️ Önemli**: `.env` dosyasını asla Git'e commit etmeyin! Bu dosya `.gitignore`'da yer almalıdır.

### Adım 4: Uygulamayı Başlatın

#### Geliştirme Modu (Frontend + Backend Birlikte)

```bash
npm run dev
```

Bu komut hem backend hem de frontend'i aynı anda başlatır.

#### Ayrı Ayrı Başlatma

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### Adım 5: Uygulamayı Açın

Tarayıcınızda şu adresleri açın:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📖 Kullanım

### Web Arayüzü

1. **Kod Girişi**: Sol paneldeki kod editörüne analiz etmek istediğiniz kodu yapıştırın veya yazın
2. **Dil Seçimi**: Sağ üstteki dropdown menüden kodunuzun dilini seçin
3. **Analiz Başlatma**: "Kodu Analiz Et" butonuna tıklayın
4. **Sonuçları İnceleme**: Üç sekmede sonuçları görüntüleyin:
   - **Bug Analizi**: Tespit edilen bug'lar, severity seviyeleri ve kod kalitesi skoru
   - **Dokümantasyon**: Fonksiyon açıklamaları, parametreler ve örnekler
   - **API Docs**: API endpoint'leri, method'lar, parametreler ve response'lar

### API Kullanımı

#### Kapsamlı Analiz

```bash
curl -X POST http://localhost:3001/api/code-analysis/full \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function example() { return \"hello\"; }",
    "language": "javascript"
  }'
```

#### Sadece Bug Detection

```bash
curl -X POST http://localhost:3001/api/code-analysis/bugs \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function example() { return \"hello\"; }",
    "language": "javascript"
  }'
```

## 📡 API Dokümantasyonu

### POST /api/code-analysis/full

Kapsamlı kod analizi yapar (bug detection, fonksiyon dokümantasyonu ve API dokümantasyonu).

**Request Body:**
```json
{
  "code": "string (required)",
  "language": "string (optional, default: 'javascript')"
}
```

**Desteklenen Diller:**
- `javascript`
- `typescript`
- `python`
- `java`
- `cpp`
- `csharp`
- `go`
- `rust`

**Response:**
```json
{
  "analysis": {
    "bugs": [
      {
        "line": 5,
        "severity": "high",
        "message": "Bug açıklaması",
        "fix": "Düzeltme önerisi"
      }
    ],
    "codeQuality": {
      "score": 75,
      "issues": ["Sorun 1", "Sorun 2"]
    },
    "suggestions": ["Öneri 1", "Öneri 2"]
  },
  "documentation": {
    "functions": [
      {
        "name": "functionName",
        "description": "Fonksiyon açıklaması",
        "parameters": [
          {
            "name": "param1",
            "type": "string",
            "description": "Parametre açıklaması"
          }
        ],
        "returns": "Dönüş değeri açıklaması",
        "example": "Kullanım örneği"
      }
    ]
  },
  "apiDocumentation": {
    "endpoints": [
      {
        "method": "GET",
        "path": "/api/users",
        "description": "Endpoint açıklaması",
        "parameters": [
          {
            "name": "id",
            "type": "string",
            "required": true
          }
        ],
        "responses": {
          "200": "Başarılı yanıt açıklaması"
        }
      }
    ]
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### POST /api/code-analysis/bugs

Sadece bug detection yapar.

**Request Body:**
```json
{
  "code": "string (required)",
  "language": "string (optional)"
}
```

**Response:**
```json
{
  "bugs": [
    {
      "line": 5,
      "severity": "high",
      "message": "Bug açıklaması",
      "fix": "Düzeltme önerisi"
    }
  ],
  "codeQuality": {
    "score": 75,
    "issues": ["Sorun 1", "Sorun 2"]
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### POST /api/code-analysis/documentation

Fonksiyon dokümantasyonu üretir.

**Request Body:**
```json
{
  "code": "string (required)",
  "language": "string (optional)"
}
```

**Response:**
```json
{
  "functions": [
    {
      "name": "functionName",
      "description": "Fonksiyon açıklaması",
      "parameters": [
        {
          "name": "param1",
          "type": "string",
          "description": "Parametre açıklaması"
        }
      ],
      "returns": "Dönüş değeri açıklaması",
      "example": "Kullanım örneği"
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### POST /api/code-analysis/api-docs

API dokümantasyonu üretir.

**Request Body:**
```json
{
  "code": "string (required)",
  "language": "string (optional)"
}
```

**Response:**
```json
{
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/users",
      "description": "Endpoint açıklaması",
      "parameters": [
        {
          "name": "id",
          "type": "string",
          "required": true
        }
      ],
      "responses": {
        "200": "Başarılı yanıt açıklaması"
      }
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /health

Health check endpoint'i.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 📁 Proje Yapısı

```
ai-code-reviewer/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── codeAnalysis.js      # API route tanımları
│   │   ├── services/
│   │   │   ├── geminiService.js     # Google Gemini API entegrasyonu
│   │   │   └── codeAnalysisService.js  # Kod analizi orkestrasyonu
│   │   └── server.js                 # Express server konfigürasyonu
│   ├── .env                          # Environment değişkenleri (git'e eklenmez)
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalysisResults.tsx      # Bug analizi sonuçları
│   │   │   ├── ApiDocsViewer.tsx        # API dokümantasyon görüntüleyici
│   │   │   ├── CodeEditor.tsx           # Kod editörü
│   │   │   └── DocumentationViewer.tsx  # Fonksiyon dokümantasyon görüntüleyici
│   │   ├── services/
│   │   │   └── codeAnalysisService.ts   # Frontend API servisi
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript type tanımları
│   │   ├── App.tsx                      # Ana React komponenti
│   │   ├── main.tsx                     # React entry point
│   │   └── index.css                    # Global CSS
│   ├── index.html
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── .gitignore
├── package.json                        # Root package.json (workspace scripts)
└── README.md
```

## 🏗 Mimari

### Backend Mimari

Proje **Clean Architecture** prensipleri ile tasarlanmıştır:

1. **Routes Layer** (`routes/codeAnalysis.js`)
   - HTTP isteklerini alır
   - Request validation yapar
   - Service layer'a yönlendirir
   - Response formatlar

2. **Service Layer** (`services/`)
   - **GeminiService**: Google Gemini API ile iletişim
     - Model: `gemini-2.5-flash` (sadece)
     - API Version: `v1beta` (daha yüksek rate limit)
     - Retry mechanism: 503 hataları için exponential backoff
     - Rate limiting: İstekler sıralı çalıştırılır (5 saniye delay)
   - **CodeAnalysisService**: Analiz işlemlerini koordine eder
     - Sıralı API çağrıları (rate limit koruması)
     - Error handling ve fallback mekanizmaları

3. **Infrastructure**
   - Express server konfigürasyonu
   - CORS, body parsing middleware'leri
   - Error handling middleware
   - Environment variable management

### Frontend Mimari

1. **Components**: UI bileşenleri (presentation layer)
   - `CodeEditor`: Kod girişi için textarea
   - `AnalysisResults`: Bug analizi sonuçlarını gösterir
   - `DocumentationViewer`: Fonksiyon dokümantasyonunu gösterir
   - `ApiDocsViewer`: API dokümantasyonunu gösterir

2. **Services**: API ile iletişim (data layer)
   - `CodeAnalysisService`: Backend API'ye istek atar
   - Error handling ve response parsing

3. **Types**: TypeScript type definitions
   - Type safety için interface'ler

4. **App.tsx**: State management ve component orchestration

### Önemli Tasarım Kararları

- **Dependency Injection**: Servisler lazy initialization ile oluşturulur (environment değişkenlerinin yüklenmesini bekler)
- **Error Handling**: Tüm hatalar yakalanır ve kullanıcı dostu mesajlara dönüştürülür
- **Rate Limiting**: Google API rate limit'lerini aşmamak için istekler sıralı çalıştırılır (5 saniye delay)
- **Retry Mechanism**: 503 hataları için exponential backoff ile retry mekanizması (5 deneme: 5s, 10s, 20s, 40s, 80s)
- **JSON Parsing**: Model yanıtları robust şekilde parse edilir, array formatı otomatik object formatına dönüştürülür
- **Code Quality Score**: Model score döndürmezse, bug sayısına göre otomatik hesaplanır

## 🔒 Güvenlik

### API Key Yönetimi

- ✅ API key'ler `.env` dosyasında saklanır
- ✅ `.env` dosyası `.gitignore`'da yer alır
- ✅ API key'ler asla kod içinde hardcode edilmez
- ✅ Production'da environment değişkenleri güvenli bir şekilde yönetilmelidir

### Güvenlik Önlemleri

- **Input Validation**: Tüm API istekleri validate edilir (code length, type check)
- **Error Messages**: Production'da detaylı hata mesajları gizlenir
- **CORS**: Sadece gerekli origin'lerden isteklere izin verilir
- **Rate Limiting**: API rate limit'leri aşılmaz (sıralı istekler, delay'ler)
- **Request Size Limit**: 10MB limit (Express body parser)

### Güvenlik Önerileri

1. **Production Deployment**:
   - Environment değişkenlerini güvenli bir şekilde yönetin (AWS Secrets Manager, Azure Key Vault, vb.)
   - HTTPS kullanın
   - API rate limiting ekleyin (express-rate-limit)
   - Request size limit'leri ayarlayın

2. **API Key Güvenliği**:
   - API key'leri düzenli olarak rotate edin
   - Farklı environment'lar için farklı key'ler kullanın
   - Key'lerin scope'unu sınırlandırın

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### 1. "GOOGLE_API_KEY environment variable is not set"

**Çözüm:**
- Backend klasöründe `.env` dosyasının olduğundan emin olun
- `.env` dosyasında `GOOGLE_API_KEY=your_key_here` satırının olduğunu kontrol edin
- Backend'i yeniden başlatın

#### 2. "503 Service Unavailable - Model is overloaded"

**Açıklama:** Google Gemini API geçici olarak overloaded durumda.

**Çözüm:**
- Birkaç saniye bekleyip tekrar deneyin
- Kod çok büyükse, daha küçük parçalara bölün
- Backend otomatik olarak retry yapar (5 deneme, exponential backoff: 5s, 10s, 20s, 40s, 80s)

#### 3. "JSON parse hatası"

**Açıklama:** Model'in döndürdüğü JSON formatı beklenmeyen bir formatta.

**Çözüm:**
- Backend otomatik olarak düzeltmeye çalışır
- Eğer sorun devam ederse, kodunuzu daha küçük parçalara bölün
- Backend loglarını kontrol edin (`📊 Parse edilen JSON`)

#### 4. Frontend'de "Request failed"

**Çözüm:**
- Backend'in çalıştığından emin olun (http://localhost:3001/health)
- CORS ayarlarını kontrol edin
- Browser console'da detaylı hata mesajını kontrol edin
- Network tab'ında request/response'ları kontrol edin

#### 5. Kod kalitesi skoru hep 0 çıkıyor

**Çözüm:**
- Backend otomatik olarak bug sayısına göre skor hesaplar
- Eğer model `codeQuality.score` döndürüyorsa, o kullanılır
- Backend loglarında `📊 Kod kalitesi skoru hesaplandı` mesajını kontrol edin
- Skor hesaplama formülü: 100 - (high×20 + medium×10 + low×5)

#### 6. "MAX_TOKENS limitine ulaşıldı"

**Açıklama:** Model'in yanıtı çok uzun veya prompt çok büyük.

**Çözüm:**
- Kodunuzu daha küçük parçalara bölün
- Backend otomatik olarak 1000 karakterlik parçalara böler
- Eğer kod çok büyükse, sadece ilk kısım analiz edilir

### Debug Modu

Backend loglarında şu bilgileri görebilirsiniz:
- `📝 Model yanıtı`: Model'in döndürdüğü ham yanıt (ilk 500 karakter)
- `📊 Parse edilen JSON`: Parse edilen JSON (ilk 1000 karakter)
- `✅ JSON parse başarılı`: Parse başarılı mesajları
- `⚠️  Model overloaded`: Retry durumları
- `📊 Kod kalitesi skoru hesaplandı`: Skor hesaplama detayları

## 🧪 Test

### Manuel Test

1. Küçük bir kod parçası ile test edin
2. Farklı dillerde test edin
3. Büyük kod blokları ile test edin (parçalama testi)
4. Hata durumlarını test edin (geçersiz API key, network hatası)

### API Test

```bash
# Health check
curl http://localhost:3001/health

# Full analysis
curl -X POST http://localhost:3001/api/code-analysis/full \
  -H "Content-Type: application/json" \
  -d '{"code": "function test() { return 1; }", "language": "javascript"}'
```

## 🚢 Production Deployment

### Backend Deployment

1. **Environment Variables**: Production environment değişkenlerini ayarlayın
2. **Build**: `npm run build:backend` (şu an sadece dosyaları kopyalar)
3. **Start**: `npm run start` veya PM2 kullanın
4. **Reverse Proxy**: Nginx veya Apache ile reverse proxy kurun
5. **HTTPS**: SSL sertifikası ekleyin

**PM2 Örneği:**
```bash
pm2 start backend/src/server.js --name ai-code-reviewer-backend
pm2 save
pm2 startup
```

### Frontend Deployment

1. **Build**: `npm run build:frontend`
2. **Deploy**: `dist/` klasörünü static hosting servisine yükleyin (Vercel, Netlify, AWS S3, vb.)
3. **API URL**: Production backend URL'ini `frontend/src/services/codeAnalysisService.ts` içinde güncelleyin

**Vercel Örneği:**
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Örnek Nginx Konfigürasyonu

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen şu adımları izleyin:

1. **Fork** yapın
2. **Feature branch** oluşturun (`git checkout -b feature/amazing-feature`)
3. **Commit** yapın (`git commit -m 'feat: Add some amazing feature'`)
4. **Push** yapın (`git push origin feature/amazing-feature`)
5. **Pull Request** açın

### Commit Mesaj Formatı

[Conventional Commits](https://www.conventionalcommits.org/) formatını kullanın:

- `feat:` Yeni özellik
- `fix:` Bug düzeltmesi
- `docs:` Dokümantasyon değişiklikleri
- `style:` Kod formatı (formatting, missing semi colons, etc)
- `refactor:` Kod refactoring
- `test:` Test ekleme/değiştirme
- `chore:` Build process veya auxiliary tool değişiklikleri

**Örnekler:**
```
feat(backend): Add retry mechanism for 503 errors
fix(frontend): Fix code quality score display
docs: Update README with deployment instructions
refactor(services): Improve JSON parsing logic
```

### Kod Standartları

- **Backend**: JavaScript ES6+ modülleri
- **Frontend**: TypeScript, React hooks
- **Comments**: Türkçe açıklamalar
- **Code Identifiers**: İngilizce
- **Architecture**: SOLID principles, Clean Architecture
- **Error Handling**: Tüm hatalar yakalanmalı ve loglanmalı

## 📝 Changelog

### v1.0.0 (2025)

- ✨ İlk sürüm
- 🔍 Otomatik kod analizi ve bug detection
- 📝 Fonksiyon ve API dokümantasyonu üretimi
- 🎨 Modern React + TypeScript frontend
- 🚀 Express.js backend
- 🤖 Google Gemini 2.5 Flash API entegrasyonu
- 📊 Kod kalitesi skoru hesaplama (otomatik)
- 🔄 Retry mekanizması ve error handling
- 🌐 Çoklu dil desteği (8 dil)
- ⚡ Rate limiting ve sıralı API çağrıları
- 🛡️ Robust JSON parsing ve error recovery

## 🔧 Geliştirme

### Scripts

```bash
# Tüm bağımlılıkları yükle
npm run install:all

# Geliştirme modu (frontend + backend)
npm run dev

# Sadece backend
npm run dev:backend

# Sadece frontend
npm run dev:frontend

# Production build
npm run build
npm run build:backend
npm run build:frontend
```

### Kod Formatı

- **Backend**: JavaScript ES6+ modülleri, async/await
- **Frontend**: TypeScript, React functional components, hooks
- **Styling**: Tailwind CSS utility classes

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 🙏 Teşekkürler

- [Google Gemini AI](https://ai.google.dev/) - AI model desteği
- [React](https://reactjs.org/) - UI library
- [Express.js](https://expressjs.com/) - Web framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Vite](https://vitejs.dev/) - Build tool



---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
