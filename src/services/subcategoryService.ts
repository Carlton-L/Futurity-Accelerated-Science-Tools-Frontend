// services/subcategoryService.ts

const API_BASE_URL = 'https://fast.futurity.science/management';

// Type definitions for subcategory management APIs
export interface CreateSubcategoryRequest {
  name: string;
  lab_id: string;
  metadata: Record<string, any>;
}

export interface CreateSubcategoryResponse {
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  metadata: Record<string, any>;
  status: string;
  createdAt: string;
  updatedAt: string;
  _id: string;
}

export interface AssignSubjectsRequest {
  subject_fsids: string[];
  lab_id: string;
  subcategory_id?: string; // Optional - if not provided, assigns to lab (uncategorized)
}

export interface AssignSubjectsResponse {
  success: boolean;
  message: string;
  assigned_subjects?: string[];
}

class SubcategoryService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Create a new subcategory
   * @param name - Name of the subcategory
   * @param labId - Lab ID where the subcategory will be created
   * @param token - Authentication token
   * @param metadata - Optional metadata object
   * @returns Promise<CreateSubcategoryResponse>
   */
  async createSubcategory(
    name: string,
    labId: string,
    token: string,
    metadata: Record<string, any> = {}
  ): Promise<CreateSubcategoryResponse> {
    try {
      console.log('Creating subcategory:', { name, labId });

      const requestBody: CreateSubcategoryRequest = {
        name: name.trim(),
        lab_id: labId,
        metadata,
      };

      const response = await fetch(`${API_BASE_URL}/subcategories/`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error(
            'You do not have permission to create subcategories.'
          );
        }
        if (response.status === 409) {
          throw new Error('A subcategory with this name already exists.');
        }
        throw new Error(
          `Failed to create subcategory: ${response.status} ${response.statusText}`
        );
      }

      const data: CreateSubcategoryResponse = await response.json();
      console.log('Successfully created subcategory:', data);
      return data;
    } catch (error) {
      console.error('Create subcategory error:', error);
      throw error;
    }
  }

  /**
   * Delete a subcategory
   * @param subcategoryId - The uniqueID of the subcategory to delete
   * @param token - Authentication token
   * @returns Promise<void>
   */
  async deleteSubcategory(subcategoryId: string, token: string): Promise<void> {
    try {
      console.log('Deleting subcategory:', subcategoryId);

      const response = await fetch(
        `${API_BASE_URL}/subcategories/${subcategoryId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error(
            'You do not have permission to delete this subcategory.'
          );
        }
        if (response.status === 404) {
          throw new Error('Subcategory not found.');
        }
        throw new Error(
          `Failed to delete subcategory: ${response.status} ${response.statusText}`
        );
      }

      console.log('Successfully deleted subcategory');
    } catch (error) {
      console.error('Delete subcategory error:', error);
      throw error;
    }
  }

  /**
   * Assign subjects to a subcategory or lab (uncategorized)
   * @param subjectFsids - Array of subject fsids to assign
   * @param labId - Lab ID
   * @param token - Authentication token
   * @param subcategoryId - Optional subcategory ID. If not provided, assigns to lab (uncategorized)
   * @returns Promise<AssignSubjectsResponse>
   */
  async assignSubjects(
    subjectFsids: string[],
    labId: string,
    token: string,
    subcategoryId?: string
  ): Promise<AssignSubjectsResponse> {
    try {
      console.log('Assigning subjects:', {
        subjectFsids,
        labId,
        subcategoryId,
      });

      const requestBody: AssignSubjectsRequest = {
        subject_fsids: subjectFsids,
        lab_id: labId,
      };

      // Add subcategory_id if provided
      if (subcategoryId) {
        requestBody.subcategory_id = subcategoryId;
      }

      const response = await fetch(
        `${API_BASE_URL}/subject-management/assign`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to assign subjects.');
        }
        if (response.status === 404) {
          throw new Error('Lab or subcategory not found.');
        }
        throw new Error(
          `Failed to assign subjects: ${response.status} ${response.statusText}`
        );
      }

      // Try to parse response, but handle cases where it might be empty
      let data: AssignSubjectsResponse;
      const responseText = await response.text();

      if (responseText.trim() === '') {
        // Empty response means success
        data = {
          success: true,
          message: 'Successfully assigned subjects',
          assigned_subjects: subjectFsids,
        };
      } else {
        try {
          data = JSON.parse(responseText);
        } catch (_parseError) {
          // If response isn't JSON, assume success since status was ok
          data = {
            success: true,
            message: 'Successfully assigned subjects',
            assigned_subjects: subjectFsids,
          };
        }
      }

      console.log('Successfully assigned subjects:', data);
      return data;
    } catch (error) {
      console.error('Assign subjects error:', error);
      throw error;
    }
  }

  /**
   * Move subjects to uncategorized (assign to lab without subcategory)
   * @param subjectFsids - Array of subject fsids to move
   * @param labId - Lab ID
   * @param token - Authentication token
   * @returns Promise<AssignSubjectsResponse>
   */
  async moveSubjectsToUncategorized(
    subjectFsids: string[],
    labId: string,
    token: string
  ): Promise<AssignSubjectsResponse> {
    return this.assignSubjects(subjectFsids, labId, token);
  }

  /**
   * Move subjects between subcategories
   * @param subjectFsids - Array of subject fsids to move
   * @param labId - Lab ID
   * @param fromSubcategoryId - Source subcategory ID (can be 'uncategorized')
   * @param toSubcategoryId - Destination subcategory ID (can be 'uncategorized')
   * @param token - Authentication token
   * @returns Promise<AssignSubjectsResponse>
   */
  async moveSubjectsBetweenSubcategories(
    subjectFsids: string[],
    labId: string,
    fromSubcategoryId: string,
    toSubcategoryId: string,
    token: string
  ): Promise<AssignSubjectsResponse> {
    // If moving to uncategorized, don't provide subcategory_id
    if (toSubcategoryId === 'uncategorized') {
      return this.moveSubjectsToUncategorized(subjectFsids, labId, token);
    }

    // Otherwise, assign to the specific subcategory
    return this.assignSubjects(subjectFsids, labId, token, toSubcategoryId);
  }

  /**
   * Add new subjects to a lab (they will go to uncategorized by default)
   * @param subjectFsids - Array of subject fsids to add
   * @param labId - Lab ID
   * @param token - Authentication token
   * @returns Promise<AssignSubjectsResponse>
   */
  async addSubjectsToLab(
    subjectFsids: string[],
    labId: string,
    token: string
  ): Promise<AssignSubjectsResponse> {
    return this.assignSubjects(subjectFsids, labId, token);
  }

  /**
   * Helper function to normalize subject fsids (ensure they have fsid_ prefix)
   * @param fsidOrSlug - Either a full fsid or just the slug part
   * @returns Normalized fsid with fsid_ prefix
   */
  normalizeSubjectFsid(fsidOrSlug: string): string {
    if (fsidOrSlug.startsWith('fsid_')) {
      return fsidOrSlug;
    }
    return `fsid_${fsidOrSlug}`;
  }

  /**
   * Helper function to extract slug from fsid
   * @param fsid - Full fsid with fsid_ prefix
   * @returns Just the slug part without fsid_ prefix
   */
  extractSlugFromFsid(fsid: string): string {
    if (fsid.startsWith('fsid_')) {
      return fsid.substring(5);
    }
    return fsid;
  }

  /**
   * Batch operation: Delete subcategory and optionally reassign its subjects
   * @param subcategoryId - The uniqueID of the subcategory to delete
   * @param subjectFsids - Array of subject fsids in the subcategory
   * @param labId - Lab ID
   * @param token - Authentication token
   * @param moveSubjectsToUncategorized - Whether to move subjects to uncategorized
   * @returns Promise<void>
   */
  async deleteSubcategoryWithSubjects(
    subcategoryId: string,
    subjectFsids: string[],
    labId: string,
    token: string,
    moveSubjectsToUncategorized: boolean = true
  ): Promise<void> {
    try {
      // First, handle subjects if requested and there are any
      if (moveSubjectsToUncategorized && subjectFsids.length > 0) {
        console.log(
          'Moving subjects to uncategorized before deleting category'
        );
        await this.moveSubjectsToUncategorized(subjectFsids, labId, token);
      }

      // Then delete the subcategory
      console.log('Deleting subcategory');
      await this.deleteSubcategory(subcategoryId, token);

      console.log(
        'Successfully completed subcategory deletion with subject handling'
      );
    } catch (error) {
      console.error('Failed to delete subcategory with subjects:', error);
      throw error;
    }
  }
}

export const subcategoryService = new SubcategoryService();
