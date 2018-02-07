import * as http from "http";
import * as https from "https";
import { URL } from "url";
import { defaults } from "./defaults";
import {
    GetProxyError, ProxyAuthenticationRequiredError, ProxyConnectionRefusedError, ProxyInvalidCredentialsError,
} from "./proxy-errors";
import { ProxySetting } from "./proxy-settings";

async function get(opts, useHttps = false): Promise<http.IncomingMessage> {
    const send = useHttps ? https.get : http.get;
    return new Promise<http.IncomingMessage>((resolve, reject) => {
        const req = send(opts, (res) => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                reject(res);
            } else {
                resolve(res);
            }
        });
        req.on("error", e => reject(e));
    });
}

/**
 * Validate the given proxy setting
 * @param setting Proxy setting to validate.
 *
 * @throws {ProxyConnectionRefusedError} if it cannot connect to the proxy
 * @throws {ProxyAuthenticationRequiredError} if proxy settings doesn't have credentials but is required
 * @throws {ProxyInvalidCredentialsError} if proxy settings has credentials but proxy denies the request(407)
 * @throws {GetProxyError} for other errors
 */
export async function validateProxySetting(setting: ProxySetting) {
    const auth = setting.getAuthorizationHeader();
    const testUrl = new URL(defaults.testUrl);
    try {
        await get({
            host: setting.host,
            port: setting.port,
            path: defaults.testUrl,
            headers: {
                "Connection": "close",
                "Host": testUrl.host,
                "Proxy-Authorization": auth,
            },
            agent: false,
        });
        return true;
    } catch (e) {
        if (e.code === "ECONNREFUSED") {
            throw new ProxyConnectionRefusedError(setting);
        } else if (e.statusCode === 407) {
            if (setting.credentials) {
                throw new ProxyInvalidCredentialsError(setting);
            } else {
                throw new ProxyAuthenticationRequiredError(setting);
            }
        } else {
            throw new GetProxyError(setting, `Error validating proxy. Returned ${e.statusCode} ${e.statusMessage}`);
        }
    }
}
