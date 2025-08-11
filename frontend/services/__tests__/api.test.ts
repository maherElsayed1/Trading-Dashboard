import { apiClient } from '../api.service'

// Mock fetch globally
global.fetch = jest.fn()

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('Authentication', () => {
    it('logs in successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'test-token',
          user: { id: '1', email: 'test@example.com' },
        },
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      
      const result = await apiClient.login('test@example.com', 'password')
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('Tickers', () => {
    it('fetches all tickers', async () => {
      const mockTickers = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 150.50,
        },
      ]
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTickers }),
      })
      
      const result = await apiClient.getTickers()
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickers'),
        expect.any(Object)
      )
      expect(result).toEqual(mockTickers)
    })
  })
})