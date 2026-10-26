import assert from "node:assert/strict";
import test from "node:test";
import { JwtTokenService } from "../../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";

test("JwtTokenService - emissão, verificação e rejeição de adulteração", () => {
  const jwtService = new JwtTokenService();

  const payload = {
    sub: "user-uuid-123",
    email: "user@example.com",
    role: "CUSTOMER",
    isEmailConfirmed: true,
  };

  const token = jwtService.sign(payload, 3600);
  assert.ok(token);

  const decoded = jwtService.verify(token);
  assert.equal(decoded.sub, payload.sub);
  assert.equal(decoded.email, payload.email);
  assert.equal(decoded.role, payload.role);
  assert.equal(decoded.isEmailConfirmed, payload.isEmailConfirmed);

  // Rejeição de token adulterado
  const tamperedToken = token.slice(0, -4) + "abcd";
  assert.throws(
    () => jwtService.verify(tamperedToken),
    /invalid signature|jwt malformed/,
    "Token adulterado deve ser rejeitado",
  );
});
