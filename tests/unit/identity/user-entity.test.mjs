import assert from "node:assert/strict";
import test from "node:test";
import { User } from "../../../apps/api/dist/modules/identity/domain/user.entity.js";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";

test("User Entity - validação de regra de negócio RN-001 (canPurchase)", () => {
  const unconfirmedUser = new User({
    id: "u1",
    email: "test@example.com",
    passwordHash: "hash",
    role: Role.CUSTOMER,
    isEmailConfirmed: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.equal(
    unconfirmedUser.canPurchase(),
    false,
    "Usuário sem e-mail confirmado NÃO pode comprar (RN-001)",
  );

  const confirmedUser = new User({
    id: "u2",
    email: "confirmed@example.com",
    passwordHash: "hash",
    role: Role.CUSTOMER,
    isEmailConfirmed: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.equal(
    confirmedUser.canPurchase(),
    true,
    "Usuário ativo com e-mail confirmado pode comprar",
  );

  const inactiveUser = new User({
    id: "u3",
    email: "inactive@example.com",
    passwordHash: "hash",
    role: Role.CUSTOMER,
    isEmailConfirmed: true,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.equal(
    inactiveUser.canPurchase(),
    false,
    "Usuário inativo NÃO pode comprar mesmo com e-mail confirmado",
  );
});
