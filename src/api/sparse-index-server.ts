import axios from 'axios';
// Use require for NodeCache to avoid TypeScript errors
const NodeCache = require('node-cache');

export const pypiIndexServerURL = "https://pypi.org/pypi";
const cache = new NodeCache({ stdTTL: 60 * 10 });

export const versions = (name: string, indexServerURL: string = pypiIndexServerURL) => {
    // clean dirty names
    name = name.replace(/"/g, "");

    return new Promise<any>(async function (resolve, reject) {
        const cached = cache.get(name) as any;
        if (cached) {
            resolve(cached);
            return;
        }

        try {
            const response = await axios.get(`${indexServerURL}/${name}/json`);
            if (response.status < 200 || response.status >= 300) {
                return reject(new Error('statusCode=' + response.status));
            }

            const packageMetadatas = {
                name: name,
                versions: Object.keys(response.data.releases),
                features: response.data.info.classifiers
            };

            cache.set(name, packageMetadatas);
            resolve(packageMetadatas);
        } catch (e) {
            reject(e);
        }
    });
};

// Check if `pypi` is reachable
export async function isPypiReachable(indexServerURL: string = pypiIndexServerURL): Promise<boolean> {
    return new Promise<boolean>(async function (resolve, reject) {
        const cached = cache.get(indexServerURL) as boolean | undefined;
        if (cached) {
            resolve(cached);
            return;
        }

        try {
            const response = await axios.get(`${indexServerURL}`);
            if (response.status >= 200 && response.status < 300) {
                cache.set(indexServerURL, true);
                resolve(true);
            } else {
                cache.set(indexServerURL, false);
                resolve(false);
            }
        } catch (e) {
            reject(e);
        }
    });
}
