import { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import AnalysisResults from './components/AnalysisResults';
import DocumentationViewer from './components/DocumentationViewer';
import ApiDocsViewer from './components/ApiDocsViewer';
import { CodeAnalysisService } from './services/codeAnalysisService';
import type { AnalysisResult, DocumentationResult, ApiDocsResult } from './types';

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [documentationResult, setDocumentationResult] = useState<DocumentationResult | null>(null);
  const [apiDocsResult, setApiDocsResult] = useState<ApiDocsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'documentation' | 'api-docs'>('analysis');

  const codeAnalysisService = new CodeAnalysisService();

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Lütfen analiz edilecek kod girin');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setDocumentationResult(null);
    setApiDocsResult(null);

    try {
      const result = await codeAnalysisService.performFullAnalysis(code, language);
      
      // Hata durumlarını kontrol et ve göster
      const errors = [];
      
      if (result.analysis) {
        if (result.analysis.error) {
          errors.push(`Analiz hatası: ${result.analysis.error}`);
        } else {
          setAnalysisResult(result.analysis);
        }
      }
      
      if (result.documentation) {
        if (result.documentation.error) {
          errors.push(`Dokümantasyon hatası: ${result.documentation.error}`);
        } else {
          setDocumentationResult(result.documentation);
        }
      }
      
      if (result.apiDocumentation) {
        if (result.apiDocumentation.error) {
          errors.push(`API dokümantasyonu hatası: ${result.apiDocumentation.error}`);
        } else {
          setApiDocsResult(result.apiDocumentation);
        }
      }

      // Eğer tüm analizler başarısız olduysa hata göster
      if (errors.length > 0 && !result.analysis && !result.documentation && !result.apiDocumentation) {
        const errorText = errors.join('\n\n');
        setError(errorText);
        console.error('Tüm analizler başarısız:', errors);
      } else if (errors.length > 0) {
        // Bazı analizler başarılı, bazıları başarısız - uyarı göster
        const errorText = 'Bazı analizler başarısız oldu:\n\n' + errors.join('\n\n');
        setError(errorText);
        console.warn('Bazı analizler başarısız oldu:', errors);
      }

      // İlk başarılı sonuç geldiğinde ilgili tab'ı göster
      if (result.analysis && !result.analysis.error) {
        setActiveTab('analysis');
      } else if (result.documentation && !result.documentation.error) {
        setActiveTab('documentation');
      } else if (result.apiDocumentation && !result.apiDocumentation.error) {
        setActiveTab('api-docs');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analiz sırasında bir hata oluştu';
      setError(errorMessage);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Kod İnceleme Paneli</h1>
              <p className="text-sm text-slate-600 mt-1">Yapay zeka destekli kod analizi ve dokümantasyon</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
              <button
                onClick={handleAnalyze}
                disabled={loading || !code.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analiz Ediliyor...
                  </>
                ) : (
                  'Kodu Analiz Et'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol taraf - Kod Editörü */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Kod Editörü</h2>
            </div>
            <CodeEditor
              code={code}
              language={language}
              onChange={setCode}
            />
          </div>

          {/* Sağ taraf - Sonuçlar */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'analysis'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Bug Analizi
                </button>
                <button
                  onClick={() => setActiveTab('documentation')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'documentation'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Dokümantasyon
                </button>
                <button
                  onClick={() => setActiveTab('api-docs')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'api-docs'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  API Docs
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[600px] overflow-y-auto">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-2">Hata Oluştu</h4>
                      <pre className="text-sm text-red-800 whitespace-pre-wrap font-sans">{error}</pre>
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-xs text-red-700 font-medium mb-1">Çözüm önerileri:</p>
                        <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
                          <li>İnternet bağlantınızı kontrol edin</li>
                          <li>API key'inizin geçerli olduğundan emin olun</li>
                          <li>Firewall/proxy ayarlarınızı kontrol edin</li>
                          <li>Sayfayı yenileyip tekrar deneyin</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-600">Analiz yapılıyor...</p>
                  </div>
                </div>
              )}

              {!loading && !error && (
                <>
                  {activeTab === 'analysis' && (
                    <AnalysisResults result={analysisResult} />
                  )}
                  {activeTab === 'documentation' && (
                    <DocumentationViewer result={documentationResult} />
                  )}
                  {activeTab === 'api-docs' && (
                    <ApiDocsViewer result={apiDocsResult} />
                  )}
                </>
              )}

              {!loading && !error && !analysisResult && !documentationResult && !apiDocsResult && (
                <div className="text-center py-12 text-slate-500">
                  <svg className="mx-auto h-12 w-12 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Kod analizi sonuçları burada görünecek</p>
                  <p className="text-sm mt-2">Kodunuzu girin ve "Kodu Analiz Et" butonuna tıklayın</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

