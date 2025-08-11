import { renderHook, waitFor } from '@testing-library/react'
import { useTickers } from '../useTickers'
import { Ticker } from '@/types/ticker'

const mockTickers: Ticker[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 150.50,
    previousClose: 148.00,
    change: 2.50,
    changePercent: 1.69,
    high: 151.00,
    low: 149.00,
    volume: 1000000,
    timestamp: new Date().toISOString(),
  },
]

describe('useTickers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockTickers,
        }),
      })
    ) as jest.Mock
  })

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useTickers())
    
    expect(result.current.tickers).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('fetches tickers on mount', async () => {
    const { result } = renderHook(() => useTickers())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tickers'),
      expect.any(Object)
    )
  })
})