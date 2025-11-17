export interface Bug {
  line: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
}

export interface CodeQuality {
  score: number;
  issues: string[];
}

export interface AnalysisResult {
  bugs?: Bug[];
  codeQuality?: CodeQuality;
  suggestions?: string[];
  error?: string;
}

export interface FunctionParameter {
  name: string;
  type: string;
  description: string;
}

export interface FunctionReturn {
  type: string;
  description: string;
}

export interface FunctionDocumentation {
  name: string;
  description: string;
  parameters: FunctionParameter[];
  returns: FunctionReturn;
  examples: string[];
}

export interface DocumentationResult {
  functions?: FunctionDocumentation[];
  error?: string;
}

export interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface Response {
  description: string;
  schema: string;
}

export interface EndpointExamples {
  request: string;
  response: string;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: EndpointParameter[];
  responses: Record<string, Response>;
  examples: EndpointExamples;
}

export interface ApiDocsResult {
  endpoints?: ApiEndpoint[];
  error?: string;
}

