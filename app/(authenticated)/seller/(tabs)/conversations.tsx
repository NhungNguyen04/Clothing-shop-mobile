import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Conversation, getSellerConversations, getLastMessage, Message } from '../../../../services/chat';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/AuthStore';

export default function SellerConversationsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { seller } = useAuthStore();

  useEffect(() => {
    fetchSellerConversations();
  }, []);

  const fetchSellerConversations = async () => {
    if (!seller?.id) {
      setError('User is not a seller');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const sellerConversations = await getSellerConversations(seller.id);
      setConversations(sellerConversations);
      
      // Fetch last message for each conversation
      const lastMessagesMap: Record<string, Message> = {};
      await Promise.all(
        sellerConversations.map(async (conversation) => {
          const lastMessage = await getLastMessage(conversation.id);
          if (lastMessage) {
            lastMessagesMap[conversation.id] = lastMessage;
          }
        })
      );
      
      setLastMessages(lastMessagesMap);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError('Failed to load conversations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToConversation = (conversationId: string) => {
    router.push(`/(authenticated)/seller/chat/${conversationId}` as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    // For seller view, always show the user's information
    const customer = item.user;
    const lastMessage = lastMessages[item.id];
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigateToConversation(item.id)}
      >
        <View style={styles.avatar}>
          <Ionicons name="person-circle" size={50} color="#555" />
        </View>
        <View style={styles.conversationContent}>
          <Text style={styles.participantName}>
            {customer?.name || 'Unknown Customer'}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          {lastMessage && (
            <Text style={styles.timeText}>
              {formatDate(lastMessage.createdAt)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSellerConversations}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Customer Messages</Text>
      
      {conversations.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={80} color="#ccc" />
          <Text style={styles.emptyStateText}>No customer conversations yet</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    marginRight: 16,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  participantName: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: 'medium',
    marginBottom: 4,
  },
  lastMessage: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#666',
  },
  timeContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  timeText: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#999',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  }
});