import { HELIOS_API_URL, HELIOS_API_WS_URL } from "../../configuration";
import fetch from "isomorphic-unfetch";
import { connect as openSocket } from "socket.io-client";
import {
  ILoginRequest,
  ILoginResponse,
  ILoginTokenResponse,
} from "./interfaces/ILogin";
import { IBaseResponse } from "./interfaces/IBaseResponse";
import { IVehicleTypeRequest } from "./interfaces/IVehicleType";
import { IJSONDriver } from "../../interfaces/IJsonDriver";
import { ParsedVehicleTypes } from "../../interfaces/IDriverLocation";

export class HeliosClient {
  private driverFromJson: IJSONDriver | undefined;
  private driver: ILoginResponse | undefined;
  private ws = openSocket("ws://localhost:3000/driver", {
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

      this.ws.emit('add_driver', this.driver?.user._id, this.driver?.user.email);

      this.ws.emit('driver_status', {
        driverId: this.driver?.user.providerId,
        status: 'Active'
      });

      setInterval(() => {
        const activeService = this.driverFromJson?.location.activeService
          ? JSON.stringify(this.driverFromJson?.location.activeService)
          : undefined;
        const pendingService = this.driverFromJson?.location.pendingService
          ? JSON.stringify(this.driverFromJson?.location.pendingService)
          : undefined;
        const newServices = this.driverFromJson?.location.newServices.length
          ? JSON.stringify(this.driverFromJson?.location.newServices)
          : undefined;

        this.ws.emit('location',
          this.driverFromJson?.location.latitude,
          this.driverFromJson?.location.longitude,
          this.driverFromJson?.location.bearing,
          this.driver?.user.providerId,
          this.driverFromJson?.location.vehicleType,
          this.driverFromJson?.location.eta,
          this.driverFromJson?.location.distance,
          this.driverFromJson?.location.tripStatus,
          activeService,
          pendingService,
          undefined, // TODO: Find out what parameter 'services' really means.
          this.driverFromJson?.location.newServices && this.driverFromJson.location.newServices?.length > 0
            ? JSON.stringify(this.driverFromJson?.location.newServices)
            : undefined
        );
      }, 10000);
    });
  }
}
