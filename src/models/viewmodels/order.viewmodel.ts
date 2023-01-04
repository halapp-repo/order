export interface Address {
  Active?: boolean;
  AddressLine: string;
  County: string;
  City: string;
  ZipCode: string;
  Country: string;
}

export interface OrderItemViewModel {
  ProductId: string;
  Price: number;
  Count: number;
  Unit: string;
}

export interface OrderViewModel {
  Id: string;
  OrganizationId: string;
  Status: string;
  DeliveryAddress: Address;
  CreatedBy: string;
  CreatedDate: string;
  Items: OrderItemViewModel[];
  Note?: string;
}
