# System Proxy
[![Build Status](https://travis-ci.org/Azure/get-proxy-settings.svg?branch=master)](https://travis-ci.org/Azure/get-proxy-settings)
[![npm version](https://badge.fury.io/js/get-proxy-settings.svg)](https://badge.fury.io/js/get-proxy-settings)

This library will read the system proxy setttings and return.
It will first try to read from the environment variable `HTTP_PROXY` and `HTTPS_PROXY`
On windows it will then look at the internet settings in the registry.

## Install

```
npm install --save get-proxy-settings
```

## Usage

**Import**
```js
// Default import
import getProxySettings from "get-proxy-settings";
// With named import
import { getProxySettings } from "get-proxy-settings";

// Or with commonjs
const getProxySettings = require("get-proxy-settings");
```

**Use**
```js

async function my() {
    const proxy = await getProxySettings();
    console.log("proxy", proxy.http, proxy.https);
}
```


# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
