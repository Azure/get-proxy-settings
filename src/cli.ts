import * as readline from "readline";
import { getAndTestProxySettings } from "./proxy";
import { ProxyCredentials, ProxySetting } from "./proxy-settings";

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
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    let username;
    let password;
    if (process.env.DEBUGGING) {
        return { username: "1", password: "1" };
    }

    return new Promise<ProxyCredentials>((resolve) => {

        rl.question("Proxy username? ", (answer) => {
            username = answer;
            rl.question("Proxy password? ", (pass) => {
                password = answer;
                resolve({ username, password });
            });
        });
    });
}
