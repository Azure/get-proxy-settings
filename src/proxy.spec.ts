import { expect } from "chai";
import { parseWindowsProxySetting } from "./proxy";
describe("proxy", () => {
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
