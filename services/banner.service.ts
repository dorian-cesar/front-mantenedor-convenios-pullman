import { api } from '@/lib/api';

export interface Banner {
    id: number;
    image_url: string;
    list_type: 'A' | 'B';
    order: number | null;
    status: 'ACTIVO' | 'INACTIVO';
    createdAt: string;
    updatedAt: string;
}

export interface CreateBannerData {
    image: File;
    list_type: 'A' | 'B';
    order?: number;
}

export interface UpdateBannerData {
    list_type?: 'A' | 'B';
    order?: number | null;
    status?: 'ACTIVO' | 'INACTIVO';
}

export class BannersService {
    static async getBanners(): Promise<Banner[]> {
        const response = await api.get<Banner[]>('/banners');
        return response.data;
    }

    static async getHeroBanners(): Promise<Banner[]> {
        const response = await api.get<Banner[]>('/banners/hero');
        return response.data;
    }

    static async createBanner(data: CreateBannerData): Promise<Banner> {
        const formData = new FormData();
        formData.append('image', data.image);
        formData.append('list_type', data.list_type);
        if (data.order !== undefined) {
            formData.append('order', String(data.order));
        }

        const response = await api.post<Banner>('/banners', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    static async updateBanner(id: number, data: UpdateBannerData): Promise<Banner> {
        const response = await api.put<Banner>(`/banners/${id}`, data);
        return response.data;
    }

    static async deleteBanner(id: number): Promise<void> {
        await api.delete(`/banners/${id}`);
    }

    static async toggleStatus(id: number, currentStatus: 'ACTIVO' | 'INACTIVO'): Promise<Banner> {
        const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        return this.updateBanner(id, { status: newStatus });
    }
}
