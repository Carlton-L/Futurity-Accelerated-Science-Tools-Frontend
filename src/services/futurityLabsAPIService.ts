import type { FuturityLab } from '../pages/FuturityLab/types';

const API_BASE_URL = 'https://tools.futurity.science/api/futurity-lab';

class FuturityLabsAPIService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Get list of all Futurity Labs
   */
  async listFuturityLabs(token: string): Promise<FuturityLab[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/list`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to view Futurity Labs.');
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch Futurity Labs: ${response.status} ${response.statusText}`
        );
      }

      const labs: FuturityLab[] = await response.json();
      return labs;
    } catch (error) {
      console.error('List Futurity Labs error:', error);
      throw error;
    }
  }

  /**
   * Get a single Futurity Lab by ent_fsid
   */
  async getFuturityLab(entFsid: string, token: string): Promise<FuturityLab> {
    try {
      const response = await fetch(`${API_BASE_URL}/view?ent_fsid=${entFsid}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error(
          'You do not have permission to view this Futurity Lab.'
        );
      }

      if (response.status === 404) {
        throw new Error('Futurity Lab not found.');
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch Futurity Lab: ${response.status} ${response.statusText}`
        );
      }

      const lab: FuturityLab = await response.json();
      return lab;
    } catch (error) {
      console.error('Get Futurity Lab error:', error);
      throw error;
    }
  }
}

export const futurityLabsAPIService = new FuturityLabsAPIService();
