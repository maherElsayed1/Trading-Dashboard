import { render, screen, fireEvent } from '@testing-library/react'
import { TickerCard } from '../TickerList/TickerCard'
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

describe('TickerCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders ticker information correctly', () => {
    render(
      <TickerCard 
        ticker={mockTicker} 
        isSelected={false} 
      />
    )
    
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    expect(screen.getByText('$150.50')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn()
    render(
      <TickerCard 
        ticker={mockTicker} 
        isSelected={false} 
        onClick={mockOnClick}
      />
    )
    
    // Click on the ticker symbol
    const tickerElement = screen.getByText('AAPL')
    fireEvent.click(tickerElement.closest('div'))
    
    expect(mockOnClick).toHaveBeenCalled()
  })
})