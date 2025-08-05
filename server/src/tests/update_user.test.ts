
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (): Promise<number> => {
  const hashedPassword = await Bun.password.hash('password123');
  const result = await db.insert(usersTable)
    .values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: hashedPassword,
      role: 'contributor'
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user username', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'updateduser'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('updateduser');
    expect(result.email).toEqual('test@example.com'); // unchanged
    expect(result.role).toEqual('contributor'); // unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user email', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'updated@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('testuser'); // unchanged
    expect(result.email).toEqual('updated@example.com');
    expect(result.role).toEqual('contributor'); // unchanged
  });

  it('should update user role', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      role: 'super_admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('testuser'); // unchanged
    expect(result.email).toEqual('test@example.com'); // unchanged
    expect(result.role).toEqual('super_admin');
  });

  it('should update user password and hash it', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      password: 'newpassword123'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('newpassword123'); // should be hashed

    // Verify password is correctly hashed
    const isValidPassword = await Bun.password.verify('newpassword123', result.password_hash);
    expect(isValidPassword).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'newusername',
      email: 'new@example.com',
      role: 'guest',
      password: 'newpassword456'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('newusername');
    expect(result.email).toEqual('new@example.com');
    expect(result.role).toEqual('guest');
    expect(result.password_hash).toBeDefined();
    
    // Verify new password
    const isValidPassword = await Bun.password.verify('newpassword456', result.password_hash);
    expect(isValidPassword).toBe(true);
  });

  it('should save changes to database', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'dbtest',
      email: 'dbtest@example.com'
    };

    await updateUser(updateInput);

    // Verify changes persisted to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('dbtest');
    expect(users[0].email).toEqual('dbtest@example.com');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      username: 'nonexistent'
    };

    expect(updateUser(updateInput)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const userId = await createTestUser();
    
    // Get original timestamp
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();
    
    const originalUpdatedAt = originalUser[0].updated_at;
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'timestamptest'
    };

    const result = await updateUser(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
