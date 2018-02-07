import * as readline from "readline";
import { getAndTestProxySettings } from "./proxy";
import { ProxyCredentials } from "./proxy-settings";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
// To test
// process.env.HTTP_PROXY = "http://localhost:8888";
// process.env.HTTPS_PROXY = "http://localhost:8888";

getAndTestProxySettings(login).then((settings) => {
    if (settings) {
        // tslint:disable:no-console
        console.log(`http=${settings.http}`);
        console.log(`https=${settings.https}`);
    }
    rl.close();

}).catch((e) => {
    console.log("Error", e);
    rl.close();
});

async function login() {

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
