import type { AnalysisResult } from '../types';

interface AnalysisResultsProps {
  result: AnalysisResult | null;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  if (!result) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Analiz sonucu bulunamadı</p>
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return severity;
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Code Quality Score */}
      {result.codeQuality && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-4 rounded-lg border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Kod Kalitesi Skoru</h3>
              <p className="text-sm text-slate-600">Genel kod kalitesi değerlendirmesi</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getQualityColor(result.codeQuality.score)}`}>
                {result.codeQuality.score}
              </div>
              <div className="text-sm text-slate-600">/ 100</div>
            </div>
          </div>
          {result.codeQuality.issues && result.codeQuality.issues.length > 0 && (
            <div className="mt-4 pt-4 border-t border-primary-200">
              <p className="text-sm font-medium text-slate-700 mb-2">Tespit Edilen Sorunlar:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                {result.codeQuality.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bugs */}
      {result.bugs && result.bugs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Tespit Edilen Bug'lar ({result.bugs.length})
          </h3>
          <div className="space-y-4">
            {result.bugs.map((bug, idx) => (
              <div
                key={idx}
                className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(bug.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded">
                      {getSeverityLabel(bug.severity)}
                    </span>
                    <span className="text-sm font-medium">Satır {bug.line}</span>
                  </div>
                </div>
                <p className="mb-2 font-medium">{bug.message}</p>
                {bug.suggestion && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                    <p className="text-sm font-medium mb-1">Öneri:</p>
                    <p className="text-sm opacity-90">{bug.suggestion}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions && result.suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Genel Öneriler ({result.suggestions.length})
          </h3>
          <div className="space-y-2">
            {result.suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <p className="text-sm text-slate-700">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!result.bugs || result.bugs.length === 0) &&
        (!result.suggestions || result.suggestions.length === 0) && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">Kodunuzda kritik bir sorun tespit edilmedi!</p>
          </div>
        )}
    </div>
  );
}

