import { z } from "zod";

export const loginRequestSchema = z.object({
  email_reg: z.string().min(1, "Email or registration number is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authUserSchema = z.object({
  pk: z.number(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authRoleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT", "UNKNOWN"]);
export type AuthRole = z.infer<typeof authRoleSchema>;

export const loginResponseSchema = z.object({
  success: z.literal(true),
  status: z.enum(["LOGIN_SUCCESS", "NOT_VERIFIED"]),
  access: z.string(),
  refresh: z.string(),
  user: authUserSchema,
  role: authRoleSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// What the rest of the app sees after a login — `refresh` is split off and handed
// to token-storage.ts, so no caller can accidentally pass it around.
export type ClientAuthSession = Omit<LoginResponse, "refresh">;

export const forgotPasswordRequestSchema = z.object({
  email_reg: z.string().min(1, "Email or registration number is required"),
});
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

const resetPasswordBaseSchema = z.object({
  uid: z.string().min(1),
  token: z.string().min(1),
  new_password1: z.string().min(6, "Password must be at least 6 characters"),
  new_password2: z.string().min(1, "Please confirm your new password"),
});

function passwordsMatch(data: { new_password1: string; new_password2: string }) {
  return data.new_password1 === data.new_password2;
}
const passwordsMatchRefinement = {
  message: "Passwords don't match",
  path: ["new_password2"],
};

export const resetPasswordRequestSchema = resetPasswordBaseSchema.refine(
  passwordsMatch,
  passwordsMatchRefinement,
);
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

// Form-only subset (no uid/token — those come from the URL, not user input).
export const resetPasswordFormSchema = resetPasswordBaseSchema
  .omit({ uid: true, token: true })
  .refine(passwordsMatch, passwordsMatchRefinement);
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
