import { getAndTestProxySettings } from "./index";
import { ProxySetting } from "./proxy-settings";

getAndTestProxySettings(login).then((settings) => {
    if (settings) {
        // tslint:disable:no-console
        console.log(`http=${settings.http}`);
        console.log(`https=${settings.https}`);
    }
}).catch((e) => {
    console.log("Error", e);
});

async function login() {
    return {
        username: "1",
        password: "1",
    };
}
