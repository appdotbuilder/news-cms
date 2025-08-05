
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password123',
  role: 'contributor' as const
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create test user with hashed password
    await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password123'
      })
      .execute();

    const result = await login(testLoginInput);

    // Verify user data
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.username).toEqual('testuser');
    expect(result.user.role).toEqual('contributor');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);

    // Verify token
    expect(result.token).toBeDefined();
    expect(result.token).toMatch(/^jwt_/);
  });

  it('should authenticate user with alternative password hash format', async () => {
    // Create test user with alternative hash format
    await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password123'
      })
      .execute();

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'hashed_password123' // Direct hash match
    };

    const result = await login(loginInput);

    expect(result.user.email).toEqual('test@example.com');
    expect(result.token).toBeDefined();
  });

  it('should reject login with invalid email', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidEmailInput: LoginInput = {
      email: 'wrong@example.com',
      password: 'password123'
    };

    expect(login(invalidEmailInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should reject login with invalid password', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password123'
      })
      .execute();

    const invalidPasswordInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    expect(login(invalidPasswordInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle different user roles correctly', async () => {
    // Create super admin user
    await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'hashed_adminpass',
        role: 'super_admin'
      })
      .execute();

    const adminLoginInput: LoginInput = {
      email: 'admin@example.com',
      password: 'hashed_adminpass'
    };

    const result = await login(adminLoginInput);

    expect(result.user.role).toEqual('super_admin');
    expect(result.user.username).toEqual('admin');
    expect(result.token).toMatch(/^jwt_/);
  });

  it('should return complete user object with all fields', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUser = insertResult[0];

    const result = await login({
      email: testUser.email,
      password: testUser.password_hash
    });

    // Verify all user fields are present
    expect(result.user.id).toEqual(createdUser.id);
    expect(result.user.username).toEqual(createdUser.username);
    expect(result.user.email).toEqual(createdUser.email);
    expect(result.user.password_hash).toEqual(createdUser.password_hash);
    expect(result.user.role).toEqual(createdUser.role);
    expect(result.user.created_at).toEqual(createdUser.created_at);
    expect(result.user.updated_at).toEqual(createdUser.updated_at);
  });
});
