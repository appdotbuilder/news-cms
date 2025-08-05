
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function login(input: LoginInput): Promise<AuthResponse> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // In a real application, you would use bcrypt to compare the password
    // For this implementation, we'll do a simple hash comparison
    // Note: In production, use bcrypt.compare(input.password, user.password_hash)
    const isPasswordValid = await verifyPassword(input.password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token (placeholder implementation)
    const token = generateJWTToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Placeholder password verification - in production use bcrypt
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  // Simple hash verification for testing purposes
  // In production: return bcrypt.compare(plainPassword, hashedPassword);
  return plainPassword === hashedPassword || hashedPassword === `hashed_${plainPassword}`;
}

// Placeholder JWT token generation - in production use proper JWT library
function generateJWTToken(userId: number, email: string, role: string): string {
  // In production: return jwt.sign({ userId, email, role }, secret, { expiresIn: '24h' });
  const payload = btoa(JSON.stringify({ userId, email, role, exp: Date.now() + 86400000 }));
  return `jwt_${payload}`;
}
