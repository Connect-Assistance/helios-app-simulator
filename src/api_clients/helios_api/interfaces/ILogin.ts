import { Branch } from '../../../enums/Branch';
import { ParsedVehicleTypes } from '../../../interfaces/IDriverLocation';

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface ILoginResponse {
    token: ILoginTokenResponse;
    user: ILoginUserResponse;
}

export interface ILoginTokenResponse {
    token: string;
    expires: number | Date;
}

export interface ILoginUserResponse {
    _id: string;
    averageResponseTime: number;
    rating: number;
    providerId: string;
    phone: number;
    name: string;
    email: string;
    vehicleType: typeof ParsedVehicleTypes;
    status: string;
    created: number | Date;
    date: Date | number;
    employeeImage: string;
    vehicleImage: string;
    onDuty: string;
    branch: typeof Branch;
    iconset: string;
    skills: string[];
    app: { version: string; lastUsed: Date | number };
    inspectorId: string | null | undefined
}
