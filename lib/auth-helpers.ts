import { User } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'

/**
 * Ensures a user exists in the Prisma database.
 * Creates the user if they don't exist.
 */
export async function ensureUserExists(supabaseUser: User) {
  const existingUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  })

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
      },
    })
  }

  return supabaseUser.id
}
