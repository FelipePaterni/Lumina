import assert from "node:assert/strict";
import test from "node:test";
import { TokenService } from "../../../apps/api/dist/modules/identity/application/services/token.service.js";

test("TokenService - geração de tokens opacos e hash SHA-256", () => {
  const service = new TokenService();

  const { token, tokenHash } = service.generateOpaqueToken();
  assert.ok(token);
  assert.ok(tokenHash);
  assert.equal(token.length, 64);
  assert.equal(tokenHash.length, 64);

  const rehashed = service.hashToken(token);
  assert.equal(rehashed, tokenHash, "Re-hashing deve ser determinístico");

  const other = service.generateOpaqueToken();
  assert.notEqual(token, other.token, "Tokens gerados devem ser únicos");
});
