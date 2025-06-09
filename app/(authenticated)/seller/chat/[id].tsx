import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Send } from 'react-native-feather';
import { useAuthStore } from '@/store/AuthStore';
import {
  Message,
  getConversation,
  getConversationMessages,
  sendMessage,
  ChatWebSocket
} from '@/services/chat';
import { Image } from 'expo-image';

export default function SellerChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const conversationId = params.id;
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerImage, setCustomerImage] = useState('');
  const [webSocketClient, setWebSocketClient] = useState<ChatWebSocket | null>(null);

  // Load conversation and messages when the screen loads
  useEffect(() => {
    if (!user || !conversationId) return;
    
    // Keep track of message IDs we've already seen to avoid duplicates
    const processedMessageIds = new Set<string>();
    
    const fetchData = async () => {
      try {
        // Get conversation details
        const conversation = await getConversation(conversationId);
        
        // Get customer details
        setCustomerName(conversation.user.name || 'Customer');
        setCustomerImage(conversation.user.image || '');
        
        // Get messages
        const conversationMessages = await getConversationMessages(conversationId);
        
        // Track existing message IDs
        conversationMessages.forEach(msg => processedMessageIds.add(msg.id));
        
        setMessages(conversationMessages);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversation data:', err);
        setError('Failed to load conversation. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
    
    const wsClient = new ChatWebSocket(user.id);
    wsClient.connect();
    
    // Join the conversation room to receive messages for this conversation
    setTimeout(() => {
      wsClient.joinConversation(conversationId);
    }, 1000); // Small delay to ensure connection is established
    
    // Add handler for incoming messages
    const unsubscribe = wsClient.onMessage((newMessage) => {
      console.log("Received message in handler:", newMessage);
      if (newMessage.conversationId === conversationId) {
        // Check if this is a new message (not one we've processed before)
        if (!processedMessageIds.has(newMessage.id)) {
          processedMessageIds.add(newMessage.id);
          
          setMessages(prev => {
            // Find any temporary message with the same content to replace
            const existingTempIndex = prev.findIndex(m => 
              m.id.startsWith('temp-') && 
              m.content === newMessage.content &&
              m.senderId === newMessage.senderId
            );
            
            if (existingTempIndex >= 0) {
              // Replace the temp message with the real one
              const updatedMessages = [...prev];
              updatedMessages[existingTempIndex] = newMessage;
              return updatedMessages;
            } else {
              // It's a completely new message (probably from another user)
              return [...prev, newMessage];
            }
          });
          
          // Scroll to bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    });
    
    setWebSocketClient(wsClient);
    return () => {
      unsubscribe();
      if (wsClient) {
        wsClient.leaveConversation(conversationId);
        wsClient.disconnect();
      }
    };
  }, [user, conversationId]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !conversationId) return;
    
    const trimmedMessage = messageText.trim();
    
    try {
      // Create a temporary local message to show immediately
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user.id,
        conversationId,
        content: trimmedMessage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add the temporary message to the UI immediately
      setMessages(prev => [...prev, tempMessage]);
      
      // Clear input field after adding temp message
      setMessageText('');
      
      // Scroll to bottom to see the new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Only send via Socket.io - the server will handle persistence
      if (webSocketClient) {
        webSocketClient.sendMessage({
          conversationId,
          content: trimmedMessage
        });
      } else {
        // Fallback to REST API only if websocket is not available
        await sendMessage(user.id, conversationId, trimmedMessage);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Optionally show an error to the user
    }
  };

  // Render each message item
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.id;
    
    // Get the appropriate name for avatars
    const currentUserName = user?.name || 'Me';
    const customerNameValue = customerName || 'Customer';
    
    // Generate initials for avatar fallback
    const getInitials = (name: string) => {
      return name.split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    };
    
    return (
      <View 
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.outgoingMessageContainer : styles.incomingMessageContainer
        ]}
      >
        {!isCurrentUser && (
          customerImage ? (
            <Image 
              source={{ uri: customerImage }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarImage, styles.initialsAvatar]}>
              <Text style={styles.initialsText}>{getInitials(customerNameValue)}</Text>
            </View>
          )
        )}
        
        <View 
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.outgoingMessage : styles.incomingMessage
          ]}
        >
          <Text style={[
            styles.messageText,
            isCurrentUser && styles.outgoingMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isCurrentUser && styles.outgoingMessageTime
          ]}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        
        {isCurrentUser && (
          user?.image ? (
            <Image 
              source={{ uri: user.image }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarImage, styles.initialsAvatar]}>
              <Text style={styles.initialsText}>{getInitials(currentUserName)}</Text>
            </View>
          )
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} className='mt-[-10px]'>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitleAlign: 'center',
          headerTitle: () => (
            <View style={styles.headerContainer}>
              {customerImage ? (
                <Image
                  source={{ uri: customerImage }}
                  style={styles.headerAvatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.headerAvatar, styles.initialsHeaderAvatar]}>
                  <Text style={styles.initialsHeaderText}>
                    {customerName ? customerName.substring(0, 1).toUpperCase() : 'C'}
                  </Text>
                </View>
              )}
              <Text style={styles.headerTitle} numberOfLines={1}>
                {customerName || 'Customer'}
              </Text>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButtonContainer}
              onPress={() => router.back()}
            >
              <ChevronLeft width={24} height={24} color="#000" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: true,
          contentStyle: {
            paddingTop: 0,
          }
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageListContent}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Send width={20} height={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  initialsHeaderAvatar: {
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Outfit-Medium',
    fontSize: 16,
    flex: 1,
  },
  backButtonContainer: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  incomingMessageContainer: {
    justifyContent: 'flex-start',
  },
  outgoingMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  initialsAvatar: {
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '70%', // Reduced to make room for the avatar
  },
  incomingMessage: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  outgoingMessage: {
    backgroundColor: '#0066FF', // Changed color to blue for seller app
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontFamily: 'Outfit',
    color: '#1f2937',
    fontSize: 16,
  },
  outgoingMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontFamily: 'Outfit',
    fontSize: 12,
    marginTop: 4,
    color: '#9ca3af',
    alignSelf: 'flex-end',
  },
  outgoingMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontFamily: 'Outfit',
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#0066FF', // Changed color to blue for seller app
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Outfit',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    color: '#0066FF', 
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    fontFamily: 'Outfit-Medium',
    fontSize: 16,
    color: '#0066FF', 
  },
});
