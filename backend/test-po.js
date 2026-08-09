const fetch = require('node-fetch');

async function test() {
  const res = await fetch('http://localhost:3000/purchase-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorId: "00000000-0000-0000-0000-000000000000" })
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

test();
