// Smoke/load test: BASE_URL=https://api.example.com k6 run backend/loadtest/health.js
// Extend with authenticated scan/invoice calls using a staging token.
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<800"] },
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/health`);
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(1);
}
