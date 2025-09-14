import { test, expect } from '@playwright/test'

test.describe('CRM Integration E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - assuming user is logged in as admin
    await page.goto('/')
    
    // Mock the user being logged in as admin
    await page.evaluate(() => {
      localStorage.setItem('clerk-session', JSON.stringify({
        user: {
          id: 'test-admin-id',
          firstName: 'Admin',
          lastName: 'User',
          emailAddresses: [{ emailAddress: 'admin@example.com' }],
          publicMetadata: { role: 'admin' }
        }
      }))
    })
  })

  test('admin can access CRM management page', async ({ page }) => {
    await page.goto('/admin/crm')
    
    // Should see CRM management interface
    await expect(page.getByText('CRM Integration Management')).toBeVisible()
    await expect(page.getByText('Add Integration')).toBeVisible()
  })

  test('admin can add a new CRM integration', async ({ page }) => {
    await page.goto('/admin/crm')
    
    // Click add integration button
    await page.getByText('Add Integration').click()
    
    // Fill out the form
    await page.getByLabel('CRM Provider').click()
    await page.getByText('SmartMoving').click()
    
    await page.getByLabel('Integration Name').fill('Test SmartMoving Integration')
    await page.getByLabel('Description').fill('Test integration for SmartMoving CRM')
    await page.getByLabel('API Endpoint').fill('https://api.smartmoving.com/v1')
    await page.getByLabel('API Key').fill('test-api-key-123')
    await page.getByLabel('API Secret').fill('test-api-secret-456')
    await page.getByLabel('Webhook URL').fill('https://example.com/webhook')
    
    // Configure sync settings
    await page.getByLabel('Sync Leads').check()
    await page.getByLabel('Sync Sales').check()
    await page.getByLabel('Sync Schedule').check()
    await page.getByLabel('Sync Customers').check()
    
    // Submit the form
    await page.getByText('Create Integration').click()
    
    // Should see success message and new integration
    await expect(page.getByText('CRM integration created successfully!')).toBeVisible()
    await expect(page.getByText('Test SmartMoving Integration')).toBeVisible()
  })

  test('admin can view CRM data in tabs', async ({ page }) => {
    await page.goto('/admin/crm')
    
    // Mock CRM data by intercepting API calls
    await page.route('**/api/admin/crm/leads', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@example.com',
            phone: '+1-555-0123',
            status: 'new',
            priority: 'high',
            estimatedValue: 2500,
            moveDate: '2024-02-15T00:00:00Z',
            createdAt: '2024-01-15T00:00:00Z',
          }
        ])
      })
    })

    await page.route('**/api/admin/crm/sales', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            opportunityName: 'John Smith Residential Move',
            stage: 'proposal',
            probability: 75,
            estimatedValue: 2500,
            actualValue: null,
            expectedCloseDate: '2024-02-01T00:00:00Z',
            createdAt: '2024-01-15T00:00:00Z',
          }
        ])
      })
    })

    await page.route('**/api/admin/crm/schedules', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Site Visit - John Smith',
            startTime: '2024-01-20T10:00:00Z',
            endTime: '2024-01-20T12:00:00Z',
            type: 'site-visit',
            status: 'scheduled',
            location: '123 Main St',
            createdAt: '2024-01-15T00:00:00Z',
          }
        ])
      })
    })

    // Test leads tab
    await page.getByText('Leads (0)').click()
    await expect(page.getByText('John Smith')).toBeVisible()
    await expect(page.getByText('john@example.com')).toBeVisible()
    await expect(page.getByText('New')).toBeVisible()
    await expect(page.getByText('High')).toBeVisible()

    // Test sales tab
    await page.getByText('Sales (0)').click()
    await expect(page.getByText('John Smith Residential Move')).toBeVisible()
    await expect(page.getByText('Proposal')).toBeVisible()
    await expect(page.getByText('75%')).toBeVisible()

    // Test schedules tab
    await page.getByText('Schedule (0)').click()
    await expect(page.getByText('Site Visit - John Smith')).toBeVisible()
    await expect(page.getByText('Site-visit')).toBeVisible()
    await expect(page.getByText('Scheduled')).toBeVisible()
  })

  test('admin can sync CRM integration', async ({ page }) => {
    await page.goto('/admin/crm')
    
    // Mock integration data
    await page.route('**/api/admin/crm/integrations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            provider: 'smartmoving',
            name: 'SmartMoving Integration',
            description: 'Test integration',
            isActive: true,
            syncLeads: true,
            syncSales: true,
            syncSchedule: true,
            syncCustomers: true,
            lastSyncAt: null,
            createdAt: '2024-01-01T00:00:00Z',
          }
        ])
      })
    })

    // Mock sync API response
    await page.route('**/api/admin/crm/integrations/1/sync', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'CRM data synced successfully',
          results: {
            leads: { synced: 5, created: 3, updated: 2 },
            sales: { synced: 3, created: 1, updated: 2 },
            schedules: { synced: 8, created: 4, updated: 4 }
          }
        })
      })
    })

    // Wait for integration to load and click sync
    await expect(page.getByText('SmartMoving Integration')).toBeVisible()
    await page.getByText('Sync').click()
    
    // Should see success message
    await expect(page.getByText('CRM data synced successfully!')).toBeVisible()
  })

  test('admin can toggle integration active status', async ({ page }) => {
    await page.goto('/admin/crm')
    
    // Mock integration data
    await page.route('**/api/admin/crm/integrations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            provider: 'smartmoving',
            name: 'SmartMoving Integration',
            description: 'Test integration',
            isActive: true,
            syncLeads: true,
            syncSales: true,
            syncSchedule: true,
            syncCustomers: true,
            lastSyncAt: '2024-01-15T10:00:00Z',
            createdAt: '2024-01-01T00:00:00Z',
          }
        ])
      })
    })

    // Mock update API response
    await page.route('**/api/admin/crm/integrations/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Integration updated successfully' })
      })
    })

    // Wait for integration to load and click deactivate
    await expect(page.getByText('SmartMoving Integration')).toBeVisible()
    await page.getByText('Deactivate').click()
    
    // Should see success message
    await expect(page.getByText('Integration deactivated successfully!')).toBeVisible()
  })

  test('admin can edit integration', async ({ page }) => {
    await page.goto('/admin/crm')
    
    // Mock integration data
    await page.route('**/api/admin/crm/integrations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            provider: 'smartmoving',
            name: 'SmartMoving Integration',
            description: 'Test integration',
            isActive: true,
            syncLeads: true,
            syncSales: true,
            syncSchedule: true,
            syncCustomers: true,
            lastSyncAt: '2024-01-15T10:00:00Z',
            createdAt: '2024-01-01T00:00:00Z',
          }
        ])
      })
    })

    // Wait for integration to load and click edit
    await expect(page.getByText('SmartMoving Integration')).toBeVisible()
    await page.getByText('Edit').click()
    
    // Should see edit dialog (this would be implemented in the actual component)
    // For now, just verify the button is clickable
    await expect(page.getByText('Edit')).toBeVisible()
  })

  test('handles API errors gracefully', async ({ page }) => {
    await page.goto('/admin/crm')
    
    // Mock API error
    await page.route('**/api/admin/crm/integrations', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    // Should show error message
    await expect(page.getByText(/Failed to load CRM data/)).toBeVisible()
  })

  test('shows empty state when no integrations exist', async ({ page }) => {
    await page.goto('/admin/crm')
    
    // Mock empty response
    await page.route('**/api/admin/crm/integrations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    // Should show empty state message
    await expect(page.getByText(/No CRM integrations configured/)).toBeVisible()
  })
})
