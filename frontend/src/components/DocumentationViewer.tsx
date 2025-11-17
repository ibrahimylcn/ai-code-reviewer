import type { DocumentationResult } from '../types';

interface DocumentationViewerProps {
  result: DocumentationResult | null;
}

export default function DocumentationViewer({ result }: DocumentationViewerProps) {
  if (!result) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Dokümantasyon sonucu bulunamadı</p>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="text-center py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Hata oluştu</p>
          <p className="text-red-600 text-sm mt-1">{result.error}</p>
        </div>
      </div>
    );
  }

  if (!result.functions || result.functions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <svg className="mx-auto h-12 w-12 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>Fonksiyon dokümantasyonu bulunamadı</p>
        <p className="text-sm mt-2">Kodunuzda fonksiyon tespit edilemedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Fonksiyon Dokümantasyonu ({result.functions.length})
        </h3>
      </div>

      {result.functions.map((func, idx) => (
        <div
          key={idx}
          className="border border-slate-200 rounded-lg p-5 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-shadow"
        >
          {/* Function Name */}
          <div className="mb-4">
            <h4 className="text-xl font-bold text-primary-700 mb-2 font-mono">{func.name}</h4>
            <p className="text-slate-700 leading-relaxed">{func.description}</p>
          </div>

          {/* Parameters */}
          {func.parameters && func.parameters.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Parametreler
              </h5>
              <div className="space-y-2">
                {func.parameters.map((param, paramIdx) => (
                  <div
                    key={paramIdx}
                    className="pl-4 border-l-2 border-primary-300 bg-white p-3 rounded"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-primary-700">{param.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                        {param.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{param.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return Value */}
          {func.returns && (
            <div className="mb-4">
              <h5 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Dönüş Değeri
              </h5>
              <div className="pl-4 border-l-2 border-green-300 bg-white p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    {func.returns.type}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{func.returns.description}</p>
              </div>
            </div>
          )}

          {/* Examples */}
          {func.examples && func.examples.length > 0 && (
            <div>
              <h5 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Örnekler
              </h5>
              <div className="space-y-2">
                {func.examples.map((example, exampleIdx) => (
                  <div
                    key={exampleIdx}
                    className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm overflow-x-auto"
                  >
                    <pre className="whitespace-pre-wrap">{example}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

