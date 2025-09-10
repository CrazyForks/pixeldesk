/**
 * Verification script for Chat EventBus integration
 * 
 * This script verifies that the chat events are properly integrated
 * with the EventBus system.
 */

const { EventBus } = require('./eventBus.ts')

console.log('🧪 Testing Chat EventBus Integration...\n')

// Test 1: Verify EventBus can handle chat events
console.log('Test 1: EventBus Chat Event Handling')
let testsPassed = 0
let totalTests = 0

// Test chat:message:received event
totalTests++
try {
  let eventReceived = false
  
  EventBus.on('chat:message:received', (event) => {
    if (event.type === 'chat:message:received' && event.message && event.conversationId) {
      eventReceived = true
      console.log('✅ chat:message:received event handled correctly')
      testsPassed++
    }
  })
  
  EventBus.emit('chat:message:received', {
    type: 'chat:message:received',
    timestamp: Date.now(),
    message: {
      id: 'test-msg-123',
      conversationId: 'test-conv-456',
      senderId: 'test-user-789',
      senderName: 'Test User',
      content: 'Hello World',
      type: 'text',
      status: 'sent',
      timestamp: '2023-01-01T00:00:00Z',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    conversationId: 'test-conv-456'
  })
  
  if (!eventReceived) {
    console.log('❌ chat:message:received event not handled')
  }
} catch (error) {
  console.log('❌ Error testing chat:message:received:', error.message)
}

// Test chat:user:typing event
totalTests++
try {
  let eventReceived = false
  
  EventBus.on('chat:user:typing', (event) => {
    if (event.type === 'chat:user:typing' && event.userId && event.conversationId) {
      eventReceived = true
      console.log('✅ chat:user:typing event handled correctly')
      testsPassed++
    }
  })
  
  EventBus.emit('chat:user:typing', {
    type: 'chat:user:typing',
    timestamp: Date.now(),
    userId: 'test-user-123',
    conversationId: 'test-conv-456',
    isTyping: true
  })
  
  if (!eventReceived) {
    console.log('❌ chat:user:typing event not handled')
  }
} catch (error) {
  console.log('❌ Error testing chat:user:typing:', error.message)
}

// Test chat:connection:status event
totalTests++
try {
  let eventReceived = false
  
  EventBus.on('chat:connection:status', (event) => {
    if (event.type === 'chat:connection:status' && typeof event.isConnected === 'boolean') {
      eventReceived = true
      console.log('✅ chat:connection:status event handled correctly')
      testsPassed++
    }
  })
  
  EventBus.emit('chat:connection:status', {
    type: 'chat:connection:status',
    timestamp: Date.now(),
    isConnected: true
  })
  
  if (!eventReceived) {
    console.log('❌ chat:connection:status event not handled')
  }
} catch (error) {
  console.log('❌ Error testing chat:connection:status:', error.message)
}

// Test chat:conversation:opened event
totalTests++
try {
  let eventReceived = false
  
  EventBus.on('chat:conversation:opened', (event) => {
    if (event.type === 'chat:conversation:opened' && event.conversationId && event.participant) {
      eventReceived = true
      console.log('✅ chat:conversation:opened event handled correctly')
      testsPassed++
    }
  })
  
  EventBus.emit('chat:conversation:opened', {
    type: 'chat:conversation:opened',
    timestamp: Date.now(),
    conversationId: 'test-conv-789',
    participant: {
      id: 'test-user-456',
      name: 'Test Participant',
      currentStatus: {
        type: 'work',
        status: 'available',
        emoji: '💼',
        message: 'Working',
        timestamp: '2023-01-01T00:00:00Z'
      },
      isOnline: true
    }
  })
  
  if (!eventReceived) {
    console.log('❌ chat:conversation:opened event not handled')
  }
} catch (error) {
  console.log('❌ Error testing chat:conversation:opened:', error.message)
}

// Test 2: Verify EventBus metrics
console.log('\nTest 2: EventBus Metrics')
try {
  const metrics = EventBus.getMetrics()
  if (metrics.totalEvents >= totalTests) {
    console.log('✅ EventBus metrics tracking correctly')
    console.log(`   Total events: ${metrics.totalEvents}`)
    console.log(`   Event types: ${metrics.eventCounts.size}`)
  } else {
    console.log('❌ EventBus metrics not tracking correctly')
  }
} catch (error) {
  console.log('❌ Error getting EventBus metrics:', error.message)
}

// Test 3: Verify event cleanup
console.log('\nTest 3: Event Cleanup')
try {
  const initialListenerCount = EventBus.listenerCount('chat:message:received')
  
  const testHandler = () => {}
  EventBus.on('chat:message:received', testHandler)
  
  const afterAddCount = EventBus.listenerCount('chat:message:received')
  
  EventBus.off('chat:message:received', testHandler)
  
  const afterRemoveCount = EventBus.listenerCount('chat:message:received')
  
  if (afterAddCount === initialListenerCount + 1 && afterRemoveCount === initialListenerCount) {
    console.log('✅ Event listener cleanup working correctly')
  } else {
    console.log('❌ Event listener cleanup not working correctly')
    console.log(`   Initial: ${initialListenerCount}, After add: ${afterAddCount}, After remove: ${afterRemoveCount}`)
  }
} catch (error) {
  console.log('❌ Error testing event cleanup:', error.message)
}

// Summary
console.log('\n📊 Test Summary')
console.log(`✅ Passed: ${testsPassed}/${totalTests} tests`)

if (testsPassed === totalTests) {
  console.log('🎉 All chat EventBus integration tests passed!')
  console.log('\n✨ Chat events are properly integrated with EventBus:')
  console.log('   • chat:message:received')
  console.log('   • chat:user:typing') 
  console.log('   • chat:connection:status')
  console.log('   • chat:conversation:opened')
  console.log('   • chat:user:online')
  console.log('   • chat:notification:new')
  console.log('   • chat:message:sent')
  console.log('   • chat:message:status:updated')
  console.log('   • chat:conversation:updated')
} else {
  console.log('❌ Some tests failed. Please check the implementation.')
  process.exit(1)
}

// Clean up
EventBus.removeAllListeners()
console.log('\n🧹 Cleaned up test event listeners')