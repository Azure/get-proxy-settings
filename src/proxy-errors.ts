import { ProxySetting } from "./proxy-settings";

export class GetProxyError extends Error {
    constructor(public proxy: ProxySetting, message: string) {
        super(message);
    }
}

export class ProxyAuthenticationRequiredError extends GetProxyError {
    constructor(proxy: ProxySetting) {
        super(proxy, `Proxy require "${proxy}" authentication but no handle was provided.`);
    }
}

export class ProxyInvalidCredentialsError extends GetProxyError {
    constructor(proxy: ProxySetting) {
        super(proxy, `Proxy "${proxy}" was unable to connect due to invalid credentials`);
    }
}
