import * as npmConfLoader from "npm-conf";
import * as url from "url";
import { ProxyAuthenticationRequiredError } from "./proxy-errors";
import { ProxyCredentials, ProxySetting, ProxySettings } from "./proxy-settings";
import { validateProxySetting } from "./validate";
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
    const httpsProxy = process.env.HTTPS_PROXY ||
        process.env.https_proxy ||
        npmConf.get("https-proxy") ||
        npmConf.get("proxy") ||
        null;

    const httpProxy = process.env.HTTP_PROXY ||
        process.env.http_proxy ||
        npmConf.get("http-proxy") ||
        npmConf.get("proxy") ||
        null;
    if (!httpProxy && !httpsProxy) {
        return null;
    }
    return { http: new ProxySetting(httpProxy), https: new ProxySetting(httpsProxy) };
}

export function parseWindowsProxySetting(proxySetting: string): ProxySettings {
    if (!proxySetting) { return null; }
    if (isValidUrl(proxySetting)) {
        const setting = new ProxySetting(proxySetting);
        return {
            http: setting,
            https: setting,
        };
    }
    const settings = proxySetting.split(";").map(x => x.split("=", 2));
    const result = {};
    for (const [key, value] of settings) {
        if (value) {
            result[key] = new ProxySetting(value);
        }
    }

    return processResults(result);
}

function isValidUrl(value: string) {
    const obj = url.parse(value);
    return Boolean(obj.hostname);
}

function processResults(results: { [key: string]: ProxySetting }) {
    const { http, https } = results;
    if (http && https) {
        return { http, https };
    } else if (http) {
        return { http, https: http };
    } else if (https) {
        return { http: https, https };
    } else {
        return null;
    }
}
