import { Role } from "./role.enum.js";

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  isEmailConfirmed: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): Role {
    return this.props.role;
  }

  get isEmailConfirmed(): boolean {
    return this.props.isEmailConfirmed;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  canPurchase(): boolean {
    return this.props.isActive && this.props.isEmailConfirmed;
  }
}
