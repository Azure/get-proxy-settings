import * as http from "http";
import * as npmConfLoader from "npm-conf";
import { GetProxyError, ProxyAuthenticationRequiredError } from "./proxy-errors";
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
        http.get(opts, (res) => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                reject(res);
            } else {
                resolve(res);
            }
        });
    });
}

export async function getAndTestProxySettings(login?: () => Promise<ProxyCredentials>) {
    const settings = await getProxySettings();
    try {
        await get({
            host: settings.http.host,
            port: settings.http.port,
            path: "http://google.com",
            headers: {
                Host: "google.com",
            },
        });
    } catch (e) {
        // Proxy authentication required
        if (e.statusCode === 407) {
            if (!login) { throw new ProxyAuthenticationRequiredError(settings.http); }
            const credentials = await login();
            settings.http.credentials = credentials;
            settings.https.credentials = credentials;
        } else {
            throw new GetProxyError(settings.http, "Error validating proxy.");
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
