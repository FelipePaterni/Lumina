import assert from "node:assert/strict";
import test from "node:test";
import { PasswordHasherService } from "../../../apps/api/dist/modules/identity/application/services/password-hasher.service.js";

test("PasswordHasherService - hash adaptativo e verificação", async () => {
  const hasher = new PasswordHasherService();
  const password = "MinhaSenhaSegura123!";

  const hash = await hasher.hash(password);
  assert.ok(hash);
  assert.notEqual(hash, password);

  const isValid = await hasher.compare(password, hash);
  assert.equal(isValid, true, "Senha correta deve ser validada");

  const isInvalid = await hasher.compare("SenhaIncorreta", hash);
  assert.equal(isInvalid, false, "Senha incorreta deve ser recusada");
});
