import { expect } from "chai";
import { Protocol, ProxySetting } from "./proxy-settings";

describe("ProxySettings", () => {
    describe("when passing url string", () => {
        it("Parse a simple url", () => {
            const setting = new ProxySetting("https://localhost:8888");
            expect(setting.host).to.eql("localhost");
            expect(setting.port).to.eql("8888");
            expect(setting.protocol).to.eql(Protocol.Https);
            expect(setting.credentials).to.be.undefined;
        });

        it("Parse a url without protocol", () => {
            const setting = new ProxySetting("localhost:8888");
            expect(setting.host).to.eql("localhost");
            expect(setting.port).to.eql("8888");
            expect(setting.protocol).to.eql(Protocol.Http);
            expect(setting.credentials).to.be.undefined;
        });

        it("Parse a url with cedentials", () => {
            const setting = new ProxySetting("http://abc:123@localhost:8888");
            expect(setting.host).to.eql("localhost");
            expect(setting.port).to.eql("8888");
            expect(setting.protocol).to.eql(Protocol.Http);
            expect(setting.credentials).to.eql({
                username: "abc",
                password: "123",
            });
        });
    });

    describe("#getAuthorizationHeader", () => {
        it("returns null when no credentials", () => {
            const setting = new ProxySetting({ host: "localhost", port: "1234" });
            expect(setting.getAuthorizationHeader()).to.be.null;
        });

        it("returns base64 encoded credentials", () => {
            const setting = new ProxySetting({
                host: "localhost", port: "1234",
                credentials: { username: "abc", password: "123" },
            });
            expect(setting.getAuthorizationHeader()).to.eql("Basic YWJjOjEyMw==");
        });
    });

    describe("#toString build proxy string", () => {
        it("returns simple url when no credentials", () => {
            const setting = new ProxySetting({ host: "localhost", port: "1234" });
            expect(setting.toString()).to.eql("http://localhost:1234");
        });

        it("returns url with credentials", () => {
            const setting = new ProxySetting({
                protocol: Protocol.Https, host: "localhost", port: "1234",
                credentials: { username: "abc", password: "123" },
            });
            expect(setting.toString()).to.eql("https://abc:123@localhost:1234");
        });
    });
});
