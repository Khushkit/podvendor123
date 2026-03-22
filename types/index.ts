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

export type ShippingAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

export type PODJob = {
  id: string;
  status: PODJobStatus;
  artworkUrl: string;
  mockupUrl?: string;
  rejectReason?: string;
  createdAt: string;
  orderItem: {
    id: string;
    orderId: string;
    quantity: number;
    price: number;
    product: {
      title: string;
      description?: string;
      type: string;
      images?: { url: string; isPrimary: boolean }[];
    };
    variant?: {
      options: Record<string, string>;
      sku: string;
    };
    order?: {
      id: string;
      totalAmount: number;
      currency: string;
      createdAt: string;
      customer?: {
        id: string;
        phone?: string;
        user: { firstName?: string; lastName?: string; email: string };
        addresses?: ShippingAddress[];
      };
    };
  };
  // Shipping info (filled when vendor ships)
  shipment?: {
    carrier: string;
    tracking: string;
    trackingUrl?: string;
    shippedAt?: string;
  };
};

export type PODCatalogItem = {
  id: string;
  title: string;
  description?: string;
  brand?: string;
  category?: string;
  baseCost: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  techniques?: string[];
  printAreas?: { position: string; label: string }[];
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
