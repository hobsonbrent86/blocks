export interface SignupPayload {
  email: string;
  name: string;
  password: string;
}

export interface ValidatedSignup extends SignupPayload {
  normalizedEmail: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
}

export interface WelcomeRecipient {
  email: string;
  name: string;
  userId: string;
}
