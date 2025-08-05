
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';
import { eq } from 'drizzle-orm';

const testUsers: CreateUserInput[] = [
  {
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'password123',
    role: 'contributor'
  },
  {
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'password456',
    role: 'super_admin'
  },
  {
    username: 'testuser3',
    email: 'test3@example.com',
    password: 'password789',
    role: 'guest'
  }
];

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
  });

  it('should return all users when users exist', async () => {
    // Create test users
    for (const user of testUsers) {
      await db.insert(usersTable)
        .values({
          username: user.username,
          email: user.email,
          password_hash: user.password, // In real app this would be hashed
          role: user.role
        })
        .execute();
    }

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Check that all users are returned
    const usernames = result.map(user => user.username);
    expect(usernames).toContain('testuser1');
    expect(usernames).toContain('testuser2');
    expect(usernames).toContain('testuser3');

    // Check user structure
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(user.username).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.password_hash).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return users with different roles', async () => {
    // Create users with different roles
    await db.insert(usersTable)
      .values([
        {
          username: 'contributor_user',
          email: 'contributor@example.com',
          password_hash: 'hash123',
          role: 'contributor'
        },
        {
          username: 'admin_user',
          email: 'admin@example.com',
          password_hash: 'hash456',
          role: 'super_admin'
        },
        {
          username: 'guest_user',
          email: 'guest@example.com',
          password_hash: 'hash789',
          role: 'guest'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);

    const roles = result.map(user => user.role);
    expect(roles).toContain('contributor');
    expect(roles).toContain('super_admin');
    expect(roles).toContain('guest');
  });

  it('should verify users are saved correctly in database', async () => {
    const testUser = testUsers[0];
    
    await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: testUser.password,
        role: testUser.role
      })
      .execute();

    const result = await getUsers();
    expect(result).toHaveLength(1);

    // Verify against direct database query
    const directQuery = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, testUser.username))
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(result[0].id).toEqual(directQuery[0].id);
    expect(result[0].username).toEqual(directQuery[0].username);
    expect(result[0].email).toEqual(directQuery[0].email);
  });
});
