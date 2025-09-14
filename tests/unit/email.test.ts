import {
  sendInviteEmail,
  sendNewInventoryNotification,
} from '@/lib/email'

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}))

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendInviteEmail', () => {
    const inviteData = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Smith',
      companyName: 'Test Moving Co',
      role: 'sales',
      inviteUrl: 'https://example.com/invite/abc123',
    }

    it('sends invite email successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      const result = await sendInviteEmail(inviteData)

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'Smart Move Inventory <noreply@smartmoveinventory.com>',
        to: ['test@example.com'],
        subject: 'You\'re invited to join Test Moving Co on Smart Move Inventory',
        html: expect.stringContaining('John Smith'),
        text: expect.stringContaining('John Smith'),
      })
    })

    it('handles email sending failure', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Email failed'))
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      const result = await sendInviteEmail(inviteData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to send invite email')
    })

    it('includes correct role information in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      await sendInviteEmail(inviteData)

      const emailCall = mockSend.mock.calls[0][0]
      expect(emailCall.html).toContain('Sales Representative')
    })

    it('includes invite URL in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      await sendInviteEmail(inviteData)

      const emailCall = mockSend.mock.calls[0][0]
      expect(emailCall.html).toContain('https://example.com/invite/abc123')
    })

    it('handles testing mode correctly', async () => {
      process.env.NODE_ENV = 'development'
      
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      await sendInviteEmail(inviteData)

      const emailCall = mockSend.mock.calls[0][0]
      expect(emailCall.html).toContain('TESTING MODE')
    })
  })

  describe('sendNewInventoryNotification', () => {
    const notificationData = {
      salesRepEmail: 'sales@example.com',
      salesRepName: 'Jane Doe',
      inventoryId: 'inv-123',
      inventoryTitle: 'Smith Family Move',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      itemCount: 15,
      companyName: 'Test Moving Co',
      submittedAt: new Date('2024-01-15T10:00:00Z'),
    }

    it('sends new inventory notification successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      const result = await sendNewInventoryNotification(notificationData)

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        from: 'Smart Move Inventory <noreply@smartmoveinventory.com>',
        to: ['sales@example.com'],
        subject: 'New Inventory Submitted: Smith Family Move',
        html: expect.stringContaining('Smith Family Move'),
        text: expect.stringContaining('Smith Family Move'),
      })
    })

    it('includes customer and inventory details in notification', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      await sendNewInventoryNotification(notificationData)

      const emailCall = mockSend.mock.calls[0][0]
      expect(emailCall.html).toContain('John Smith')
      expect(emailCall.html).toContain('Smith Family Move')
      expect(emailCall.html).toContain('15 items')
      expect(emailCall.html).toContain('Test Moving Co')
    })

    it('includes correct inventory URL in notification', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      await sendNewInventoryNotification(notificationData)

      const emailCall = mockSend.mock.calls[0][0]
      expect(emailCall.html).toContain('/inventories/inv-123')
    })

    it('handles notification sending failure', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Notification failed'))
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      const result = await sendNewInventoryNotification(notificationData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to send new inventory notification')
    })

    it('formats submission date correctly', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      await sendNewInventoryNotification(notificationData)

      const emailCall = mockSend.mock.calls[0][0]
      expect(emailCall.html).toContain('Jan 15, 2024 at 10:00 AM')
    })

    it('handles testing mode in notification', async () => {
      process.env.NODE_ENV = 'development'
      
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      await sendNewInventoryNotification(notificationData)

      const emailCall = mockSend.mock.calls[0][0]
      expect(emailCall.html).toContain('TESTING MODE')
    })
  })

  describe('Email template validation', () => {
    it('generates valid HTML for invite email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      const inviteData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Smith',
        companyName: 'Test Moving Co',
        role: 'sales',
        inviteUrl: 'https://example.com/invite/abc123',
      }

      await sendInviteEmail(inviteData)

      const emailCall = mockSend.mock.calls[0][0]
      const html = emailCall.html

      // Check for essential HTML elements
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html>')
      expect(html).toContain('<body>')
      expect(html).toContain('</html>')

      // Check for content
      expect(html).toContain('John Smith')
      expect(html).toContain('Test Moving Co')
      expect(html).toContain('https://example.com/invite/abc123')
    })

    it('generates valid HTML for notification email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ id: 'email-123' })
      const { Resend } = require('resend')
      const mockResend = new Resend()
      mockResend.emails.send = mockSend

      const notificationData = {
        salesRepEmail: 'sales@example.com',
        salesRepName: 'Jane Doe',
        inventoryId: 'inv-123',
        inventoryTitle: 'Smith Family Move',
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        itemCount: 15,
        companyName: 'Test Moving Co',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
      }

      await sendNewInventoryNotification(notificationData)

      const emailCall = mockSend.mock.calls[0][0]
      const html = emailCall.html

      // Check for essential HTML elements
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html>')
      expect(html).toContain('<body>')
      expect(html).toContain('</html>')

      // Check for content
      expect(html).toContain('Smith Family Move')
      expect(html).toContain('John Smith')
      expect(html).toContain('15 items')
    })
  })
})
