import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../Layout/Header'

// Mock the auth hook
const mockLogout = jest.fn()
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    logout: mockLogout,
  })),
}))

// Mock the LoginModal component
jest.mock('../Auth/LoginModal', () => ({
  LoginModal: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="login-modal">Login Modal</div> : null,
}))

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the header with logo and title', () => {
    render(<Header isConnected={true} />)
    
    expect(screen.getByText('Trading Dashboard')).toBeInTheDocument()
    expect(screen.getByText('📈')).toBeInTheDocument()
  })

  it('shows login button when not authenticated', () => {
    render(<Header isConnected={true} />)
    
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('shows connection status when connected', () => {
    render(<Header isConnected={true} />)
    
    expect(screen.getByText('● Connected')).toBeInTheDocument()
  })

  it('shows disconnected status when not connected', () => {
    render(<Header isConnected={false} />)
    
    expect(screen.getByText('● Disconnected')).toBeInTheDocument()
  })

  it('displays current time', () => {
    render(<Header isConnected={true} />)
    
    // Check for time format (HH:MM:SS)
    const timeRegex = /\d{2}:\d{2}:\d{2}/
    expect(screen.getByText(timeRegex)).toBeInTheDocument()
  })
})