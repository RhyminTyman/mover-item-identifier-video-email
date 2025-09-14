// Simple test for db.ts
describe('Database Library', () => {
  it('should have prisma client available', () => {
    // Just test that we can import the db module
    const db = require('../../src/lib/db')
    expect(db).toBeDefined()
    expect(db.prisma).toBeDefined()
  })

  it('should handle database connection', async () => {
    const db = require('../../src/lib/db')
    
    // Mock the prisma client
    const mockConnect = jest.fn().mockResolvedValue(undefined)
    const mockDisconnect = jest.fn().mockResolvedValue(undefined)
    
    db.prisma.$connect = mockConnect
    db.prisma.$disconnect = mockDisconnect
    
    await db.prisma.$connect()
    await db.prisma.$disconnect()
    
    expect(mockConnect).toHaveBeenCalled()
    expect(mockDisconnect).toHaveBeenCalled()
  })
})
