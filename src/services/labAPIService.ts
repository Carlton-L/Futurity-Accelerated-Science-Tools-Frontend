import { v4 as uuidv4 } from 'uuid';
import type {
  ApiLabData,
  ApiLabCategory,
  ApiLabSubject,
  MongoUUID,
  MongoObjectId,
} from '../pages/Lab/types';

const API_BASE_URL = 'https://tools.futurity.science/api/lab';

interface LabAPIResponse {
  success: boolean;
  data?: ApiLabData;
  error?: string;
  message?: string;
}

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
  subjects: any[];
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
   * Update lab data via API
   */
  async updateLab(
    labId: string,
    updateData: Partial<ApiLabData>,
    token: string
  ): Promise<ApiLabData> {
    try {
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

      if (!response.ok) {
        throw new Error(
          `Update failed: ${response.status} ${response.statusText}`
        );
      }

      const result: LabAPIResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Update failed');
      }

      if (!result.data) {
        throw new Error('No data returned from server');
      }

      return result.data;
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
    const updateData: Partial<ApiLabData> = {};

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
    const updateData: Partial<ApiLabData> = {};

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
    const updateData: Partial<ApiLabData> = {};

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
   * Add a new category
   */
  async addCategory(
    labId: string,
    categoryName: string,
    currentCategories: ApiLabCategory[],
    token: string
  ): Promise<ApiLabData> {
    const newCategory: ApiLabCategory = {
      id: this.generateMongoUUID(),
      name: categoryName,
    };

    const updateData: Partial<ApiLabData> = {
      categories: [...currentCategories, newCategory],
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Update category name
   */
  async updateCategoryName(
    labId: string,
    categoryId: string,
    newName: string,
    currentCategories: ApiLabCategory[],
    token: string
  ): Promise<ApiLabData> {
    const updatedCategories = currentCategories.map((cat) =>
      cat.id.$uuid === categoryId ? { ...cat, name: newName } : cat
    );

    const updateData: Partial<ApiLabData> = {
      categories: updatedCategories,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Remove a category
   */
  async removeCategory(
    labId: string,
    categoryId: string,
    moveSubjectsToUncategorized: boolean,
    currentCategories: ApiLabCategory[],
    currentSubjects: ApiLabSubject[],
    uncategorizedCategoryId: string,
    token: string
  ): Promise<ApiLabData> {
    // Remove the category
    const updatedCategories = currentCategories.filter(
      (cat) => cat.id.$uuid !== categoryId
    );

    let updatedSubjects = currentSubjects;

    if (moveSubjectsToUncategorized) {
      // Move subjects to uncategorized category
      updatedSubjects = currentSubjects.map((subject) =>
        subject.category.$uuid === categoryId
          ? { ...subject, category: { $uuid: uncategorizedCategoryId } }
          : subject
      );
    } else {
      // Remove subjects that were in this category
      updatedSubjects = currentSubjects.filter(
        (subject) => subject.category.$uuid !== categoryId
      );
    }

    const updateData: Partial<ApiLabData> = {
      categories: updatedCategories,
      subjects: updatedSubjects,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Add a subject to the lab
   */
  async addSubject(
    labId: string,
    subjectId: string,
    subjectSlug: string,
    subjectName: string,
    categoryId: string,
    currentSubjects: ApiLabSubject[],
    token: string
  ): Promise<ApiLabData> {
    const newSubject: ApiLabSubject = {
      subject_id: { $oid: subjectId },
      subject_slug: subjectSlug,
      subject_name: subjectName,
      category: { $uuid: categoryId },
    };

    const updateData: Partial<ApiLabData> = {
      subjects: [...currentSubjects, newSubject],
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Remove a subject from the lab
   */
  async removeSubject(
    labId: string,
    subjectId: string,
    currentSubjects: ApiLabSubject[],
    token: string
  ): Promise<ApiLabData> {
    const updatedSubjects = currentSubjects.filter(
      (subject) => subject.subject_id.$oid !== subjectId
    );

    const updateData: Partial<ApiLabData> = {
      subjects: updatedSubjects,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Move a subject to a different category
   */
  async moveSubjectToCategory(
    labId: string,
    subjectId: string,
    newCategoryId: string,
    currentSubjects: ApiLabSubject[],
    token: string
  ): Promise<ApiLabData> {
    const updatedSubjects = currentSubjects.map((subject) =>
      subject.subject_id.$oid === subjectId
        ? { ...subject, category: { $uuid: newCategoryId } }
        : subject
    );

    const updateData: Partial<ApiLabData> = {
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
    currentSubjects: ApiLabSubject[],
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
    const updateData: Partial<ApiLabData> = {
      ent_name: name,
      ent_summary: description,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Archive a lab
   */
  async archiveLab(labId: string, token: string): Promise<ApiLabData> {
    const updateData: Partial<ApiLabData> = {
      isArchived: true,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Unarchive a lab
   */
  async unarchiveLab(labId: string, token: string): Promise<ApiLabData> {
    const updateData: Partial<ApiLabData> = {
      isArchived: false,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Delete a lab (soft delete)
   */
  async deleteLab(labId: string, token: string): Promise<ApiLabData> {
    const updateData: Partial<ApiLabData> = {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Restore a deleted lab
   */
  async restoreLab(labId: string, token: string): Promise<ApiLabData> {
    const updateData: Partial<ApiLabData> = {
      isDeleted: false,
      deletedAt: null,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Batch update multiple fields
   */
  async batchUpdate(
    labId: string,
    updates: {
      categories?: ApiLabCategory[];
      subjects?: ApiLabSubject[];
      include_terms?: string[];
      exclude_terms?: string[];
      [key: string]: any;
    },
    token: string
  ): Promise<ApiLabData> {
    return this.updateLab(labId, updates, token);
  }

  /**
   * Add multiple subjects at once
   */
  async addSubjects(
    labId: string,
    subjects: Array<{
      subjectId: string;
      subjectSlug: string;
      subjectName: string;
      categoryId: string;
    }>,
    currentSubjects: ApiLabSubject[],
    token: string
  ): Promise<ApiLabData> {
    const newSubjects: ApiLabSubject[] = subjects.map((subject) => ({
      subject_id: { $oid: subject.subjectId },
      subject_slug: subject.subjectSlug,
      subject_name: subject.subjectName,
      category: { $uuid: subject.categoryId },
    }));

    const updateData: Partial<ApiLabData> = {
      subjects: [...currentSubjects, ...newSubjects],
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Remove multiple subjects at once
   */
  async removeSubjects(
    labId: string,
    subjectIds: string[],
    currentSubjects: ApiLabSubject[],
    token: string
  ): Promise<ApiLabData> {
    const updatedSubjects = currentSubjects.filter(
      (subject) => !subjectIds.includes(subject.subject_id.$oid)
    );

    const updateData: Partial<ApiLabData> = {
      subjects: updatedSubjects,
    };

    return this.updateLab(labId, updateData, token);
  }

  /**
   * Update multiple categories at once
   */
  async updateCategories(
    labId: string,
    categories: ApiLabCategory[],
    token: string
  ): Promise<ApiLabData> {
    const updateData: Partial<ApiLabData> = {
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
    const updateData: Partial<ApiLabData> = {
      include_terms: includeTerms,
      exclude_terms: excludeTerms,
    };

    return this.updateLab(labId, updateData, token);
  }
}

export const labAPIService = new LabAPIService();
