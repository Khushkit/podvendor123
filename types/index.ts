export type VendorUser = {
  id: string;
  email: string;
};

export type Vendor = {
  id: string;
  name: string;
  apiEndpoint?: string;
};

export type AuthPayload = {
  user: VendorUser;
  vendor: Vendor;
  accessToken: string;
  refreshToken: string;
};

export type PODJobStatus = 'PENDING' | 'PRINTING' | 'SHIPPED' | 'REJECTED';

export type PODJob = {
  id: string;
  status: PODJobStatus;
  artworkUrl: string;
  mockupUrl?: string;
  rejectReason?: string;
  createdAt: string;
  orderItem: {
    orderId: string;
    quantity: number;
    price: number;
    product: { title: string };
  };
};

export type PODCatalogItem = {
  id: string;
  title: string;
  description?: string;
  baseCost: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};