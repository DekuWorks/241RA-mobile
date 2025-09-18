import { ApiClient } from './apiClient';

export interface Case {
  id: string;
  title: string;
  description: string;
  status: 'missing' | 'urgent' | 'resolved' | 'found';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
  };
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  reportedAt: string;
  lastSeenAt?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  physicalDescription?: string;
  clothingDescription?: string;
  images?: string[];
  tags?: string[];
  isPublic: boolean;
  updatedAt: string;
}

export interface CaseFilters {
  status?: Case['status'][];
  priority?: Case['priority'][];
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in miles
  };
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateSightingData {
  caseId: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  images?: string[];
  confidence?: 'low' | 'medium' | 'high';
  reportedAt: string;
}

export class CasesService {
  static async getCases(
    filters?: CaseFilters
  ): Promise<{ cases: Case[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();

    if (filters?.status) {
      filters.status.forEach(status => params.append('status', status));
    }
    if (filters?.priority) {
      filters.priority.forEach(priority => params.append('priority', priority));
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.location) {
      params.append('latitude', filters.location.latitude.toString());
      params.append('longitude', filters.location.longitude.toString());
      params.append('radius', filters.location.radius.toString());
    }

    const data = await ApiClient.get(`/api/cases?${params.toString()}`);
    return data;
  }

  static async getCase(id: string): Promise<Case> {
    const data = await ApiClient.get(`/api/cases/${id}`);
    return data;
  }

  static async createCase(caseData: Partial<Case>): Promise<Case> {
    const data = await ApiClient.post('/api/cases', caseData);
    return data;
  }

  static async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    const data = await ApiClient.put(`/api/cases/${id}`, updates);
    return data;
  }

  static async deleteCase(id: string): Promise<void> {
    await ApiClient.delete(`/api/cases/${id}`);
  }

  static async reportSighting(sightingData: CreateSightingData): Promise<void> {
    await ApiClient.post('/api/sightings', sightingData);
  }

  static async getNearbyCases(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<Case[]> {
    const data = await ApiClient.get(`/api/cases/nearby`, {
      params: { latitude, longitude, radius },
    });
    return data;
  }

  static async getCaseSightings(caseId: string): Promise<any[]> {
    const data = await ApiClient.get(`/api/cases/${caseId}/sightings`);
    return data;
  }

  static async uploadImage(imageUri: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);

    const data = await ApiClient.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data.url;
  }
}
