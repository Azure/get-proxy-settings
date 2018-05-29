import { expect } from "chai";
import * as proxyquire from "proxyquire";
import { parseWindowsProxySetting } from "./proxy";
import { ProxySetting } from "./proxy-settings";

describe("proxy", () => {
    describe("getProxyWindows", () => {
        let winregData = {};
        let proxySpy;
        beforeEach(() => {
            proxySpy = proxyquire("./proxy", {
                "./winreg": {
                    openKey: () => {
                        return Promise.resolve(winregData);
                    },
                },
            });
        });

        it("returns null when no proxy settings defined at all", async () => {
            const proxy = await proxySpy.getProxyWindows();
            expect(proxy).to.eq(null);
        });

        it("returns null when proxy enabled is 0x0", async () => {
            winregData = {
                ProxyEnable: { value: "0x0" },
                ProxyServer: { value: "localhost:8888" },
            };
            const proxy = await proxySpy.getProxyWindows();
            expect(proxy).to.eq(null);
        });

        it("returns null when proxy enabled is 0x00000000", async () => {
            winregData = {
                ProxyEnable: { value: "0x00000000" },
                ProxyServer: { value: "localhost:8888" },
            };
            const proxy = await proxySpy.getProxyWindows();
            expect(proxy).to.eq(null);
        });

        it("returns proxy settings when proxy enabled is 0x1", async () => {
            winregData = {
                ProxyEnable: { value: "0x1" },
                ProxyServer: { value: "localhost:8888" },
            };
            const proxy = await proxySpy.getProxyWindows();
            expect(proxy).not.to.eq(null);

            expect(proxy.http).not.to.eq(null);
            expect(proxy.http).instanceOf(ProxySetting);
            expect(proxy.http.host).to.equal("localhost");
            expect(proxy.http.port).to.equal("8888");

            expect(proxy.https).not.to.eq(null);
            expect(proxy.https).instanceOf(ProxySetting);
            expect(proxy.https.host).to.equal("localhost");
            expect(proxy.https.port).to.equal("8888");
        });
    });

    describe("parseWindowsProxySetting", () => {
        it("should return null if null or undefined", () => {
            expect(parseWindowsProxySetting(null)).to.be.null;
            expect(parseWindowsProxySetting(undefined)).to.be.null;
        });

        it("should return same url for http and https if just a url is provided", () => {
            const value = parseWindowsProxySetting("http://localhost:8888");
            expect(value).not.to.be.null;
            expect(value.http.host).to.eql("localhost");
            expect(value.http.port).to.eql("8888");
            expect(value.https.host).to.eql("localhost");
            expect(value.https.port).to.eql("8888");
        });

        it("should coresponding http and https urls", () => {
            const value = parseWindowsProxySetting("http=http://localhost:8888;https=http://localhost:9999");
            expect(value).not.to.be.null;
            expect(value.http.host).to.eql("localhost");
            expect(value.http.port).to.eql("8888");
            expect(value.https.host).to.eql("localhost");
            expect(value.https.port).to.eql("9999");
        });

        it("should assign https automatically if missing but http provided", () => {
            const value = parseWindowsProxySetting("http=http://localhost:8888");
            expect(value).not.to.be.null;
            expect(value.http.host).to.eql("localhost");
            expect(value.http.port).to.eql("8888");
            expect(value.https.host).to.eql("localhost");
            expect(value.https.port).to.eql("8888");
        });

        it("should assign http automatically if missing but https provided", () => {
            const value = parseWindowsProxySetting("https=http://localhost:8888");
            expect(value).not.to.be.null;
            expect(value.http.host).to.eql("localhost");
            expect(value.http.port).to.eql("8888");
            expect(value.https.host).to.eql("localhost");
            expect(value.https.port).to.eql("8888");
        });

        it("should return null if invalid url is provided", () => {
            expect(parseWindowsProxySetting("invalid-url")).to.be.null;
        });
    });
});
