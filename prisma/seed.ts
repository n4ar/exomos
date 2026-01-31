import prisma from '../lib/prisma'

async function main() {
  console.log('🌱 Starting seed...')

  // Note: In production, users will be created via Supabase Auth
  // This is just for development/testing

  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
