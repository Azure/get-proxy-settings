# System Proxy

## Install

```
npm install --save system-proxy
```

## Usage

**Import**
```js
import getSystemProxy from "system-prooxy";
// or with named import
import { getSystemProxy } from "system-prooxy";

// Or with commonjs
const getSystemProxy = require("system-prooxy");
```

**Use**
```js

async function my() {
    const proxy = await getSystemProxy();
    console.log("proxy", proxy.http, proxy.https);
}
```