import { URL } from "url";
const URL_REGEX = /^https?:\/\/.*$/;

export enum Protocol {
    Http = "http",
    Https = "https",
}

export interface ProxySettingAttributes {
    host: string;
    port: string;
    protocol?: Protocol;
    credentials?: ProxyCredentials;
}

export interface ProxyCredentials {
    username: string;
    password: string;
}

export class ProxySetting {
    public host: string;
    public port: string;
    public protocol: Protocol = Protocol.Http;
    public credentials: ProxyCredentials;

    constructor(params: string | ProxySetting | ProxySettingAttributes) {
        if (typeof params === "string") {
            this._parseUrl(params);
        } else {
            this.host = params.host;
            this.port = params.port;
            this.protocol = params.protocol || Protocol.Http;
            this.credentials = params.credentials;
        }
    }

    public toString() {
        let cred = "";
        if (this.credentials) {
            cred = `${this.credentials.username}`;
            if (this.credentials.password) {
                cred += `:${this.credentials.password}`;
            }
            cred += "@";
        }
        return `${this.protocol}://${cred}${this.host}:${this.port}`;
    }

    public getAuthorizationHeader() {
        if (!this.credentials) { return null; }

        const cred = `${this.credentials.username}:${this.credentials.password}`;
        return `Basic ${Buffer.from(cred).toString("base64")}`;
    }

    private _parseUrl(value: string) {
        value = ensureProtocol(value);
        const url = new URL(value);
        this.host = url.hostname;
        this.port = url.port;
        if (url.protocol === "https:") {
            this.protocol = Protocol.Https;
        } else {
            this.protocol = Protocol.Http;
        }

        if (url.username) {
            this.credentials = {
                username: url.username,
                password: url.password,
            };
        }
    }
}

export interface ProxySettings {
    http?: ProxySetting;
    https?: ProxySetting;
}

function ensureProtocol(value: string): string {
    if (URL_REGEX.test(value)) {
        return value;
    } else {
        return `http://${value}`;
    }
}
