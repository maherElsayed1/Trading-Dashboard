import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from '../useWebSocket'

describe('useWebSocket', () => {
  let mockWebSocket: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock WebSocket
    mockWebSocket = {
      readyState: WebSocket.CONNECTING,
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    
    global.WebSocket = jest.fn(() => mockWebSocket) as any
  })

  it('initializes with disconnected state', () => {
    const { result } = renderHook(() => useWebSocket())
    
    expect(result.current.isConnected).toBe(false)
  })

  it('connects to WebSocket on mount', () => {
    renderHook(() => useWebSocket())
    
    expect(global.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('ws://localhost:3001')
    )
  })

  it('subscribes to ticker updates', () => {
    const { result } = renderHook(() => useWebSocket())
    
    // Set connection as open
    act(() => {
      mockWebSocket.readyState = WebSocket.OPEN
    })
    
    // Subscribe to tickers
    act(() => {
      result.current.subscribe(['AAPL', 'TSLA'])
    })
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL', 'TSLA'],
      })
    )
  })
})