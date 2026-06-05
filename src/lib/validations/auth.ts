import { z } from 'zod'

// AC-1.1: RFC-5322 email + AC-1.4: specific Arabic error messages
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('بريد إلكتروني غير صالح'),
  phone: z
    .string()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(/^\+966[0-9]{9}$/, 'رقم هاتف سعودي غير صالح — الصيغة: +966XXXXXXXXX'),
  full_name: z
    .string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(255),
  office_name: z
    .string()
    .min(2, 'اسم المكتب يجب أن يكون حرفين على الأقل')
    .max(255),
  password: z
    .string()
    .min(8, 'كلمة المرور 8 أحرف على الأقل'),
})

export const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

export const otpSchema = z.object({
  phone: z.string().regex(/^\+966[0-9]{9}$/),
  code: z.string().length(6, 'الرمز 6 أرقام'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OtpInput = z.infer<typeof otpSchema>
