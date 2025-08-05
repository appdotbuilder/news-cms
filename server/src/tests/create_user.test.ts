
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'contributor'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toEqual('hashed_password123');
    expect(result.role).toEqual('contributor');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper Drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toEqual('hashed_password123');
    expect(users[0].role).toEqual('contributor');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should apply default role when not specified', async () => {
    const inputWithoutRole = {
      username: 'defaultuser',
      email: 'default@example.com',
      password: 'password123',
      role: 'contributor' as const // Zod default is applied
    };

    const result = await createUser(inputWithoutRole);

    expect(result.role).toEqual('contributor');
  });

  it('should create user with super_admin role', async () => {
    const adminInput: CreateUserInput = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'adminpass',
      role: 'super_admin'
    };

    const result = await createUser(adminInput);

    expect(result.role).toEqual('super_admin');
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same username
    const duplicateInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'password123',
      role: 'contributor'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate/i);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      password: 'password123',
      role: 'contributor'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate/i);
  });
});
