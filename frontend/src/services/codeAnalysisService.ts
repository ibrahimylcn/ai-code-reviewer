import axios from 'axios';
import type { AnalysisResult, DocumentationResult, ApiDocsResult } from '../types';

const API_BASE_URL = '/api/code-analysis';

export class CodeAnalysisService {
  /**
   * Kapsamlı kod analizi yapar - tüm analiz türlerini birleştirir
   */
  async performFullAnalysis(code: string, language: string = 'javascript') {
    try {
      const response = await axios.post<{
        analysis: AnalysisResult;
        documentation: DocumentationResult;
        apiDocumentation: ApiDocsResult;
        timestamp: string;
      }>(`${API_BASE_URL}/full`, { code, language });
      return response.data;
    } catch (error) {
      // Axios error handling
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || error.message || 'Kod analizi sırasında bir hata oluştu';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Sadece bug detection yapar
   */
  async detectBugs(code: string, language: string = 'javascript') {
    const response = await axios.post<AnalysisResult & { timestamp: string }>(
      `${API_BASE_URL}/bugs`,
      { code, language }
    );
    return response.data;
  }

  /**
   * Fonksiyon dokümantasyonu üretir
   */
  async generateDocumentation(code: string, language: string = 'javascript') {
    const response = await axios.post<DocumentationResult & { timestamp: string }>(
      `${API_BASE_URL}/documentation`,
      { code, language }
    );
    return response.data;
  }

  /**
   * API dokümantasyonu üretir
   */
  async generateApiDocs(code: string, language: string = 'javascript') {
    const response = await axios.post<ApiDocsResult & { timestamp: string }>(
      `${API_BASE_URL}/api-docs`,
      { code, language }
    );
    return response.data;
  }
}

