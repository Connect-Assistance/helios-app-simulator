export interface ILiveLocationRequest {
  bearing: number;
  branch: string;
  distance?: number;
  eta?: number;
  latitude: number;
  longitude: number;
  services?: {
    active: string | null;
    new: string[] | null;
    pending: string | null;
  };
  tripStatus?: string;
  vehicleType: string;
}

export interface ILiveLocationResponse {
  status: string;
}
