import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidCpf,
  matchesShippingRule,
  normalizePostalCode,
  validateShippingAddress,
} from "../../../apps/api/dist/modules/shipping/shipping.rules.js";

const syntheticAddress = {
  recipientName: "Cliente Sintético",
  cpf: "529.982.247-25",
  phone: "11987654321",
  postalCode: "01001-000",
  street: "Rua Sintética",
  number: "10",
  district: "Centro",
  city: "São Paulo",
  state: "SP",
};

test("CPF check digits and complete shipping address are validated", () => {
  assert.equal(isValidCpf(syntheticAddress.cpf), true);
  assert.equal(isValidCpf("111.111.111-11"), false);
  assert.equal(validateShippingAddress(syntheticAddress), "01001000");
  assert.throws(() => validateShippingAddress({ ...syntheticAddress, cpf: "123.456.789-00" }), (error) => error.getStatus() === 400);
  assert.throws(() => validateShippingAddress({ ...syntheticAddress, city: " " }), (error) => error.getStatus() === 400);
});

test("postal codes normalize and shipping rules match both postcode and quantity", () => {
  const rule = { postalCodeStart: "01000000", postalCodeEnd: "01999999", minPhysicalQuantity: 1, maxPhysicalQuantity: 3, isActive: true };
  assert.equal(normalizePostalCode("01001-000"), "01001000");
  assert.equal(matchesShippingRule(rule, "01001000", 2), true);
  assert.equal(matchesShippingRule(rule, "02001000", 2), false);
  assert.equal(matchesShippingRule(rule, "01001000", 4), false);
  assert.throws(() => normalizePostalCode("123"), (error) => error.getStatus() === 400);
});
