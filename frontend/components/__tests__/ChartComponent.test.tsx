import { render, screen, waitFor } from '@testing-library/react'
import { ChartComponent } from '../Chart/ChartComponent'
import { Ticker } from '@/types/ticker'

const mockTicker: Ticker = {
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
}

describe('ChartComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [
            { timestamp: '2024-01-01', open: 150, high: 152, low: 149, close: 151, volume: 1000000 },
            { timestamp: '2024-01-02', open: 151, high: 153, low: 150, close: 152, volume: 1100000 },
          ]
        }),
      })
    ) as jest.Mock
  })

  it('renders chart container', async () => {
    render(<ChartComponent ticker={mockTicker} />)
    
    await waitFor(() => {
      expect(screen.getByText('Candlestick')).toBeInTheDocument()
    })
  })

  it('fetches historical data on mount', async () => {
    render(<ChartComponent ticker={mockTicker} />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickers/AAPL/history'),
        expect.any(Object)
      )
    })
  })
})