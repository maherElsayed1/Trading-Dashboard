import { render, screen, waitFor } from '@testing-library/react'
import { AlertsPanel } from '../Alerts/AlertsPanel'

// Mock fetch
global.fetch = jest.fn()

describe('AlertsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        data: [
          {
            id: '1',
            userId: 'user1',
            symbol: 'AAPL',
            type: 'above',
            threshold: 160,
            active: true,
            createdAt: new Date().toISOString(),
          }
        ] 
      }),
    })
  })

  it('renders alerts panel with title', async () => {
    render(<AlertsPanel />)
    
    expect(screen.getByText('Price Alerts')).toBeInTheDocument()
  })

  it('loads alerts on mount', async () => {
    render(<AlertsPanel />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/alerts'),
        expect.any(Object)
      )
    })
  })
})