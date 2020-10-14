require('dotenv').config();
import { promises as fs } from 'fs';
import { HeliosClient } from './api_clients/helios_api/HeliosClient';
import { IJSONDriver } from './interfaces/IJsonDriver';

const init = async () => {
    const jsonFilesDirectory = `${__dirname}/data`;
    const rawJsonFiles = await fs.readdir(jsonFilesDirectory);
    const jsonFiles = rawJsonFiles.filter((filename) => filename.match(/^\d+\.json$/));
    const driverPromises = jsonFiles.map((filename) => fs.readFile(`${jsonFilesDirectory}/${filename}`));
    const rawDrivers = await Promise.all(driverPromises);
    const drivers: IJSONDriver[] = rawDrivers.map((driverBuffer) => JSON.parse(driverBuffer.toString()));
    drivers.forEach(async (driver) => {
        const helios = new HeliosClient();
        await helios.login(driver);
        await helios.emitLocation();
    });
}

init();