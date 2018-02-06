import * as http from "http";
import * as https from "https";
import { GetProxyError, ProxyAuthenticationRequiredError, ProxyInvalidCredentialsError } from "./proxy-errors";
import { ProxySetting } from "./proxy-settings";

async function get(opts, useHttps = false): Promise<http.IncomingMessage> {
    const send = useHttps ? https.get : http.get;
    return new Promise<http.IncomingMessage>((resolve, reject) => {
        send(opts, (res) => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                reject(res);
            } else {
                resolve(res);
            }
        });
    });
}

export async function validateProxySetting(setting: ProxySetting) {
    const auth = setting.getAuthorizationHeader();
    try {
        await get({
            host: setting.host,
            port: setting.port,
            path: "https://www.bing.com/",
            headers: {
                "Connection": "close",
                "Host": "www.bing.com",
                "Proxy-Authorization": auth,
            },
            agent: false,
        });
        return true;
    } catch (e) {
        if (e.statusCode === 407) {
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
