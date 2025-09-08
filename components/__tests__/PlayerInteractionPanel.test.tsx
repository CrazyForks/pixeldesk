import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PlayerInteractionPanel from '../PlayerInteractionPanel'

const mockPlayer = {
  id: 'test-player-1',
  name: 'Test Player',
  avatar: undefined,
  currentStatus: {
    type: 'working',
    status: '工作中',
    emoji: '💼',
    message: '正在专注工作中...',
    timestamp: new Date().toISOString()
  },
  isOnline: true,
  lastSeen: undefined
}

describe('PlayerInteractionPanel', () => {
  it('renders player information correctly', () => {
    render(<PlayerInteractionPanel player={mockPlayer} />)
    
    expect(screen.getByText('Test Player')).toBeInTheDocument()
    expect(screen.getByText('工作中')).toBeInTheDocument()
    expect(screen.getByText('正在专注工作中...')).toBeInTheDocument()
    expect(screen.getByText('在线')).toBeInTheDocument()
  })

  it('displays player avatar or initials', () => {
    render(<PlayerInteractionPanel player={mockPlayer} />)
    
    // Should show first letter of name when no avatar
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('shows online status indicator', () => {
    render(<PlayerInteractionPanel player={mockPlayer} />)
    
    const onlineIndicator = document.querySelector('.bg-green-400.animate-pulse')
    expect(onlineIndicator).toBeInTheDocument()
  })

  it('renders quick action buttons', () => {
    render(<PlayerInteractionPanel player={mockPlayer} />)
    
    expect(screen.getByText('关注')).toBeInTheDocument()
    expect(screen.getByText('详情')).toBeInTheDocument()
    expect(screen.getByText('邀请')).toBeInTheDocument()
  })

  it('handles message sending', async () => {
    const mockSendMessage = jest.fn()
    render(
      <PlayerInteractionPanel 
        player={mockPlayer} 
        onSendMessage={mockSendMessage}
      />
    )
    
    const messageInput = screen.getByPlaceholderText('输入消息...')
    const sendButton = screen.getByText('发送')
    
    fireEvent.change(messageInput, { target: { value: 'Hello test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Hello test message')
    })
  })

  it('handles follow action', () => {
    const mockFollow = jest.fn()
    render(
      <PlayerInteractionPanel 
        player={mockPlayer} 
        onFollow={mockFollow}
      />
    )
    
    const followButton = screen.getByText('关注')
    fireEvent.click(followButton)
    
    expect(mockFollow).toHaveBeenCalledWith('test-player-1')
  })

  it('handles view profile action', () => {
    const mockViewProfile = jest.fn()
    render(
      <PlayerInteractionPanel 
        player={mockPlayer} 
        onViewProfile={mockViewProfile}
      />
    )
    
    const profileButton = screen.getByText('详情')
    fireEvent.click(profileButton)
    
    expect(mockViewProfile).toHaveBeenCalledWith('test-player-1')
  })

  it('displays empty chat state initially', () => {
    render(<PlayerInteractionPanel player={mockPlayer} />)
    
    expect(screen.getByText('还没有聊天记录')).toBeInTheDocument()
    expect(screen.getByText('发送第一条消息开始对话吧！')).toBeInTheDocument()
  })

  it('prevents sending empty messages', () => {
    const mockSendMessage = jest.fn()
    render(
      <PlayerInteractionPanel 
        player={mockPlayer} 
        onSendMessage={mockSendMessage}
      />
    )
    
    const sendButton = screen.getByText('发送')
    
    // Button should be disabled when input is empty
    expect(sendButton).toBeDisabled()
    
    fireEvent.click(sendButton)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('shows offline status for offline players', () => {
    const offlinePlayer = {
      ...mockPlayer,
      isOnline: false,
      lastSeen: '2小时前'
    }
    
    render(<PlayerInteractionPanel player={offlinePlayer} />)
    
    expect(screen.getByText('最后在线: 2小时前')).toBeInTheDocument()
    
    const offlineIndicator = document.querySelector('.bg-gray-400')
    expect(offlineIndicator).toBeInTheDocument()
  })
})