import assert from "node:assert/strict";
import test from "node:test";
import { RolesGuard } from "../../../apps/api/dist/modules/identity/presentation/guards/roles.guard.js";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";

// Mock do Reflector do NestJS
class MockReflector {
  constructor(metadata = {}) {
    this.metadata = metadata;
  }

  getAllAndOverride(key) {
    return this.metadata[key];
  }
}

// Helper para montar o ExecutionContext
function createMockExecutionContext(userRole, isAnonymous = false) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: isAnonymous ? null : { sub: "user-123", role: userRole },
      }),
    }),
  };
}

test("RolesGuard - permite acesso quando nenhuma role é exigida na rota", () => {
  const reflector = new MockReflector({});
  const guard = new RolesGuard(reflector);

  const context = createMockExecutionContext(Role.CUSTOMER);
  assert.equal(guard.canActivate(context), true);
});

test("RolesGuard - autoriza usuário com papel correspondente aos autorizados", () => {
  const reflector = new MockReflector({ roles: [Role.ADMIN, Role.CATALOG] });
  const guard = new RolesGuard(reflector);

  const contextAdmin = createMockExecutionContext(Role.ADMIN);
  assert.equal(guard.canActivate(contextAdmin), true);

  const contextCatalog = createMockExecutionContext(Role.CATALOG);
  assert.equal(guard.canActivate(contextCatalog), true);
});

test("RolesGuard - nega acesso (403 Forbidden) para papel não autorizado", () => {
  const reflector = new MockReflector({ roles: [Role.ADMIN] });
  const guard = new RolesGuard(reflector);

  const contextCustomer = createMockExecutionContext(Role.CUSTOMER);
  assert.throws(
    () => guard.canActivate(contextCustomer),
    /Acesso negado: papel 'CUSTOMER' não possui permissão/,
  );

  const contextStock = createMockExecutionContext(Role.STOCK);
  assert.throws(
    () => guard.canActivate(contextStock),
    /Acesso negado: papel 'STOCK' não possui permissão/,
  );
});

test("RolesGuard - nega acesso quando usuário não está autenticado", () => {
  const reflector = new MockReflector({ roles: [Role.CUSTOMER] });
  const guard = new RolesGuard(reflector);

  const contextAnon = createMockExecutionContext(null, true);
  assert.throws(
    () => guard.canActivate(contextAnon),
    /Acesso negado: credencial de usuário ausente/,
  );
});
