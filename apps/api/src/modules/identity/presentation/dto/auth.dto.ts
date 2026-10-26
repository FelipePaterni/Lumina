export class RegisterDto {
  email!: string;
  password!: string;
}

export class ConfirmEmailDto {
  token!: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}

export class ForgotPasswordDto {
  email!: string;
}

export class ResetPasswordDto {
  token!: string;
  newPassword!: string;
}
