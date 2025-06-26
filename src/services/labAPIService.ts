import { v4 as uuidv4 } from 'uuid';
import type {
  ApiLabData,
  LabUpdateRequest,
  MongoUUID,
  MongoObjectId,
} from '../pages/Lab/types';

const API_BASE_URL = 'https://tools.futurity.science/api/lab';

// TODO: Update this type when the API response is fixed to match the correct MongoDB structure
interface LabApiResponse {
  _id: string;
  ent_name: string;
  ent_summary: string | null;
  picture_url: string | null;
  thumb_url: string | null;
  owner_guid: string;
  teamspace_id: string;
  members: Array<{
    user_id: string;
    role: string;
  }>;
  kbid: string | null;
  categories: Array<{
    id: string;
    name: string;
  }>;
  exclude_terms: string[];
  include_terms: string[];
  subjects: Array<{
    subject_id: string;
    subject_name?: string;
    name?: string;
    category: string | null;
    ent_fsid: string;
  }>;
  analyses: string[];
  goals: Array<{
    id: string;
    target_user_group: string;
    problem_statement: string;
    impact_score: number;
  }>;
  miro_board_url: string | null;
  idea_seeds: any[];
  isArchived: number;
  isDeleted: number;
  deletedAt: string | null;
}

class LabAPIService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Generate a new UUID for categories and other objects
   */
  public generateUUID(): string {
    return uuidv4();
  }

  /**
   * Generate MongoDB UUID object
   */
  public generateMongoUUID(): MongoUUID {
    return { $uuid: this.generateUUID() };
  }

  /**
   * Generate MongoDB ObjectId object (for subjects)
   */
  public generateMongoObjectId(id: string): MongoObjectId {
    return { $oid: id };
  }

  /**
   * Get a single lab by ID
   */
  async getLab(labId: string, token: string): Promise<ApiLabData> {
    try {
      const response = await fetch(`${API_BASE_URL}/view?lab_id=${labId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to access this lab.');
      }

      if (response.status === 404) {
        throw new Error('Lab not found.');
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch lab: ${response.status} ${response.statusText}`
        );
      }

      const labData: ApiLabData = await response.json();
      return labData;
    } catch (error) {
      console.error('Get lab error:', error);
      throw error;
    }
  }

  /**
   * List labs for a teamspace
   */
  async listLabs(
    teamspaceId: string,
    token: string
  ): Promise<LabApiResponse[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/list?teamspace_id=${teamspaceId}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(token),
        }
      );

      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error(
          'You do not have permission to view labs in this teamspace.'
        );
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch labs: ${response.status} ${response.statusText}`
        );
      }

      const labs: LabApiResponse[] = await response.json();

      // Filter out archived and deleted labs for the dropdown
      // TODO: When API is fixed to return correct structure, update this filtering
      const activeLabs = labs.filter(
        (lab) => lab.isArchived === 0 && lab.isDeleted === 0
      );

      return activeLabs;
    } catch (error) {
      console.error('List labs error:', error);
      throw error;
    }
  }

  /**
   * Update lab data via API - Updated to match actual API structure
   */
  async updateLab(
    labId: string,
    updateData: Partial<LabUpdateRequest>,
    token: string
  ): Promise<ApiLabData> {
    try {
      console.log(
        'Updating lab with data:',
        JSON.stringify(updateData, null, 2)
      );

      const response = await fetch(`${API_BASE_URL}/update?lab_id=${labId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(updateData),
      });

      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to update this lab.');
      }

      if (response.status === 404) {
        throw new Error('Lab not found or update endpoint not available.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed response:', errorText);
        throw new Error(
          `Update failed: ${response.status} ${response.statusText}`
        );
      }

      // The API might return the updated lab data directly, or in a wrapper
      const result = await response.json();

      // Handle different response formats
      if (result.success !== undefined) {
        // Wrapped response
        if (!result.success) {
          throw new Error(result.error || 'Update failed');
        }
        if (!result.data) {
          throw new Error('No data returned from server');
        }
        return result.data;
      } else {
        // Direct response
        return result as ApiLabData;
      }
    } catch (error) {
      console.error('Lab update failed:', error);
      throw error;
    }
  }

  /**
   * Add a new term to include or exclude list
   */
  async addTerm(
    labId: string,
    term: string,
    type: 'include' | 'exclude',
    currentIncludeTerms: string[],
    currentExcludeTerms: string[],
    token: string
  ): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {};

    if (type === 'include') {
      updateData.include_terms = [...currentIncludeTerms, term];
    } else {
      updateData.exclude_terms = [...currentExcludeTerms, term];
    }

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Remove a term from include or exclude list
   */
  async removeTerm(
    labId: string,
    term: string,
    type: 'include' | 'exclude',
    currentIncludeTerms: string[],
    currentExcludeTerms: string[],
    token: string
  ): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {};

    if (type === 'include') {
      updateData.include_terms = currentIncludeTerms.filter((t) => t !== term);
    } else {
      updateData.exclude_terms = currentExcludeTerms.filter((t) => t !== term);
    }

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Switch a term from include to exclude or vice versa
   */
  async switchTermType(
    labId: string,
    term: string,
    fromType: 'include' | 'exclude',
    currentIncludeTerms: string[],
    currentExcludeTerms: string[],
    token: string
  ): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {};

    if (fromType === 'include') {
      // Move from include to exclude
      updateData.include_terms = currentIncludeTerms.filter((t) => t !== term);
      updateData.exclude_terms = [...currentExcludeTerms, term];
    } else {
      // Move from exclude to include
      updateData.exclude_terms = currentExcludeTerms.filter((t) => t !== term);
      updateData.include_terms = [...currentIncludeTerms, term];
    }

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Add a new category - Updated to match API format
   */
  async addCategory(
    labId: string,
    categoryName: string,
    currentCategories: Array<{ id: string; name: string }>,
    token: string
  ): Promise<ApiLabData> {
    const newCategory = {
      id: this.generateUUID(), // Generate simple UUID string
      name: categoryName,
    };

    const updateData: Partial<LabUpdateRequest> = {
      categories: [...currentCategories, newCategory],
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Update category name - Updated to match API format
   */
  async updateCategoryName(
    labId: string,
    categoryId: string,
    newName: string,
    currentCategories: Array<{ id: string; name: string }>,
    token: string
  ): Promise<ApiLabData> {
    const updatedCategories = currentCategories.map((cat) =>
      cat.id === categoryId ? { ...cat, name: newName } : cat
    );

    const updateData: Partial<LabUpdateRequest> = {
      categories: updatedCategories,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Remove a category - Updated to match API format
   */
  async removeCategory(
    labId: string,
    categoryId: string,
    moveSubjectsToUncategorized: boolean,
    currentCategories: Array<{ id: string; name: string }>,
    currentSubjects: Array<{
      subject_id: string;
      subject_name?: string;
      name?: string;
      category: string | null;
      ent_fsid: string;
    }>,
    uncategorizedCategoryId: string,
    token: string
  ): Promise<ApiLabData> {
    console.log('Removing category:', {
      categoryId,
      moveSubjectsToUncategorized,
      currentCategories,
      currentSubjects,
      uncategorizedCategoryId,
    });

    // Remove the category from the categories list
    const updatedCategories = currentCategories.filter(
      (cat) => cat.id !== categoryId
    );

    let updatedSubjects = currentSubjects;

    if (moveSubjectsToUncategorized) {
      // Move subjects to uncategorized category (set category to null)
      updatedSubjects = currentSubjects.map((subject) => {
        if (subject.category === categoryId) {
          return {
            ...subject,
            category: null, // null means uncategorized
          };
        }
        return subject;
      });
    } else {
      // Remove subjects that were in this category
      updatedSubjects = currentSubjects.filter(
        (subject) => subject.category !== categoryId
      );
    }

    console.log('Updated subjects after category removal:', updatedSubjects);

    const updateData: Partial<LabUpdateRequest> = {
      categories: updatedCategories,
      subjects: updatedSubjects,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Add a subject to the lab - Updated to match API format
   */
  async addSubject(
    labId: string,
    subjectId: string,
    subjectSlug: string,
    subjectName: string,
    categoryId: string,
    currentSubjects: Array<{
      subject_id: string;
      subject_name?: string;
      name?: string;
      category: string | null;
      ent_fsid: string;
    }>,
    token: string
  ): Promise<ApiLabData> {
    const newSubject = {
      subject_id: subjectId, // Simple string
      subject_name: subjectName,
      category: categoryId === 'uncategorized' ? null : categoryId, // null for uncategorized
      ent_fsid: subjectSlug.startsWith('fsid_')
        ? subjectSlug
        : `fsid_${subjectSlug}`,
    };

    const updateData: Partial<LabUpdateRequest> = {
      subjects: [...currentSubjects, newSubject],
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Remove a subject from the lab - Updated to match API format
   */
  async removeSubject(
    labId: string,
    subjectId: string,
    currentSubjects: Array<{
      subject_id: string;
      subject_name?: string;
      name?: string;
      category: string | null;
      ent_fsid: string;
    }>,
    token: string
  ): Promise<ApiLabData> {
    const updatedSubjects = currentSubjects.filter(
      (subject) => subject.subject_id !== subjectId
    );

    const updateData: Partial<LabUpdateRequest> = {
      subjects: updatedSubjects,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Move a subject to a different category - CRITICAL FIX
   */
  async moveSubjectToCategory(
    labId: string,
    subjectId: string,
    newCategoryId: string,
    currentApiSubjects: Array<{
      subject_id: string;
      subject_name?: string;
      name?: string;
      category: string | null;
      ent_fsid: string;
    }>,
    token: string
  ): Promise<ApiLabData> {
    console.log('Moving subject to category:', {
      subjectId,
      newCategoryId,
      currentApiSubjects,
    });

    // Create the updated subjects array with the correct format
    const updatedSubjects = currentApiSubjects.map((subject) => {
      if (subject.subject_id === subjectId) {
        return {
          subject_id: subject.subject_id, // Keep the original subject ID
          subject_name: subject.subject_name || subject.name, // Preserve name
          category: newCategoryId === 'uncategorized' ? null : newCategoryId, // null for uncategorized
          ent_fsid: subject.ent_fsid, // Keep the original ent_fsid
        };
      }
      return {
        subject_id: subject.subject_id,
        subject_name: subject.subject_name || subject.name,
        category: subject.category,
        ent_fsid: subject.ent_fsid,
      };
    });

    console.log('Updated subjects for API:', updatedSubjects);

    // Send ONLY the subjects array to minimize chance of corruption
    const updateData: Partial<LabUpdateRequest> = {
      subjects: updatedSubjects,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Remove category from subject (set to uncategorized)
   */
  async removeSubjectCategory(
    labId: string,
    subjectId: string,
    uncategorizedCategoryId: string,
    currentSubjects: Array<{
      subject_id: string;
      subject_name?: string;
      name?: string;
      category: string | null;
      ent_fsid: string;
    }>,
    token: string
  ): Promise<ApiLabData> {
    return this.moveSubjectToCategory(
      labId,
      subjectId,
      uncategorizedCategoryId,
      currentSubjects,
      token
    );
  }

  /**
   * Update lab name and description
   */
  async updateLabInfo(
    labId: string,
    name: string,
    description: string,
    token: string
  ): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {
      ent_name: name,
      ent_summary: description,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Archive a lab
   */
  async archiveLab(labId: string, token: string): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {
      isArchived: 1, // API expects number
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Unarchive a lab
   */
  async unarchiveLab(labId: string, token: string): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {
      isArchived: 0, // API expects number
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Delete a lab (soft delete)
   */
  async deleteLab(labId: string, token: string): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {
      isDeleted: 1, // API expects number
      deletedAt: new Date().toISOString(),
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Restore a deleted lab
   */
  async restoreLab(labId: string, token: string): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {
      isDeleted: 0, // API expects number
      deletedAt: null,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Batch update multiple fields
   */
  async batchUpdate(
    labId: string,
    updates: Partial<LabUpdateRequest>,
    token: string
  ): Promise<ApiLabData> {
    return this.updateLab(labId, updates, token);
  }

  /**
   * Add multiple subjects at once - Updated to match API format
   */
  async addSubjects(
    labId: string,
    subjects: Array<{
      subjectId: string;
      subjectSlug: string;
      subjectName: string;
      categoryId: string;
    }>,
    currentSubjects: Array<{
      subject_id: string;
      subject_name?: string;
      name?: string;
      category: string | null;
      ent_fsid: string;
    }>,
    token: string
  ): Promise<ApiLabData> {
    const newSubjects = subjects.map((subject) => ({
      subject_id: subject.subjectId, // Simple string
      subject_name: subject.subjectName,
      category:
        subject.categoryId === 'uncategorized' ? null : subject.categoryId, // null for uncategorized
      ent_fsid: subject.subjectSlug.startsWith('fsid_')
        ? subject.subjectSlug
        : `fsid_${subject.subjectSlug}`,
    }));

    const updateData: Partial<LabUpdateRequest> = {
      subjects: [...currentSubjects, ...newSubjects],
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Remove multiple subjects at once - Updated to match API format
   */
  async removeSubjects(
    labId: string,
    subjectIds: string[],
    currentSubjects: Array<{
      subject_id: string;
      subject_name?: string;
      name?: string;
      category: string | null;
      ent_fsid: string;
    }>,
    token: string
  ): Promise<ApiLabData> {
    const updatedSubjects = currentSubjects.filter(
      (subject) => !subjectIds.includes(subject.subject_id)
    );

    const updateData: Partial<LabUpdateRequest> = {
      subjects: updatedSubjects,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Update multiple categories at once - Updated to match API format
   */
  async updateCategories(
    labId: string,
    categories: Array<{ id: string; name: string }>,
    token: string
  ): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {
      categories,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Update lab terms (both include and exclude)
   */
  async updateTerms(
    labId: string,
    includeTerms: string[],
    excludeTerms: string[],
    token: string
  ): Promise<ApiLabData> {
    const updateData: Partial<LabUpdateRequest> = {
      include_terms: includeTerms,
      exclude_terms: excludeTerms,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Helper method to get current API format subjects from lab data
   */
  getApiSubjectsFromLab(lab: any): Array<{
    subject_id: string;
    subject_name?: string;
    name?: string;
    category: string | null;
    ent_fsid: string;
  }> {
    return lab.subjects.map((subject: any) => ({
      subject_id: subject.subjectId, // Use the actual subject ID
      subject_name: subject.subjectName, // Use subject_name field
      category:
        subject.categoryId === 'uncategorized' ? null : subject.categoryId, // null for uncategorized
      ent_fsid: subject.subjectSlug.startsWith('fsid_')
        ? subject.subjectSlug
        : `fsid_${subject.subjectSlug}`, // Ensure fsid_ prefix
    }));
  }
}

export const labAPIService = new LabAPIService();
