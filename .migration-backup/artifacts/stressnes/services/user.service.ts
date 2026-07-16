import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/user.repository';
import { BCRYPT_ROUNDS } from '@/constants';
import type { RegisterInput, UpdateProfileInput, CreateAddressInput } from '@/lib/validations/user';

export const userService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new Error('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    return userRepository.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
    });
  },

  async verifyPassword(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user?.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  },

  async getProfile(id: string) {
    return userRepository.findById(id);
  },

  async updateProfile(id: string, input: UpdateProfileInput) {
    return userRepository.update(id, input);
  },

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(id);
    if (!user?.passwordHash) throw new Error('No password set');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    return userRepository.update(id, { passwordHash });
  },

  async listCustomers(args: { page: number; pageSize: number; search?: string }) {
    return userRepository.findMany({ ...args, role: 'CUSTOMER' });
  },

  async getAddresses(userId: string) {
    return userRepository.getAddresses(userId);
  },

  async addAddress(userId: string, input: CreateAddressInput) {
    return userRepository.createAddress({
      ...input,
      user: { connect: { id: userId } },
    });
  },
};
