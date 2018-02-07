import { expect } from "chai";
import * as nock from "nock";
import {
    GetProxyError, ProxyAuthenticationRequiredError, ProxyConnectionRefusedError, ProxyInvalidCredentialsError,
} from "./proxy-errors";
import { ProxySetting } from "./proxy-settings";
import { validateProxySetting } from "./validate";

describe("Validate Proxy Settings", () => {
    it("should validate if no return sucess code", async () => {
        nock("http://someproxy.com:1234").get(() => true).reply(200, "Success");

        try {
            const settings = new ProxySetting({ host: "someproxy.com", port: "1234" });
            await validateProxySetting(settings);
        } catch (e) {
            expect.fail("Should not throw errr", e);
        }
    });

    it("should return ProxyAuthenticationRequiredError when no credentials passed but needed", async () => {
        nock("http://someproxy.com:1234").get(() => true).reply(407, "Proxy needs authentication");

        try {
            const settings = new ProxySetting({ host: "someproxy.com", port: "1234" });
            await validateProxySetting(settings);
            expect.fail("Should have thown an error");
        } catch (e) {
            expect(e).to.be.instanceof(ProxyAuthenticationRequiredError);
        }
    });

    it("should return ProxyInvalidCredentialsError when credentials passed but server return 407", async () => {
        nock("http://someproxy.com:1234").get(() => true).reply(407, "Proxy needs authentication");

        try {
            const settings = new ProxySetting({
                host: "someproxy.com", port: "1234",
                credentials: { username: "abc", password: "123" },
            });
            await validateProxySetting(settings);
            expect.fail("Should have thown an error");
        } catch (e) {
            expect(e).to.be.instanceof(ProxyInvalidCredentialsError);
        }
    });

    it("should throw other error for any other exit codes", async () => {
        nock("http://someproxy.com:1234").get(() => true).reply(500, "Internal error");

        try {
            const settings = new ProxySetting({
                host: "someproxy.com", port: "1234",
                credentials: { username: "abc", password: "123" },
            });
            await validateProxySetting(settings);
            expect.fail("Should have thown an error");
        } catch (e) {
            expect(e).to.be.instanceof(GetProxyError);
            expect(e.message).to.eql("Error validating proxy. Returned 500 null");
            expect(e).not.to.be.instanceof(ProxyAuthenticationRequiredError);
            expect(e).not.to.be.instanceof(ProxyInvalidCredentialsError);
        }
    });

    it("should throw ProxyConnectionRefusedError if connection is refused", async () => {
        nock("http://someproxy.com:1234").get(() => true).replyWithError({ code: "ECONNREFUSED" });

        try {
            const settings = new ProxySetting({
                host: "someproxy.com", port: "1234",
                credentials: { username: "abc", password: "123" },
            });
            await validateProxySetting(settings);
            expect.fail("Should have thown an error");
        } catch (e) {
            expect(e).to.be.instanceof(ProxyConnectionRefusedError);
            expect(e.message).to
                .eql(`Proxy "http://abc:123@someproxy.com:1234" doesn't seem to be available. Connection refused.`);
        }
    });
});
