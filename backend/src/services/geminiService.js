import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI servisi - Google Generative AI ile kod analizi yapar
 * Sadece gemini-2.5-flash modeli kullanır, optimize edilmiş prompt'lar ile
 */
export class GeminiService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Google API key is required');
    }
    this.apiKey = apiKey;
    // v1beta endpoint'i node_modules içinde düzenlendi - daha yüksek rate limit
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Sadece gemini-2.5-flash kullan (outputTokenLimit: 65536, thinking: true)
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      // Model thinking: true olduğu için reasoning token'ları kullanıyor
      // outputTokenLimit: 65536, ama reasoning + output toplamı bu limiti aşmamalı
    });
  }

  /**
   * Güvenli API çağrısı - 503 hatası için retry mekanizması
   * SDK: generateContent string veya object alabilir, generationConfig ayrı parametre
   */
  async safeGenerateContent(prompt, generationConfig = {}) {
    const maxRetries = 5; // Retry sayısını artırdık (4 → 5)
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // SDK'ya doğru formatta Content objesi geçiyoruz
        // formatGenerateContentInput: eğer contents varsa formatlamıyor, yoksa formatlar
        // Bu yüzden contents array'ini doğru formatta oluşturuyoruz
        const result = await this.model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            // Model outputTokenLimit: 65536, ama reasoning token'ları da buraya dahil
            // Thinking: true olduğu için reasoning token'ları kullanıyor
            // Güvenli limit: 8000 token (reasoning + output toplamı)
            maxOutputTokens: 8000, // Reasoning + output için yeterli yer
            temperature: 0.3, // Daha deterministik yanıtlar
            ...generationConfig
          }
        });
        return result;
      } catch (error) {
        lastError = error;
        const errorMessage = error.message?.toLowerCase() || '';
        
        // 503 hatası için retry - daha agresif exponential backoff
        if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('service unavailable')) {
          if (attempt < maxRetries) {
            // Exponential backoff: 5s, 10s, 20s, 40s, 80s (Google'ın modeli overloaded olduğunda daha uzun bekleme gerekir)
            const delay = 5000 * Math.pow(2, attempt); // 5000ms, 10000ms, 20000ms, 40000ms, 80000ms
            console.log(`⚠️  Model overloaded, ${Math.round(delay / 1000)}s bekleyip tekrar deniyoruz... (deneme ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // Diğer hatalar için direkt fırlat
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Kodu küçük parçalara böler (1000 karakter limit - reasoning token'larını minimize etmek için)
   * Model thinking: true olduğu için reasoning token'ları kullanıyor, prompt'u küçük tutmalıyız
   */
  splitCodeIntoChunks(code, maxChunkSize = 1000) {
    if (code.length <= maxChunkSize) {
      return [code];
    }

    const chunks = [];
    let currentChunk = '';
    const lines = code.split('\n');

    for (const line of lines) {
      if ((currentChunk + line + '\n').length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Kod analizi yapar - bug detection, code review ve öneriler
   * Optimize edilmiş: Büyük kodlar parçalanır
   */
  async analyzeCode(code, language = 'javascript') {
    // Kodu parçalara böl (1000 karakter limit - reasoning token'larını minimize et)
    const chunks = this.splitCodeIntoChunks(code, 1000);
    
    // Eğer kod çok büyükse, sadece ilk parçayı analiz et
    const codeToAnalyze = chunks.length > 1 ? chunks[0] + '\n\n// ...' : code;

    // Kod analizi için detaylı prompt
    const prompt = `Kodu analiz et ve bug'ları, kalite sorunlarını ve önerileri bul. SADECE JSON döndür.

Format:
{
  "bugs": [
    {"line": 5, "severity": "high", "message": "Açıklama", "fix": "Düzeltme önerisi"}
  ],
  "codeQuality": {
    "score": 75,
    "issues": ["Sorun 1", "Sorun 2"]
  },
  "suggestions": ["Öneri 1", "Öneri 2"]
}

Kod:
\`\`\`${language}
${codeToAnalyze}
\`\`\``;

    try {
      const result = await this.safeGenerateContent(prompt);
      const response = result.response;
      
      // Yanıtı güvenli şekilde al
      let text;
      try {
        text = response.text();
      } catch (textError) {
        // Eğer text() metodu hata verirse, candidates'ı kontrol et
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          
          // MAX_TOKENS durumunu handle et - eğer parts varsa onu kullan
          if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            text = candidate.content.parts.map(part => part.text || '').join('');
          } else if (candidate.finishReason === 'MAX_TOKENS') {
            // MAX_TOKENS durumunda kısmi yanıt varsa onu kullan
            console.warn('⚠️  MAX_TOKENS limitine ulaşıldı, kısmi yanıt kullanılıyor');
            text = ''; // Kısmi yanıt yoksa boş
          } else {
            throw new Error(`API yanıtı okunamadı: ${textError.message}`);
          }
        } else {
          throw new Error(`API yanıtı boş veya hatalı: ${textError.message}`);
        }
      }
      
      // Yanıt boş mu kontrol et
      if (!text || text.trim().length === 0) {
        // MAX_TOKENS durumunu kontrol et
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.finishReason === 'MAX_TOKENS') {
            throw new Error('MAX_TOKENS limitine ulaşıldı - prompt çok büyük veya yanıt çok uzun');
          }
        }
        console.error('API yanıtı boş. Response:', JSON.stringify(response, null, 2));
        throw new Error('API\'den boş yanıt alındı');
      }
      
      // Debug: Model yanıtını logla (ilk 500 karakter)
      console.log('📝 Model yanıtı (ilk 500 karakter):', text.substring(0, 500));
      
      // JSON'u temizle - daha agresif temizleme
      let cleanedText = text.trim();
      
      // Markdown code block'ları temizle
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      // Eğer yanıt kod örneği gibi görünüyorsa (// veya const/function ile başlıyorsa), JSON aramaya devam et
      // Ama önce JSON başlangıcını bul
      const jsonStart = Math.max(cleanedText.indexOf('{'), cleanedText.indexOf('['));
      if (jsonStart === -1) {
        // JSON bulunamadı - yanıtı logla ve hata fırlat
        console.error('⚠️  JSON bulunamadı. API yanıtı:', cleanedText.substring(0, 200));
        throw new Error('Yanıtta JSON bulunamadı - model kod örneği üretmiş olabilir');
      }
      
      // JSON'dan önceki metni temizle (kod örnekleri, yorumlar vb.)
      cleanedText = cleanedText.substring(jsonStart);
      
      // JSON bitişini bul (nested yapıları dikkate alarak)
      let braceCount = 0;
      let bracketCount = 0;
      let jsonEnd = -1;
      const startChar = cleanedText[0];
      const isArray = startChar === '[';
      
      for (let i = 0; i < cleanedText.length; i++) {
        const char = cleanedText[i];
        
        // String içindeki karakterleri atla (JSON string'lerini doğru handle et)
        if (char === '"') {
          // String başlangıcı - string'in sonunu bul
          let j = i + 1;
          while (j < cleanedText.length) {
            if (cleanedText[j] === '"' && cleanedText[j - 1] !== '\\') {
              // String sonu bulundu
              i = j; // String'in sonuna atla
              break;
            }
            j++;
          }
          continue; // String içindeki karakterleri sayma
        }
        
        // String dışındayız - parantezleri say
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
        
        if ((isArray && bracketCount === 0 && i > 0) || (!isArray && braceCount === 0 && i > 0)) {
          jsonEnd = i;
          break;
        }
      }
      
      // JSON tamamlanmamışsa, MAX_TOKENS hatası olabilir - hata fırlat
      if (jsonEnd === -1) {
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.finishReason === 'MAX_TOKENS') {
            throw new Error('MAX_TOKENS limitine ulaşıldı - prompt çok büyük veya yanıt çok uzun');
          }
        }
        console.error('⚠️  JSON tamamlanmamış. Kısmi yanıt:', cleanedText.substring(0, 200));
        throw new Error('JSON yapısı tamamlanmamış - yanıt eksik');
      }
      
      cleanedText = cleanedText.substring(0, jsonEnd + 1);
      
      // JSON'u parse et - hata durumunda daha detaylı log
      let parsed;
      try {
        parsed = JSON.parse(cleanedText);
        
        // Eğer parse edilen veri array ise, doğru formata dönüştür
        if (Array.isArray(parsed)) {
          console.warn('⚠️  Model array döndürmüş, object formatına dönüştürülüyor...');
          
          // Bug sayısına göre kalite skoru hesapla
          const bugCount = parsed.length || 0;
          const highSeverityBugs = parsed.filter(b => b.severity === 'high' || b.severity === 'critical').length || 0;
          const mediumSeverityBugs = parsed.filter(b => b.severity === 'medium').length || 0;
          
          // Her high bug için -20, medium bug için -10, low bug için -5 puan
          let calculatedScore = 100;
          calculatedScore -= highSeverityBugs * 20;
          calculatedScore -= mediumSeverityBugs * 10;
          calculatedScore -= (bugCount - highSeverityBugs - mediumSeverityBugs) * 5;
          
          // Minimum 0, maksimum 100
          calculatedScore = Math.max(0, Math.min(100, calculatedScore));
          
          parsed = {
            bugs: parsed,
            codeQuality: { score: calculatedScore, issues: [] },
            suggestions: []
          };
          
          console.log(`📊 Kod kalitesi skoru hesaplandı (array formatından): ${calculatedScore} (${bugCount} bug: ${highSeverityBugs} high, ${mediumSeverityBugs} medium)`);
        }
        
        // Eğer bugs array değilse, boş array yap
        if (!Array.isArray(parsed.bugs)) {
          parsed.bugs = [];
        }
        
        // codeQuality objesini kontrol et ve eksikse tamamla
        if (!parsed.codeQuality || typeof parsed.codeQuality !== 'object') {
          parsed.codeQuality = { score: 0, issues: [] };
        }
        
        // codeQuality.score yoksa veya geçersizse, bug sayısına göre hesapla
        // Ama önce model'in döndürdüğü score'u kontrol et
        if (typeof parsed.codeQuality.score !== 'number' || parsed.codeQuality.score < 0 || parsed.codeQuality.score > 100 || isNaN(parsed.codeQuality.score)) {
          // Bug sayısına göre kalite skoru hesapla (100'den başla, her bug için düş)
          const bugCount = parsed.bugs?.length || 0;
          const highSeverityBugs = parsed.bugs?.filter(b => b.severity === 'high' || b.severity === 'critical').length || 0;
          const mediumSeverityBugs = parsed.bugs?.filter(b => b.severity === 'medium').length || 0;
          
          // Her high bug için -20, medium bug için -10, low bug için -5 puan
          let calculatedScore = 100;
          calculatedScore -= highSeverityBugs * 20;
          calculatedScore -= mediumSeverityBugs * 10;
          calculatedScore -= (bugCount - highSeverityBugs - mediumSeverityBugs) * 5;
          
          // Minimum 0, maksimum 100
          calculatedScore = Math.max(0, Math.min(100, calculatedScore));
          
          parsed.codeQuality.score = calculatedScore;
          console.log(`📊 Kod kalitesi skoru hesaplandı: ${calculatedScore} (${bugCount} bug: ${highSeverityBugs} high, ${mediumSeverityBugs} medium)`);
        } else {
          // Model'in döndürdüğü score geçerli, onu kullan
          console.log(`✅ Model'in döndürdüğü kod kalitesi skoru kullanılıyor: ${parsed.codeQuality.score}`);
        }
        
        // codeQuality.issues array değilse, boş array yap
        if (!Array.isArray(parsed.codeQuality.issues)) {
          parsed.codeQuality.issues = [];
        }
        
        // suggestions array değilse, boş array yap
        if (!Array.isArray(parsed.suggestions)) {
          parsed.suggestions = [];
        }
        
        console.log('✅ JSON parse başarılı. Bugs:', parsed.bugs?.length || 0, 'Quality score:', parsed.codeQuality?.score);
        console.log('📊 Parse edilen JSON (ilk 1000 karakter):', JSON.stringify(parsed, null, 2).substring(0, 1000));
      } catch (parseError) {
        // Parse hatası - yanıtı logla
        console.error('⚠️  JSON parse hatası. Hatalı JSON:', cleanedText.substring(0, 300));
        console.error('⚠️  Parse error:', parseError.message);
        
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.finishReason === 'MAX_TOKENS') {
            throw new Error('MAX_TOKENS limitine ulaşıldı - prompt çok büyük veya yanıt çok uzun');
          }
        }
        
        // JSON'u düzeltmeyi dene (basit düzeltmeler)
        try {
          // Eksik kapanış parantezlerini ekle
          let fixedJson = cleanedText;
          const openBraces = (fixedJson.match(/{/g) || []).length;
          const closeBraces = (fixedJson.match(/}/g) || []).length;
          const openBrackets = (fixedJson.match(/\[/g) || []).length;
          const closeBrackets = (fixedJson.match(/\]/g) || []).length;
          
          // Eksik parantezleri ekle
          if (openBraces > closeBraces) {
            fixedJson += '}'.repeat(openBraces - closeBraces);
          }
          if (openBrackets > closeBrackets) {
            fixedJson += ']'.repeat(openBrackets - closeBrackets);
          }
          
          parsed = JSON.parse(fixedJson);
          console.warn('⚠️  JSON düzeltildi ve parse edildi');
          
          // Eğer düzeltilmiş JSON array ise, doğru formata dönüştür
          if (Array.isArray(parsed)) {
            // Bug sayısına göre kalite skoru hesapla
            const bugCount = parsed.length || 0;
            const highSeverityBugs = parsed.filter(b => b.severity === 'high' || b.severity === 'critical').length || 0;
            const mediumSeverityBugs = parsed.filter(b => b.severity === 'medium').length || 0;
            
            // Her high bug için -20, medium bug için -10, low bug için -5 puan
            let calculatedScore = 100;
            calculatedScore -= highSeverityBugs * 20;
            calculatedScore -= mediumSeverityBugs * 10;
            calculatedScore -= (bugCount - highSeverityBugs - mediumSeverityBugs) * 5;
            
            // Minimum 0, maksimum 100
            calculatedScore = Math.max(0, Math.min(100, calculatedScore));
            
            parsed = {
              bugs: parsed,
              codeQuality: { score: calculatedScore, issues: [] },
              suggestions: []
            };
            
            console.log(`📊 Kod kalitesi skoru hesaplandı (düzeltilmiş JSON'dan): ${calculatedScore} (${bugCount} bug: ${highSeverityBugs} high, ${mediumSeverityBugs} medium)`);
          } else if (parsed && typeof parsed === 'object') {
            // Eğer object ise ama codeQuality yoksa veya geçersizse, hesapla
            if (!parsed.codeQuality || typeof parsed.codeQuality !== 'object') {
              parsed.codeQuality = { score: 0, issues: [] };
            }
            
            if (typeof parsed.codeQuality.score !== 'number' || parsed.codeQuality.score < 0 || parsed.codeQuality.score > 100 || isNaN(parsed.codeQuality.score)) {
              const bugCount = parsed.bugs?.length || 0;
              const highSeverityBugs = parsed.bugs?.filter(b => b.severity === 'high' || b.severity === 'critical').length || 0;
              const mediumSeverityBugs = parsed.bugs?.filter(b => b.severity === 'medium').length || 0;
              
              let calculatedScore = 100;
              calculatedScore -= highSeverityBugs * 20;
              calculatedScore -= mediumSeverityBugs * 10;
              calculatedScore -= (bugCount - highSeverityBugs - mediumSeverityBugs) * 5;
              
              calculatedScore = Math.max(0, Math.min(100, calculatedScore));
              parsed.codeQuality.score = calculatedScore;
              
              console.log(`📊 Kod kalitesi skoru hesaplandı (düzeltilmiş JSON'dan): ${calculatedScore} (${bugCount} bug: ${highSeverityBugs} high, ${mediumSeverityBugs} medium)`);
            } else {
              console.log(`✅ Model'in döndürdüğü kod kalitesi skoru kullanılıyor (düzeltilmiş JSON'dan): ${parsed.codeQuality.score}`);
            }
          }
        } catch (fixError) {
          // Düzeltme de başarısız - hata fırlat
          throw new Error(`JSON parse hatası: ${parseError.message} (yanıt: ${cleanedText.substring(0, 100)}...)`);
        }
      }
      
      // Eğer kod parçalandıysa, bunu belirt
      if (chunks.length > 1) {
        parsed.note = `Kod çok büyük (${chunks.length} parça), sadece ilk kısım analiz edildi.`;
      }
      
      return parsed;
    } catch (error) {
      console.error('Gemini API error in analyzeCode:', error.message);
      if (error instanceof SyntaxError) {
        console.error('JSON parse hatası - API yanıtı:', error.message);
        throw new Error(`Kod analizi başarısız: API'den geçersiz JSON yanıtı alındı`);
      }
      throw new Error(`Kod analizi başarısız: ${error.message}`);
    }
  }

  /**
   * Fonksiyon açıklamaları üretir
   * Bu zaten çalışıyor - prompt küçük olduğu için
   */
  async generateFunctionDocumentation(code, language = 'javascript') {
    // Kodu parçalara böl (1000 karakter limit - reasoning token'larını minimize et)
    const chunks = this.splitCodeIntoChunks(code, 1000);
    const codeToAnalyze = chunks.length > 1 ? chunks[0] + '\n\n// ...' : code;

    // Fonksiyon dokümantasyonu için detaylı prompt
    const prompt = `Kodda bulunan fonksiyonları analiz et ve dokümantasyon üret. SADECE JSON döndür.

Format:
{
  "functions": [
    {
      "name": "fonksiyonAdi",
      "description": "Fonksiyon açıklaması",
      "parameters": [{"name": "param1", "type": "string", "description": "Açıklama"}],
      "returns": "Dönüş değeri açıklaması",
      "example": "Kullanım örneği"
    }
  ]
}

Kod:
\`\`\`${language}
${codeToAnalyze}
\`\`\``;

    try {
      const result = await this.safeGenerateContent(prompt);
      const response = result.response;
      
      // Yanıtı güvenli şekilde al
      let text;
      try {
        text = response.text();
      } catch (textError) {
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          
          // MAX_TOKENS durumunu handle et - eğer parts varsa onu kullan
          if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            text = candidate.content.parts.map(part => part.text || '').join('');
          } else if (candidate.finishReason === 'MAX_TOKENS') {
            console.warn('⚠️  MAX_TOKENS limitine ulaşıldı, kısmi yanıt kullanılıyor');
            text = '';
          } else {
            throw new Error(`API yanıtı okunamadı: ${textError.message}`);
          }
        } else {
          throw new Error(`API yanıtı boş veya hatalı: ${textError.message}`);
        }
      }
      
      if (!text || text.trim().length === 0) {
        // MAX_TOKENS durumunu kontrol et
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.finishReason === 'MAX_TOKENS') {
            throw new Error('MAX_TOKENS limitine ulaşıldı - prompt çok büyük veya yanıt çok uzun');
          }
        }
        console.error('API yanıtı boş. Response:', JSON.stringify(response, null, 2));
        throw new Error('API\'den boş yanıt alındı');
      }
      
      // Debug: Model yanıtını logla (ilk 500 karakter)
      console.log('📝 Model yanıtı (fonksiyon dokümantasyonu, ilk 500 karakter):', text.substring(0, 500));
      
      // JSON'u temizle - daha agresif temizleme
      let cleanedText = text.trim();
      
      // Markdown code block'ları temizle
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      // Eğer yanıt kod örneği gibi görünüyorsa (// veya const/function ile başlıyorsa), JSON aramaya devam et
      // Ama önce JSON başlangıcını bul
      const jsonStart = Math.max(cleanedText.indexOf('{'), cleanedText.indexOf('['));
      if (jsonStart === -1) {
        // JSON bulunamadı - yanıtı logla ve hata fırlat
        console.error('⚠️  JSON bulunamadı. API yanıtı:', cleanedText.substring(0, 200));
        throw new Error('Yanıtta JSON bulunamadı - model kod örneği üretmiş olabilir');
      }
      
      // JSON'dan önceki metni temizle (kod örnekleri, yorumlar vb.)
      cleanedText = cleanedText.substring(jsonStart);
      
      // JSON bitişini bul (nested yapıları dikkate alarak)
      let braceCount = 0;
      let bracketCount = 0;
      let jsonEnd = -1;
      const startChar = cleanedText[0];
      const isArray = startChar === '[';
      
      for (let i = 0; i < cleanedText.length; i++) {
        const char = cleanedText[i];
        
        // String içindeki karakterleri atla (JSON string'lerini doğru handle et)
        if (char === '"') {
          // String başlangıcı - string'in sonunu bul
          let j = i + 1;
          while (j < cleanedText.length) {
            if (cleanedText[j] === '"' && cleanedText[j - 1] !== '\\') {
              // String sonu bulundu
              i = j; // String'in sonuna atla
              break;
            }
            j++;
          }
          continue; // String içindeki karakterleri sayma
        }
        
        // String dışındayız - parantezleri say
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
        
        if ((isArray && bracketCount === 0 && i > 0) || (!isArray && braceCount === 0 && i > 0)) {
          jsonEnd = i;
          break;
        }
      }
      
      // JSON tamamlanmamışsa, MAX_TOKENS hatası olabilir - hata fırlat
      if (jsonEnd === -1) {
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.finishReason === 'MAX_TOKENS') {
            throw new Error('MAX_TOKENS limitine ulaşıldı - prompt çok büyük veya yanıt çok uzun');
          }
        }
        console.error('⚠️  JSON tamamlanmamış. Kısmi yanıt:', cleanedText.substring(0, 200));
        throw new Error('JSON yapısı tamamlanmamış - yanıt eksik');
      }
      
      cleanedText = cleanedText.substring(0, jsonEnd + 1);
      
      // JSON'u parse et - hata durumunda daha detaylı log
      try {
        let parsed = JSON.parse(cleanedText);
        
        // Eğer parse edilen veri array ise, doğru formata dönüştür
        if (Array.isArray(parsed)) {
          console.warn('⚠️  Model array döndürmüş (fonksiyon dokümantasyonu), object formatına dönüştürülüyor...');
          parsed = {
            functions: parsed
          };
        }
        
        // Eğer functions array değilse, boş array yap
        if (!Array.isArray(parsed.functions)) {
          parsed.functions = [];
        }
        
        console.log('✅ JSON parse başarılı (fonksiyon dokümantasyonu). Functions:', parsed.functions?.length || 0);
        console.log('📊 Parse edilen JSON (fonksiyon dokümantasyonu, ilk 1000 karakter):', JSON.stringify(parsed, null, 2).substring(0, 1000));
        return parsed;
      } catch (parseError) {
        // Parse hatası - yanıtı logla
        console.error('⚠️  JSON parse hatası. Hatalı JSON:', cleanedText.substring(0, 300));
        console.error('⚠️  Parse error:', parseError.message);
        
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.finishReason === 'MAX_TOKENS') {
            throw new Error('MAX_TOKENS limitine ulaşıldı - prompt çok büyük veya yanıt çok uzun');
          }
        }
        
        // JSON'u düzeltmeyi dene (basit düzeltmeler)
        try {
          // Eksik kapanış parantezlerini ekle
          let fixedJson = cleanedText;
          const openBraces = (fixedJson.match(/{/g) || []).length;
          const closeBraces = (fixedJson.match(/}/g) || []).length;
          const openBrackets = (fixedJson.match(/\[/g) || []).length;
          const closeBrackets = (fixedJson.match(/\]/g) || []).length;
          
          // Eksik parantezleri ekle
          if (openBraces > closeBraces) {
            fixedJson += '}'.repeat(openBraces - closeBraces);
          }
          if (openBrackets > closeBrackets) {
            fixedJson += ']'.repeat(openBrackets - closeBrackets);
          }
          
          let parsed = JSON.parse(fixedJson);
          console.warn('⚠️  JSON düzeltildi ve parse edildi');
          
          // Eğer düzeltilmiş JSON array ise, doğru formata dönüştür
          if (Array.isArray(parsed)) {
            parsed = {
              functions: parsed
            };
          }
          
          return parsed;
        } catch (fixError) {
          // Düzeltme de başarısız - hata fırlat
          throw new Error(`JSON parse hatası: ${parseError.message} (yanıt: ${cleanedText.substring(0, 100)}...)`);
        }
      }
    } catch (error) {
      console.error('Gemini API error in generateFunctionDocumentation:', error.message);
      if (error instanceof SyntaxError) {
        console.error('JSON parse hatası - API yanıtı:', error.message);
        throw new Error(`Dokümantasyon üretimi başarısız: API'den geçersiz JSON yanıtı alındı`);
      }
      throw new Error(`Dokümantasyon üretimi başarısız: ${error.message}`);
    }
  }

  /**
   * API dokümantasyonu üretir
   * Optimize edilmiş: Büyük kodlar parçalanır
   */
  async generateApiDocumentation(code, language = 'javascript') {
    // Kodu parçalara böl (1000 karakter limit - reasoning token'larını minimize et)
    const chunks = this.splitCodeIntoChunks(code, 1000);
    const codeToAnalyze = chunks.length > 1 ? chunks[0] + '\n\n// ...' : code;

    // API dokümantasyonu için detaylı prompt
    const prompt = `Kodda bulunan API endpoint'lerini analiz et ve dokümantasyon üret. SADECE JSON döndür.

Format:
{
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/users",
      "description": "Endpoint açıklaması",
      "parameters": [{"name": "id", "type": "string", "required": true}],
      "responses": {"200": "Başarılı yanıt açıklaması"}
    }
  ]
}

Kod:
\`\`\`${language}
${codeToAnalyze}
\`\`\``;

    try {
      const result = await this.safeGenerateContent(prompt);
      const response = result.response;
      
      // Yanıtı güvenli şekilde al
      let text;
      try {
        text = response.text();
      } catch (textError) {
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          
          // MAX_TOKENS durumunu handle et - eğer parts varsa onu kullan
          if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            text = candidate.content.parts.map(part => part.text || '').join('');
          } else if (candidate.finishReason === 'MAX_TOKENS') {
            console.warn('⚠️  MAX_TOKENS limitine ulaşıldı, kısmi yanıt kullanılıyor');
            text = '';
          } else {
            throw new Error(`API yanıtı okunamadı: ${textError.message}`);
          }
        } else {
          throw new Error(`API yanıtı boş veya hatalı: ${textError.message}`);
        }
      }
      
      if (!text || text.trim().length === 0) {
        // MAX_TOKENS durumunu kontrol et
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.finishReason === 'MAX_TOKENS') {
            throw new Error('MAX_TOKENS limitine ulaşıldı - prompt çok büyük veya yanıt çok uzun');
          }
        }
        console.error('API yanıtı boş. Response:', JSON.stringify(response, null, 2));
        throw new Error('API\'den boş yanıt alındı');
      }
      
      // Debug: Model yanıtını logla (ilk 500 karakter)
      console.log('📝 Model yanıtı (API dokümantasyonu, ilk 500 karakter):', text.substring(0, 500));
      
      // JSON'u temizle - daha agresif temizleme
      let cleanedText = text.trim();
      
      // Markdown code block'ları temizle
      cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      // Eğer yanıt kod örneği gibi görünüyorsa (// veya const/function ile başlıyorsa), JSON aramaya devam et
      // Ama önce JSON başlangıcını bul
      const jsonStart = Math.max(cleanedText.indexOf('{'), cleanedText.indexOf('['));
      if (jsonStart === -1) {
        // JSON bulunamadı - yanıtı logla ve hata fırlat
        console.error('⚠️  JSON bulunamadı. API yanıtı:', cleanedText.substring(0, 200));
        throw new Error('Yanıtta JSON bulunamadı - model kod örneği üretmiş olabilir');
      }
      
      // JSON'dan önceki metni temizle (kod örnekleri, yorumlar vb.)
      cleanedText = cleanedText.substring(jsonStart);
      
      // JSON bitişini bul (nested yapıları dikkate alarak)
      let braceCount = 0;
      let bracketCount = 0;
      let jsonEnd = -1;
      const startChar = cleanedText[0];
      const isArray = startChar === '[';
      
      for (let i = 0; i < cleanedText.length; i++) {
        const char = cleanedText[i];
        
        // String içindeki karakterleri atla (JSON string'lerini doğru handle et)
        if (char === '"') {
          // String başlangıcı - string'in sonunu bul
          let j = i + 1;
          while (j < cleanedText.length) {
            if (cleanedText[j] === '"' && cleanedText[j - 1] !== '\\') {
              // String sonu bulundu
              i = j; // String'in sonuna atla
              break;
            }
            j++;
          }
          continue; // String içindeki karakterleri sayma
        }
        
        // String dışındayız - parantezleri say
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
        
        if ((isArray && bracketCount === 0 && i > 0) || (!isArray && braceCount === 0 && i > 0)) {
          jsonEnd = i;
          break;
        }
      }
      
      // JSON tamamlanmamışsa, MAX_TOKENS hatası olabilir - hata fırlat
      if (jsonEnd === -1) {
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.finishReason === 'MAX_TOKENS') {
            throw new Error('MAX_TOKENS limitine ulaşıldı - prompt çok büyük veya yanıt çok uzun');
          }
        }
        console.error('⚠️  JSON tamamlanmamış. Kısmi yanıt:', cleanedText.substring(0, 200));
        throw new Error('JSON yapısı tamamlanmamış - yanıt eksik');
      }
      
      cleanedText = cleanedText.substring(0, jsonEnd + 1);
      
      // JSON'u parse et - hata durumunda daha detaylı log
      try {
        let parsed = JSON.parse(cleanedText);
        
        // Eğer parse edilen veri array ise, doğru formata dönüştür
        if (Array.isArray(parsed)) {
          console.warn('⚠️  Model array döndürmüş (API dokümantasyonu), object formatına dönüştürülüyor...');
          parsed = {
            endpoints: parsed
          };
        }
        
        // Eğer endpoints array değilse, boş array yap
        if (!Array.isArray(parsed.endpoints)) {
          parsed.endpoints = [];
        }
        
        console.log('✅ JSON parse başarılı (API dokümantasyonu). Endpoints:', parsed.endpoints?.length || 0);
        console.log('📊 Parse edilen JSON (API dokümantasyonu, ilk 1000 karakter):', JSON.stringify(parsed, null, 2).substring(0, 1000));
        return parsed;
      } catch (parseError) {
        // Parse hatası - yanıtı logla
        console.error('⚠️  JSON parse hatası. Hatalı JSON:', cleanedText.substring(0, 300));
        console.error('⚠️  Parse error:', parseError.message);
        
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.finishReason === 'MAX_TOKENS') {
            throw new Error('MAX_TOKENS limitine ulaşıldı - prompt çok büyük veya yanıt çok uzun');
          }
        }
        
        // JSON'u düzeltmeyi dene (basit düzeltmeler)
        try {
          // Eksik kapanış parantezlerini ekle
          let fixedJson = cleanedText;
          const openBraces = (fixedJson.match(/{/g) || []).length;
          const closeBraces = (fixedJson.match(/}/g) || []).length;
          const openBrackets = (fixedJson.match(/\[/g) || []).length;
          const closeBrackets = (fixedJson.match(/\]/g) || []).length;
          
          // Eksik parantezleri ekle
          if (openBraces > closeBraces) {
            fixedJson += '}'.repeat(openBraces - closeBraces);
          }
          if (openBrackets > closeBrackets) {
            fixedJson += ']'.repeat(openBrackets - closeBrackets);
          }
          
          let parsed = JSON.parse(fixedJson);
          console.warn('⚠️  JSON düzeltildi ve parse edildi');
          
          // Eğer düzeltilmiş JSON array ise, doğru formata dönüştür
          if (Array.isArray(parsed)) {
            parsed = {
              endpoints: parsed
            };
          }
          
          return parsed;
        } catch (fixError) {
          // Düzeltme de başarısız - hata fırlat
          throw new Error(`JSON parse hatası: ${parseError.message} (yanıt: ${cleanedText.substring(0, 100)}...)`);
        }
      }
    } catch (error) {
      console.error('Gemini API error in generateApiDocumentation:', error.message);
      if (error instanceof SyntaxError) {
        console.error('JSON parse hatası - API yanıtı:', error.message);
        throw new Error(`API dokümantasyonu üretimi başarısız: API'den geçersiz JSON yanıtı alındı`);
      }
      throw new Error(`API dokümantasyonu üretimi başarısız: ${error.message}`);
    }
  }
}
