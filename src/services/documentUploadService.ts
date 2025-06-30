import { v4 as uuidv4 } from 'uuid';

type StorageBucket = 'user' | 'team' | 'org' | 'lab' | 'snapshot';

interface DocumentUploadParams {
  files: File[]; // Array of files to upload
  bucketType: StorageBucket;
  bucketId?: string; // e.g., labId if bucketType is 'lab'
  // Add other relevant parameters like tags, metadata
}

interface UploadedDocumentInfo {
  documentId: string;
  fileName: string;
  storagePath: string; // Path in S3 or other storage
  contentType: string;
  size: number;
}

interface DocumentUploadResult {
  uploadJobId: string;
  uploadedDocuments: UploadedDocumentInfo[];
  errors: { fileName: string; message: string }[];
}

const API_BASE_URL = 'https://fast.futurity.science/tools'; // Or a dedicated /storage endpoint

class DocumentUploadService {
  private getAuthHeaders(token: string, isFormData: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  public generateUUID(): string {
    return uuidv4();
  }

  /**
   * Simulate calling the Document Upload API
   */
  async uploadDocuments(
    params: DocumentUploadParams,
    token: string
  ): Promise<DocumentUploadResult> {
    console.log('Uploading documents with params:', params);

    const formData = new FormData();
    params.files.forEach(file => {
      formData.append('files', file, file.name);
    });
    formData.append('bucketType', params.bucketType);
    if (params.bucketId) {
      formData.append('bucketId', params.bucketId);
    }
    // Append other metadata as needed

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000 + params.files.length * 500)); // Simulate upload time

    const mockUploadedDocuments: UploadedDocumentInfo[] = params.files.map(file => ({
      documentId: `doc_${this.generateUUID()}`,
      fileName: file.name,
      storagePath: `${params.bucketType}/${params.bucketId || 'general'}/${file.name}`,
      contentType: file.type,
      size: file.size,
    }));

    const mockResult: DocumentUploadResult = {
      uploadJobId: `uploadjob_${this.generateUUID()}`,
      uploadedDocuments: mockUploadedDocuments,
      errors: [], // Simulate no errors for now
    };

    // In a real scenario, you would use fetch with FormData:
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/document-upload`, { // Assuming this endpoint
        method: 'POST',
        headers: this.getAuthHeaders(token, true), // Important: true for FormData
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Document Upload API error:', errorText);
        // Attempt to parse error if JSON, otherwise use text
        let detail = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            detail = errorJson.detail || errorText;
        } catch (e) { /* not JSON * / }
        throw new Error(
          `Failed to upload documents: ${response.status} ${response.statusText} - ${detail}`
        );
      }

      const result: DocumentUploadResult = await response.json();
      return result;
    } catch (error) {
      console.error('Document Upload service error:', error);
      // Fallback or rethrow
      // throw error;
      console.warn("API call failed, returning mock data instead.");
      return mockResult;
    }
    */
    return mockResult;
  }
}

export const documentUploadService = new DocumentUploadService();