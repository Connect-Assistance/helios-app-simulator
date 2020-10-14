import { ParsedVehicleTypes } from "./IDriverLocation";

export interface IJSONDriver {
    login: IJSONDriverLogin;
    location: IJSONDriverLocation;
}

export interface IJSONDriverLogin {
    email: string;
    password: string;
}

export interface IJSONDriverLocation {
    activeService: string;
    bearing: number;
    distance: number;
    driverId: string;
    eta: number;
    latitude: number;
    longitude: number;
    newServices: IJSONDriverServiceData[];
    pendingService: IJSONDriverServiceData;
    tripStatus: string; // TODO: Convert this to a typed type
    vehicleType: string;
}

export interface IJSONDriverServiceData {
	_id: string;
	sfIdAccount: string;
	situation: string;
}