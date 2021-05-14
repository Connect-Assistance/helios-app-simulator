import { HELIOS_API_URL, HELIOS_API_WS_URL } from "../../configuration";
import fetch from "isomorphic-unfetch";
import { connect as openSocket } from "socket.io-client";
import {
  ILoginRequest,
  ILoginResponse
} from "./interfaces/ILogin";
import { IBaseResponse } from "./interfaces/IBaseResponse";
import { IVehicleTypeRequest } from "./interfaces/IVehicleType";
import { IJSONDriver } from "../../interfaces/IJsonDriver";
import { ParsedVehicleTypes } from "../../interfaces/IDriverLocation";
import { ILiveLocationRequest, ILiveLocationResponse } from "./interfaces/ILiveLocation";

export class HeliosClient {
  private driverFromJson: IJSONDriver | undefined;
  private driver: ILoginResponse | undefined;
  private ws = openSocket(`${HELIOS_API_WS_URL}/driver`, {
    autoConnect: false,
    forceNew: true,
    transports: ["websocket"],
  });

  async login(driver: IJSONDriver) {
    const { email, password } = driver.login;
    const body: ILoginRequest = { email, password };
    const response = await fetch(`${HELIOS_API_URL}/providers/drivers/login`, {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const json: IBaseResponse<ILoginResponse> = await response.json();
    if (!json.status || !json.data) {
      throw Error(`HeliosClient - Login failed for <${email}>`);
    }

    console.log(`HeliosClient - Login successful for <${email}>`);

    this.driverFromJson = driver;
    this.driver = json.data;
  }

  async sendLocation() {
    const d = (this.driverFromJson as IJSONDriver).location;
    const body: ILiveLocationRequest = {
      bearing: d.bearing,
      distance: d.distance,
      eta: d.eta,
      latitude: d.latitude,
      longitude: d.longitude,
      services: {
        active: d.activeService,
        new: d.newServices,
        pending: d.pendingService
      },
      tripStatus: d.tripStatus,
      vehicleType: d.vehicleType,
    };
    const response = await fetch(`${HELIOS_API_URL}/api/v1/drivers/${this.driver?.user._id}/location`, {
      method: "post",
      body: JSON.stringify(body),
      headers: {
        "Authorization": this.driver?.token.token,
        "Content-Type": "application/json"
      },
    });
    const json: IBaseResponse<ILiveLocationResponse> = await response.json();
    if (!json.status) {
      console.log(json);
      throw Error(`HeliosClient - Location not emitted for <${this.driver?.user.email} | ${this.driver?.user._id}>`);
    }
    console.log(`HeliosClient - Location emitted for <${this.driver?.user.email} | ${this.driver?.user._id}> at ${new Date().toISOString()}`)
  }

  async setVehicleType() {
    const body: IVehicleTypeRequest = {
      vehicleType:
        this.driverFromJson?.location.vehicleType || ParsedVehicleTypes.Vial,
      providerId: this.driver?.user.providerId || "",
    };
    const response = await fetch(`${HELIOS_API_URL}/utils/sVehicleType`, {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();
    if (!json.status) {
      console.warn("HeliosClient - ", response);
    }
  }

  async getTime() {
    const response = await fetch(`${HELIOS_API_URL}/time`, {
      headers: {
        Authorization: this.driver?.token.token,
        "Content-Type": "application/json",
      },
    });
    const json: IBaseResponse<string> = await response.json();
    if (!json.status || !json.data) {
      console.warn("HeliosClient - ", response);
    }
  }

  async emitLocation() {
    this.ws.open();

    this.ws.on("error", () => {
      console.error(
        `HeliosClient - Websocket connection failed for <${this.driver?.user.email}>`
      );
    });

    this.ws.on("connect", async () => {
      console.log(
        `HeliosClient - Websocket connection successful for <${this.driver?.user.email}>`
      );

      await this.setVehicleType();

      this.ws.emit(
        "add_driver",
        this.driver?.user._id,
        this.driver?.user.email
      );

      this.ws.emit("driver_status", {
        driverId: this.driver?.user.providerId,
        status: "Active",
      });

      this.sendLocation();
      setInterval(() => this.sendLocation(), 60 * 1000);
    });
  }
}
