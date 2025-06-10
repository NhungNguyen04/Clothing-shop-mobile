import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminAccountService, { User, Seller } from '../../../../services/admin/account';
import { format } from 'date-fns';
import { router } from 'expo-router';

type TabType = 'users' | 'sellers' | 'pending';

const AccountsScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  
  // Modal states for user and seller details
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [userModalVisible, setUserModalVisible] = useState<boolean>(false);
  const [sellerModalVisible, setSellerModalVisible] = useState<boolean>(false);
  const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);
  const [statusModalVisible, setStatusModalVisible] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Fetch data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter sellers when tab or search changes
  useEffect(() => {
    if (sellers.length > 0) {
      filterSellers();
    }
  }, [sellers, activeTab, search]);

  // Count pending sellers
  useEffect(() => {
    const count = sellers.filter(seller => seller.status === 'PENDING').length;
    setPendingCount(count);
  }, [sellers]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchUsers(), fetchSellers()]);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    const response = await AdminAccountService.getAllUsers();
    if (response.success && response.data) {
      setUsers(response.data);
    } else {
      throw new Error(response.message);
    }
  };

  const fetchSellers = async () => {
    const response = await AdminAccountService.getAllSellers();
    
    // Check for both possible response structures
    if (response.success && response.data) {
      // Original structure with data property
      setSellers(response.data);
    } else if (response.sellers) {
      // Alternative structure with direct sellers property
      setSellers(response.sellers);
    } else {
      // Neither structure is present, throw error
      console.error('Invalid sellers response structure:', response);
      throw new Error('Unexpected seller data structure in response');
    }
  };

  const filterSellers = () => {
    let filtered = sellers;
    
    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(seller => seller.status === 'PENDING');
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        seller => 
          seller.user.name.toLowerCase().includes(searchLower) ||
          seller.user.email.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredSellers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleUpdateUserRole = async (userId: string, role: 'ADMIN' | 'SELLER' | 'CUSTOMER') => {
    try {
      const response = await AdminAccountService.updateUserRole(userId, role);
      if (response.data || response.updatedUser) {
        Alert.alert('Success', `User role updated to ${role}`);
        await fetchUsers();
        setRoleModalVisible(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to update user role');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleUpdateSellerStatus = async (sellerId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    try {
      const response = await AdminAccountService.updateSellerStatus(sellerId, status);
      if (response.updatedSeller) {
        Alert.alert('Success', `Seller status updated to ${status}`);
        await fetchSellers();
        setStatusModalVisible(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to update seller status');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update seller status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await AdminAccountService.deleteUser(userId);
              if (response.success) {
                Alert.alert('Success', 'User deleted successfully');
                await fetchUsers();
                setUserModalVisible(false);
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const handleDeleteSeller = async (sellerId: string) => {
    Alert.alert(
      'Delete Seller',
      'Are you sure you want to delete this seller? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await AdminAccountService.deleteSeller(sellerId);
              if (response.deletedSeller) {
                Alert.alert('Success', 'Seller deleted successfully');
                await fetchSellers();
                setSellerModalVisible(false);
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete seller');
            }
          }
        }
      ]
    );
  };

  // Render role badge with appropriate color
  const renderRoleBadge = (role: string) => {
    let color = '';
    switch (role) {
      case 'ADMIN':
        color = '#EF4444';
        break;
      case 'SELLER':
        color = '#3B82F6';
        break;
      case 'CUSTOMER':
        color = '#10B981';
        break;
      default:
        color = '#6B7280';
    }

    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{role}</Text>
      </View>
    );
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let color = '';
    switch (status) {
      case 'PENDING':
        color = '#F59E0B';
        break;
      case 'APPROVED':
        color = '#10B981';
        break;
      case 'REJECTED':
        color = '#EF4444';
        break;
      default:
        color = '#6B7280';
    }

    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  // Render user item in the list
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedUser(item);
        setUserModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.userImage} />
          ) : (
            <View style={[styles.userImage, styles.userImagePlaceholder]}>
              <Text style={styles.userImageInitial}>{item.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        {renderRoleBadge(item.role)}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>Joined: {format(new Date(item.createdAt), 'MMM d, yyyy')}</Text>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  // Render seller item in the list
  const renderSellerItem = ({ item }: { item: Seller }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedSeller(item);
        setSellerModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.userImage} />
          ) : (
            <View style={[styles.userImage, styles.userImagePlaceholder]}>
              <Text style={styles.userImageInitial}>{item.user.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.userEmail}>{item.user.email}</Text>
        </View>
        {renderStatusBadge(item.status || 'PENDING')}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Since: {format(new Date(item.createdAt), 'MMM d, yyyy')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  // Render user detail modal
  const renderUserModal = () => (
    <Modal
      visible={userModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setUserModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setUserModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          
          {selectedUser && (
            <View style={styles.modalContent}>
              <View style={styles.userProfileContainer}>
                {selectedUser.image ? (
                  <Image source={{ uri: selectedUser.image }} style={styles.userProfileImage} />
                ) : (
                  <View style={[styles.userProfileImage, styles.userImagePlaceholder]}>
                    <Text style={styles.userProfileInitial}>{selectedUser.name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.userProfileName}>{selectedUser.name}</Text>
                <Text style={styles.userProfileEmail}>{selectedUser.email}</Text>
                {renderRoleBadge(selectedUser.role)}
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID:</Text>
                <Text style={styles.detailValue}>{selectedUser.id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(selectedUser.createdAt), 'MMM d, yyyy')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(selectedUser.updatedAt), 'MMM d, yyyy')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>OAuth User:</Text>
                <Text style={styles.detailValue}>{selectedUser.isOAuth ? 'Yes' : 'No'}</Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => {
                    setUserModalVisible(false);
                    setRoleModalVisible(true);
                  }}
                >
                  <Ionicons name="shield-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Update Role</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={() => handleDeleteUser(selectedUser.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Delete User</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render seller detail modal
  const renderSellerModal = () => (
    <Modal
      visible={sellerModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSellerModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seller Details</Text>
            <TouchableOpacity onPress={() => setSellerModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          
          {selectedSeller && (
            <View style={styles.modalContent}>
              <View style={styles.userProfileContainer}>
                {selectedSeller.image ? (
                  <Image source={{ uri: selectedSeller.image }} style={styles.userProfileImage} />
                ) : (
                  <View style={[styles.userProfileImage, styles.userImagePlaceholder]}>
                    <Text style={styles.userProfileInitial}>{selectedSeller.user.name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.userProfileName}>{selectedSeller.user.name}</Text>
                <Text style={styles.userProfileEmail}>{selectedSeller.user.email}</Text>
                {renderStatusBadge(selectedSeller.status || 'PENDING')}
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Seller ID:</Text>
                <Text style={styles.detailValue}>{selectedSeller.id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>User ID:</Text>
                <Text style={styles.detailValue}>{selectedSeller.userId}</Text>
              </View>
              {selectedSeller.managerName && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Manager:</Text>
                  <Text style={styles.detailValue}>{selectedSeller.managerName}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(selectedSeller.createdAt), 'MMM d, yyyy')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(selectedSeller.updatedAt), 'MMM d, yyyy')}
                </Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => {
                    setSellerModalVisible(false);
                    setStatusModalVisible(true);
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Update Status</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={() => handleDeleteSeller(selectedSeller.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Delete Seller</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render role update modal
  const renderRoleModal = () => (
    <Modal
      visible={roleModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setRoleModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, styles.smallModal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update User Role</Text>
            <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          
          {selectedUser && (
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Select a new role for {selectedUser.name}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedUser.role === 'ADMIN' && styles.roleOptionSelected
                ]}
                onPress={() => handleUpdateUserRole(selectedUser.id, 'ADMIN')}
              >
                <Ionicons 
                  name={selectedUser.role === 'ADMIN' ? "shield" : "shield-outline"} 
                  size={24} 
                  color={selectedUser.role === 'ADMIN' ? "#4F46E5" : "#6B7280"} 
                />
                <Text style={[
                  styles.roleOptionText,
                  selectedUser.role === 'ADMIN' && styles.roleOptionTextSelected
                ]}>Admin</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedUser.role === 'SELLER' && styles.roleOptionSelected
                ]}
                onPress={() => handleUpdateUserRole(selectedUser.id, 'SELLER')}
              >
                <Ionicons 
                  name={selectedUser.role === 'SELLER' ? "storefront" : "storefront-outline"} 
                  size={24} 
                  color={selectedUser.role === 'SELLER' ? "#4F46E5" : "#6B7280"} 
                />
                <Text style={[
                  styles.roleOptionText,
                  selectedUser.role === 'SELLER' && styles.roleOptionTextSelected
                ]}>Seller</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedUser.role === 'CUSTOMER' && styles.roleOptionSelected
                ]}
                onPress={() => handleUpdateUserRole(selectedUser.id, 'CUSTOMER')}
              >
                <Ionicons 
                  name={selectedUser.role === 'CUSTOMER' ? "person" : "person-outline"} 
                  size={24} 
                  color={selectedUser.role === 'CUSTOMER' ? "#4F46E5" : "#6B7280"} 
                />
                <Text style={[
                  styles.roleOptionText,
                  selectedUser.role === 'CUSTOMER' && styles.roleOptionTextSelected
                ]}>Customer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render seller status update modal
  const renderStatusModal = () => (
    <Modal
      visible={statusModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setStatusModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, styles.smallModal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Seller Status</Text>
            <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          
          {selectedSeller && (
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Select a new status for {selectedSeller.user.name}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedSeller.status === 'PENDING' && styles.pendingOptionSelected
                ]}
                onPress={() => handleUpdateSellerStatus(selectedSeller.id, 'PENDING')}
              >
                <Ionicons 
                  name={selectedSeller.status === 'PENDING' ? "time" : "time-outline"} 
                  size={24} 
                  color={selectedSeller.status === 'PENDING' ? "#F59E0B" : "#6B7280"} 
                />
                <Text style={[
                  styles.statusOptionText,
                  selectedSeller.status === 'PENDING' && styles.pendingOptionTextSelected
                ]}>Pending</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedSeller.status === 'APPROVED' && styles.approvedOptionSelected
                ]}
                onPress={() => handleUpdateSellerStatus(selectedSeller.id, 'APPROVED')}
              >
                <Ionicons 
                  name={selectedSeller.status === 'APPROVED' ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={24} 
                  color={selectedSeller.status === 'APPROVED' ? "#10B981" : "#6B7280"} 
                />
                <Text style={[
                  styles.statusOptionText,
                  selectedSeller.status === 'APPROVED' && styles.approvedOptionTextSelected
                ]}>Approved</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedSeller.status === 'REJECTED' && styles.rejectedOptionSelected
                ]}
                onPress={() => handleUpdateSellerStatus(selectedSeller.id, 'REJECTED')}
              >
                <Ionicons 
                  name={selectedSeller.status === 'REJECTED' ? "close-circle" : "close-circle-outline"} 
                  size={24} 
                  color={selectedSeller.status === 'REJECTED' ? "#EF4444" : "#6B7280"} 
                />
                <Text style={[
                  styles.statusOptionText,
                  selectedSeller.status === 'REJECTED' && styles.rejectedOptionTextSelected
                ]}>Rejected</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading accounts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Accounts Management</Text>
          <Text style={styles.headerSubtitle}>Manage users and sellers</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sellers' && styles.activeTab]}
          onPress={() => setActiveTab('sellers')}
        >
          <Text style={[styles.tabText, activeTab === 'sellers' && styles.activeTabText]}>
            Sellers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <View style={styles.tabWithBadge}>
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Pending
            </Text>
            {pendingCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* List content */}
      {activeTab === 'users' ? (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={activeTab === 'pending' ? 
            sellers.filter(seller => seller.status === 'PENDING') : 
            sellers}
          renderItem={renderSellerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                {activeTab === 'pending' 
                  ? 'No pending sellers found' 
                  : 'No sellers found'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      {renderUserModal()}
      {renderSellerModal()}
      {renderRoleModal()}
      {renderStatusModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  countBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImageContainer: {
    marginRight: 12,
  },
  userImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImageInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4B5563',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  smallModal: {
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
  },
  modalContent: {
    padding: 16,
  },
  userProfileContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  userProfileInitial: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6B7280',
  },
  userProfileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userProfileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  roleOptionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 12,
  },
  roleOptionTextSelected: {
    color: '#4F46E5',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  pendingOptionSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  approvedOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  rejectedOptionSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 12,
  },
  pendingOptionTextSelected: {
    color: '#F59E0B',
  },
  approvedOptionTextSelected: {
    color: '#10B981',
  },
  rejectedOptionTextSelected: {
    color: '#EF4444',
  },
});

export default AccountsScreen;
