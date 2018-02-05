import * as npmConfLoader from "npm-conf";
import { Hive, openKey } from "./winreg";

const npmConf = npmConfLoader();

export interface ProxySettings {
    http?: string;
    https?: string;
}

export async function getProxySettings() {
    const envProxy = getEnvProxy();
    if (envProxy) { return envProxy; }
    if (process.platform === "win32") {
        return getProxyWindows();
    } else {
        return null;
    }
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
    return { http, https };
}

function parseWindowsProxySetting(proxySetting: string): ProxySettings {
    const settings = proxySetting.split(";").map(x => x.split("=", 2));
    const result: ProxySettings = {};
    for (const [key, value] of settings) {
        result[key] = value;
    }
    return result;
}
