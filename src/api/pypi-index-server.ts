import axios from 'axios';
import { PyPiPackageMetadatas } from './pypiMetadatas';
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60 * 10 });

export const versions = (name: string, indexServerURL: string = 'https://pypi.org/pypi') => {
    // clean dirty names
    name = name.replace(/"/g, '');

    return new Promise<PyPiPackageMetadatas>(async function (resolve, reject) {
        const cached = cache.get(name) as PyPiPackageMetadatas | undefined;
        if (cached) {
            resolve(cached);
            return;
        }
        try {
            const response = await axios.get(`${indexServerURL}/${name}/json`);
            // reject on bad status
            if (response.status < 200 || response.status >= 300) {
                return reject(new Error('statusCode=' + response.status));
            }
            // process response data
            try {
                const package_metadatas: PyPiPackageMetadatas = response.data;
                cache.set(name, package_metadatas);
                resolve(package_metadatas);
            } catch (e) {
                reject(e);
            }
        } catch (error) {
            reject(error);
        }
    });
};
