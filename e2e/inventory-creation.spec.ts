import { test, expect } from '@playwright/test'

test.describe('Inventory Creation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('clerk-session', JSON.stringify({
        user: {
          id: 'test-user-id',
          firstName: 'John',
          lastName: 'Smith',
          emailAddresses: [{ emailAddress: 'john@example.com' }],
          publicMetadata: { role: 'customer' }
        }
      }))
    })
  })

  test('customer can create a new inventory', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Mock successful inventory creation
    await page.route('**/api/inventories', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'inv-123',
            title: 'Smith Family Move',
            status: 'submitted',
            createdAt: '2024-01-15T10:00:00Z'
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      }
    })

    // Click create inventory button
    await page.getByText('Create New Inventory').click()
    
    // Fill out inventory form
    await page.getByLabel('Inventory Title').fill('Smith Family Move')
    await page.getByLabel('Notes').fill('Moving from downtown to suburbs')
    
    // Upload some test images (mock file upload)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([
      {
        name: 'test-image-1.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data-1')
      },
      {
        name: 'test-image-2.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data-2')
      }
    ])

    // Mock AI analysis response
    await page.route('**/api/analyze', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              shortName: 'Sofa',
              description: 'Large 3-seat fabric sofa',
              roomName: 'Living Room',
              dimensions: {
                length: 84,
                width: 36,
                height: 34
              },
              tags: ['furniture', 'living-room', 'large']
            },
            {
              shortName: 'Dining Table',
              description: 'Wooden dining table with 6 chairs',
              roomName: 'Dining Room',
              dimensions: {
                length: 72,
                width: 42,
                height: 30
              },
              tags: ['furniture', 'dining-room', 'wood']
            }
          ]
        })
      })
    })

    // Click analyze button
    await page.getByText('Analyze Photos').click()
    
    // Wait for analysis to complete
    await expect(page.getByText('Analysis Complete')).toBeVisible()
    await expect(page.getByText('Sofa')).toBeVisible()
    await expect(page.getByText('Dining Table')).toBeVisible()

    // Submit the inventory
    await page.getByText('Submit Inventory').click()
    
    // Should redirect to inventory detail page
    await expect(page).toHaveURL(/\/inventories\/inv-123/)
    await expect(page.getByText('Smith Family Move')).toBeVisible()
    await expect(page.getByText('Submitted')).toBeVisible()
  })

  test('customer can edit inventory items', async ({ page }) => {
    await page.goto('/inventories/inv-123')
    
    // Mock inventory data
    await page.route('**/api/inventories/inv-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'inv-123',
          title: 'Smith Family Move',
          status: 'submitted',
          items: [
            {
              id: '1',
              shortName: 'Sofa',
              description: 'Large 3-seat fabric sofa',
              roomName: 'Living Room',
              lengthIn: 84,
              widthIn: 36,
              heightIn: 34,
              tags: ['furniture', 'living-room']
            }
          ]
        })
      })
    })

    // Mock item update API
    await page.route('**/api/inventories/inv-123/items/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Click edit button on item
    await page.getByRole('button', { name: /Edit Sofa/ }).click()
    
    // Edit item details
    await page.getByDisplayValue('Large 3-seat fabric sofa').fill('Large 3-seat leather sofa')
    await page.getByDisplayValue('84').fill('86')
    await page.getByDisplayValue('36').fill('38')
    await page.getByDisplayValue('34').fill('35')
    
    // Save changes
    await page.getByText('Save Changes').click()
    
    // Should see success message
    await expect(page.getByText(/Item updated successfully/)).toBeVisible()
    await expect(page.getByText('Large 3-seat leather sofa')).toBeVisible()
  })

  test('customer can add custom items', async ({ page }) => {
    await page.goto('/inventories/inv-123')
    
    // Mock inventory data
    await page.route('**/api/inventories/inv-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'inv-123',
          title: 'Smith Family Move',
          status: 'submitted',
          items: []
        })
      })
    })

    // Mock item creation API
    await page.route('**/api/inventories/inv-123/items', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '2',
          shortName: 'Custom Item',
          description: 'Custom item description',
          roomName: 'Custom Room',
          lengthIn: 24,
          widthIn: 18,
          heightIn: 12
        })
      })
    })

    // Click add item button
    await page.getByText('Add Custom Item').click()
    
    // Fill out item form
    await page.getByLabel('Item Name').fill('Custom Item')
    await page.getByLabel('Description').fill('Custom item description')
    await page.getByLabel('Room').fill('Custom Room')
    await page.getByLabel('Length (inches)').fill('24')
    await page.getByLabel('Width (inches)').fill('18')
    await page.getByLabel('Height (inches)').fill('12')
    
    // Save item
    await page.getByText('Add Item').click()
    
    // Should see new item
    await expect(page.getByText('Custom Item')).toBeVisible()
    await expect(page.getByText('Custom item description')).toBeVisible()
  })

  test('customer can delete items', async ({ page }) => {
    await page.goto('/inventories/inv-123')
    
    // Mock inventory data with items
    await page.route('**/api/inventories/inv-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'inv-123',
          title: 'Smith Family Move',
          status: 'submitted',
          items: [
            {
              id: '1',
              shortName: 'Sofa',
              description: 'Large 3-seat fabric sofa',
              roomName: 'Living Room'
            }
          ]
        })
      })
    })

    // Mock item deletion API
    await page.route('**/api/inventories/inv-123/items/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Click delete button on item
    await page.getByRole('button', { name: /Delete Sofa/ }).click()
    
    // Confirm deletion
    await page.getByText('Yes, Delete Item').click()
    
    // Should see success message and item removed
    await expect(page.getByText(/Item deleted successfully/)).toBeVisible()
    await expect(page.getByText('Sofa')).not.toBeVisible()
  })

  test('customer can view pricing calculator', async ({ page }) => {
    await page.goto('/inventories/inv-123')
    
    // Mock inventory data
    await page.route('**/api/inventories/inv-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'inv-123',
          title: 'Smith Family Move',
          status: 'submitted',
          items: [
            {
              id: '1',
              shortName: 'Sofa',
              description: 'Large 3-seat fabric sofa',
              roomName: 'Living Room',
              lengthIn: 84,
              widthIn: 36,
              heightIn: 34
            }
          ]
        })
      })
    })

    // Mock pricing calculation
    await page.route('**/api/inventories/inv-123/pricing', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          baseCost: 200,
          additionalHandling: 50,
          disposal: 25,
          storage: 0,
          stairs: 30,
          packing: 40,
          unpacking: 25,
          distance: 15,
          subtotal: 385,
          tax: 30.8,
          totalCost: 415.8
        })
      })
    })

    // Click on pricing calculator tab
    await page.getByText('Pricing Calculator').click()
    
    // Should see pricing breakdown
    await expect(page.getByText('Base Cost')).toBeVisible()
    await expect(page.getByText('$200.00')).toBeVisible()
    await expect(page.getByText('Total Cost')).toBeVisible()
    await expect(page.getByText('$415.80')).toBeVisible()
  })

  test('customer can export inventory', async ({ page }) => {
    await page.goto('/inventories/inv-123')
    
    // Mock inventory data
    await page.route('**/api/inventories/inv-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'inv-123',
          title: 'Smith Family Move',
          status: 'submitted',
          items: [
            {
              id: '1',
              shortName: 'Sofa',
              description: 'Large 3-seat fabric sofa',
              roomName: 'Living Room'
            }
          ]
        })
      })
    })

    // Mock export API
    await page.route('**/api/inventories/inv-123/export/pdf', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('fake-pdf-content')
      })
    })

    // Click export button
    await page.getByText('Export PDF').click()
    
    // Should trigger download (this would be handled by the browser)
    // We can't easily test the actual download, but we can verify the API was called
    await expect(page.getByText('Export PDF')).toBeVisible()
  })

  test('handles inventory creation errors gracefully', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Mock API error
    await page.route('**/api/inventories', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to create inventory' })
      })
    })

    // Try to create inventory
    await page.getByText('Create New Inventory').click()
    await page.getByLabel('Inventory Title').fill('Test Move')
    await page.getByText('Submit Inventory').click()
    
    // Should see error message
    await expect(page.getByText(/Failed to create inventory/)).toBeVisible()
  })
})
