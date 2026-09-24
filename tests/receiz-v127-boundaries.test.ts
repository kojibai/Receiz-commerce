import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";

it("keeps historical Connect methods disabled even when a fetch implementation is supplied", async () => {
  let requests = 0;
  const adapter = createReceizCommerceAdapter({baseUrl:"https://compatibility.invalid",accessToken:"test-only",fetchImpl:async () => {
    requests++; return Response.json({ok:true});
  }});
  await assert.rejects(adapter.client.customers.orders(), /RECEIZ_HISTORICAL_CONNECT_HOST_REQUIRED/);
  assert.equal(requests,0);
  assert.throws(() => createReceizCommerceAdapter({baseUrl:"https://receiz.com",legacyConnectTransport:"http"}), /RECEIZ_HISTORICAL_CONNECT_CUSTOM_HOST_REQUIRED/);
});

it("permits historical Connect only on an explicitly configured compatibility host", async () => {
  let requests=0;
  const adapter=createReceizCommerceAdapter({baseUrl:"https://compatibility.invalid",accessToken:"test-only",legacyConnectTransport:"http",fetchImpl:async url => {
    assert.ok(String(url).startsWith("https://compatibility.invalid/"));requests++;return Response.json({ok:true,orders:[]});
  }});
  await adapter.client.customers.orders();
  assert.equal(requests,1);
});

it("requires a local subject host or explicit historical transport before V120 reads", async () => {
  const adapter=createReceizCommerceAdapter({baseUrl:"https://receiz.invalid"});
  await assert.rejects(adapter.client.subjects.resolve("subject:test"),/RECEIZ_V120_LOCAL_RUNTIME_OR_EXPLICIT_HTTP_TRANSPORT_REQUIRED/);
});

it("exposes the v127 offline and local-host entrypoints without adding them to the browser adapter", async () => {
  const sdkPackage=JSON.parse(readFileSync("node_modules/@receiz/sdk/package.json","utf8"));
  for(const entry of ["./offline","./offline/node","./offline/kai","./offline/kai/node","./subjects/node"]) assert.ok(sdkPackage.exports[entry],entry);
  const adapter=readFileSync("src/lib/receiz/adapter.ts","utf8");
  assert.doesNotMatch(adapter, /from ["']@receiz\/sdk\/(?:offline\/node|offline\/kai\/node|subjects\/node)["']/);
  const load=new Function("return import('@receiz/sdk/offline')") as () => Promise<{verifyReceizOfflineSealedFile: (input:{bytes:Uint8Array;filename:string})=>Promise<{ok:boolean}>}>;
  const offline=await load();
  const invalid=await offline.verifyReceizOfflineSealedFile({bytes:new TextEncoder().encode('unsealed data'),filename:'unsealed.txt'});
  assert.equal(invalid.ok,false);
});
