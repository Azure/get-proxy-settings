import * as http from "http";
import * as npmConfLoader from "npm-conf";
import { GetProxyError, ProxyAuthenticationRequiredError, ProxyInvalidCredentialsError } from "./proxy-errors";
import { ProxyCredentials, ProxySetting, ProxySettings } from "./proxy-settings";
import { Hive, openKey } from "./winreg";

const npmConf = npmConfLoader();

export async function getProxySettings(): Promise<ProxySettings> {
    const envProxy = getEnvProxy();
    if (envProxy) { return envProxy; }
    if (process.platform === "win32") {
        return getProxyWindows();
    } else {
        return null;
    }
}

async function get(opts): Promise<http.IncomingMessage> {
    return new Promise<http.IncomingMessage>((resolve, reject) => {
        const client = http.get(opts, (res) => {
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
        return await get({
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

export async function getAndTestProxySettings(login?: () => Promise<ProxyCredentials>) {
    const settings = await getProxySettings();
    try {
        await validateProxySetting(settings.http);
    } catch (e) {
        // Proxy authentication required
        if (e instanceof ProxyAuthenticationRequiredError) {
            if (!login) { throw e; }
            const credentials = await login();
            settings.http.credentials = credentials;
            settings.https.credentials = credentials;
            await validateProxySetting(settings.http);
        } else {
            throw e;
        }
    }

    return settings;
}

export default getProxySettings;

export async function getProxyWindows(): Promise<ProxySettings> {
    const values = await openKey(Hive.HKCU, "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings");
    const proxy = values["ProxyServer"];
    const enable = values["ProxyEnable"];
    if (enable && enable.value && proxy) {
        return parseWindowsProxySetting(proxy.value);
    } else {
        return null;
    }
}

/**
 * Return proxy settings defined in the environment.
 * This can be either as HTTP(s)_PROXY environment variable or in the npm config
 */
export function getEnvProxy(): ProxySettings {
    const https = process.env.HTTPS_PROXY ||
        process.env.https_proxy ||
        npmConf.get("https-proxy") ||
        npmConf.get("proxy") ||
        null;

    const http = process.env.HTTP_PROXY ||
        process.env.http_proxy ||
        npmConf.get("http-proxy") ||
        npmConf.get("proxy") ||
        null;
    if (!http && !https) {
        return null;
    }
    return { http: new ProxySetting(http), https: new ProxySetting(https) };
}

function parseWindowsProxySetting(proxySetting: string): ProxySettings {
    const settings = proxySetting.split(";").map(x => x.split("=", 2));
    const result: ProxySettings = {};
    for (const [key, value] of settings) {
        result[key] = new ProxySetting(value);
    }
    return result;
}
