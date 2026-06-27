import axios from 'axios';
import { ApiClient } from './apiClient';
import { ENV } from '../config/env';
import { ImageUploadService } from './imageUpload';
import { ValidationUtils } from '../utils/validation';
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
    radius: number;
  };
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCaseData {
  individualId: string;
  title: string;
  description?: string;
  lastSeenLocation: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  additionalInfo?: string;
}

export interface PublicMapCaseRaw {
  id: string | number;
  publicDisplayName?: string;
  displayName?: string;
  fullName?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  photoUrl?: string | null;
  lastSeenCity?: string;
  lastSeenState?: string;
  updatedAt?: string | null;
}

/** Normalized public map marker — matches website publicMapApi.normalizeMapItem */
export interface PublicMapCase {
  id: string;
  displayName: string;
  status: string;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  lastSeenCity: string;
  lastSeenState: string;
  lastSeenCityState: string;
  updatedAt: string | null;
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
      params.append('pageSize', filters.limit.toString());
    }
    if (filters?.location) {
      params.append('latitude', filters.location.latitude.toString());
      params.append('longitude', filters.location.longitude.toString());
      params.append('radius', filters.location.radius.toString());
    }

    const data = await ApiClient.get(`/api/v1/cases?${params.toString()}`);
    return data;
  }

  static async getCase(id: string): Promise<Case> {
    const normalizedId = id.startsWith('case_') ? id : `case_${id}`;
    const data = await ApiClient.get(`/api/v1/cases/${normalizedId}`);
    return data;
  }

  static async createCase(caseData: CreateCaseData): Promise<Case> {
    const validation = ValidationUtils.validateCase(caseData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('\n'));
    }

    const payload = {
      individualId: caseData.individualId.startsWith('ind_')
        ? caseData.individualId
        : `ind_${caseData.individualId}`,
      title: ValidationUtils.sanitizeInput(caseData.title.trim()),
      description: caseData.description
        ? ValidationUtils.sanitizeInput(caseData.description.trim())
        : undefined,
      status: caseData.status ?? 'Missing',
      lastSeenLocation: ValidationUtils.sanitizeInput(caseData.lastSeenLocation.trim()),
      latitude: caseData.latitude,
      longitude: caseData.longitude,
      additionalInfo: caseData.additionalInfo
        ? ValidationUtils.sanitizeInput(caseData.additionalInfo.trim())
        : undefined,
    };

    const data = await ApiClient.post('/api/v1/cases', payload);
    return data;
  }

  static async getMyCases(
    page = 1,
    pageSize = 50
  ): Promise<{ cases: Case[]; total: number }> {
    const data = await ApiClient.get<{ cases?: Case[]; total?: number }>(
      `/api/v1/cases/my-cases?page=${page}&pageSize=${pageSize}`
    );
    return { cases: data.cases ?? [], total: data.total ?? 0 };
  }

  /** Normalize raw API item — same logic as website js/publicMapApi.js */
  static normalizePublicMapItem(item: PublicMapCaseRaw): PublicMapCase | null {
    const lat = item.latitude ?? item.lat;
    const lng = item.longitude ?? item.lng;
    if (lat == null || lng == null) return null;

    const displayName =
      item.publicDisplayName ??
      item.displayName ??
      item.fullName ??
      `Case #${item.id}`;

    return {
      id: String(item.id),
      displayName,
      status: (item.status || 'missing').toLowerCase(),
      latitude: lat,
      longitude: lng,
      photoUrl: item.photoUrl || null,
      lastSeenCity: item.lastSeenCity || '',
      lastSeenState: item.lastSeenState || '',
      lastSeenCityState:
        [item.lastSeenCity, item.lastSeenState].filter(Boolean).join(', ') || 'Unknown',
      updatedAt: item.updatedAt || null,
    };
  }

  /**
   * Public missing cases for map — no auth required (matches website map)
   * GET /api/public/map/missing
   */
  static async getPublicMapCases(): Promise<PublicMapCase[]> {
    const response = await axios.get<PublicMapCaseRaw[]>(
      `${ENV.API_URL}/api/public/map/missing`,
      { timeout: 30000 }
    );
    const items = Array.isArray(response.data) ? response.data : [];

    return items
      .map(item => CasesService.normalizePublicMapItem(item))
      .filter((item): item is PublicMapCase => item != null);
  }

  /** @deprecated Use getPublicMapCases — map always uses the public endpoint like the website */
  static async getMapCases(): Promise<PublicMapCase[]> {
    return CasesService.getPublicMapCases();
  }

  static async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    const normalizedId = id.startsWith('case_') ? id : `case_${id}`;
    const data = await ApiClient.put(`/api/v1/cases/${normalizedId}`, updates);
    return data;
  }

  static async deleteCase(id: string): Promise<void> {
    const normalizedId = id.startsWith('case_') ? id : `case_${id}`;
    await ApiClient.delete(`/api/v1/cases/${normalizedId}`);
  }

  /**
   * Report a sighting — persisted to the case record in the shared database
   */
  static async reportSighting(sightingData: CreateSightingData): Promise<void> {
    const validation = ValidationUtils.validateSighting({
      caseId: sightingData.caseId,
      description: sightingData.description,
      latitude: sightingData.location.latitude,
      longitude: sightingData.location.longitude,
      confidence: sightingData.confidence,
    });

    if (!validation.isValid) {
      throw new Error(validation.errors.join('\n'));
    }

    const caseId = sightingData.caseId.startsWith('case_')
      ? sightingData.caseId
      : `case_${sightingData.caseId}`;

    let imageUrls: string[] = [];
    if (sightingData.images?.length) {
      const uploads = await ImageUploadService.uploadImages(sightingData.images);
      imageUrls = uploads.map(u => u.url);
    }

    await ApiClient.post(`/api/v1/cases/${caseId}/sightings`, {
      description: ValidationUtils.sanitizeInput(sightingData.description.trim()),
      latitude: sightingData.location.latitude,
      longitude: sightingData.location.longitude,
      address: sightingData.location.address
        ? ValidationUtils.sanitizeInput(sightingData.location.address)
        : undefined,
      images: imageUrls,
      confidence: sightingData.confidence ?? 'medium',
      reportedAt: sightingData.reportedAt,
    });
  }

  static async getNearbyCases(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<Case[]> {
    const data = await ApiClient.get(`/api/v1/cases/nearby`, {
      params: { latitude, longitude, radius },
    });
    return data;
  }

  static async getCaseSightings(caseId: string): Promise<unknown[]> {
    const normalizedId = caseId.startsWith('case_') ? caseId : `case_${caseId}`;
    const data = await ApiClient.get<{ sightings?: unknown[] }>(
      `/api/v1/cases/${normalizedId}/sightings`
    );
    return data.sightings ?? [];
  }

  static async uploadImage(imageUri: string): Promise<string> {
    const uploaded = await ImageUploadService.uploadImage(imageUri);
    return uploaded.url;
  }
}
