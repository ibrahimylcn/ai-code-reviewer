import type { ApiDocsResult } from '../types';

interface ApiDocsViewerProps {
  result: ApiDocsResult | null;
}

export default function ApiDocsViewer({ result }: ApiDocsViewerProps) {
  if (!result) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>API dokümantasyonu sonucu bulunamadı</p>
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

  if (!result.endpoints || result.endpoints.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <svg className="mx-auto h-12 w-12 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>API endpoint'i bulunamadı</p>
        <p className="text-sm mt-2">Kodunuzda API endpoint'i tespit edilemedi</p>
      </div>
    );
  }

  const getMethodColor = (method: string) => {
    const methodUpper = method.toUpperCase();
    switch (methodUpper) {
      case 'GET':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'POST':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          API Dokümantasyonu ({result.endpoints.length})
        </h3>
      </div>

      {result.endpoints.map((endpoint, idx) => (
        <div
          key={idx}
          className="border border-slate-200 rounded-lg p-5 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-shadow"
        >
          {/* Endpoint Header */}
          <div className="mb-4 flex items-center gap-3">
            <span className={`px-3 py-1 rounded font-semibold text-sm border ${getMethodColor(endpoint.method)}`}>
              {endpoint.method.toUpperCase()}
            </span>
            <code className="text-lg font-mono font-bold text-slate-900">{endpoint.path}</code>
          </div>

          {/* Description */}
          <p className="text-slate-700 mb-4 leading-relaxed">{endpoint.description}</p>

          {/* Parameters */}
          {endpoint.parameters && endpoint.parameters.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Parametreler
              </h5>
              <div className="space-y-2">
                {endpoint.parameters.map((param, paramIdx) => (
                  <div
                    key={paramIdx}
                    className="pl-4 border-l-2 border-primary-300 bg-white p-3 rounded"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-primary-700">{param.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                        {param.type}
                      </span>
                      {param.required && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                          Zorunlu
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{param.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responses */}
          {endpoint.responses && Object.keys(endpoint.responses).length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Yanıtlar
              </h5>
              <div className="space-y-2">
                {Object.entries(endpoint.responses).map(([statusCode, response]) => (
                  <div
                    key={statusCode}
                    className="pl-4 border-l-2 border-green-300 bg-white p-3 rounded"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-green-700">{statusCode}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{response.description}</p>
                    {response.schema && (
                      <div className="mt-2 bg-slate-900 text-slate-100 p-2 rounded font-mono text-xs overflow-x-auto">
                        <pre>{response.schema}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {endpoint.examples && (
            <div>
              <h5 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Örnekler
              </h5>
              <div className="space-y-3">
                {endpoint.examples.request && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Request:</p>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{endpoint.examples.request}</pre>
                    </div>
                  </div>
                )}
                {endpoint.examples.response && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Response:</p>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{endpoint.examples.response}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

