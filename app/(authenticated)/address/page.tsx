import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useUserStore } from '../../../store/UserStore';
import { useAuthStore } from '../../../store/AuthStore';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Address, formatFullAddress } from '../../../services/user';
import { parseAddress } from '../../../utils/stringUtils';
import DeliveryInformation from '../../../components/DeliveryInformation';

export default function AddressScreen() {
  const { getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress, setCurrentAddress, isLoading, error } = useUserStore();
  const { user } = useAuthStore();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  // Use the same delivery info structure as in checkout and address selector
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: '',
    street: '',
    ward: '',
    district: '',
    province: '',
  });
  
  useEffect(() => {
    loadUserAddresses();
  }, []);
  
  // Load the user's saved addresses
  const loadUserAddresses = async () => {
    const userAddresses = await getUserAddresses();
    setAddresses(userAddresses);
    
    // Pre-fill user information if available
    setDeliveryInfo(prev => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || ''
    }));
  };
  
  // Reset form fields
  const resetForm = () => {
    setDeliveryInfo({
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      address: '',
      street: '',
      ward: '',
      district: '',
      province: '',
    });
    setEditIndex(null);
  };
  
  // Set form for editing an address
  const handleEdit = (index: number) => {
    const addressToEdit = addresses[index];
    
    // If we have structured fields, use them
    if (addressToEdit.street && addressToEdit.district) {
      setDeliveryInfo(prev => ({
        ...prev,
        street: addressToEdit.street || '',
        ward: addressToEdit.ward || '',
        district: addressToEdit.district || '',
        province: addressToEdit.province || '',
        phoneNumber: addressToEdit.phoneNumber,
      }));
    } else {
      // Otherwise, try to parse from the full address
      const parsedAddress = parseAddress(addressToEdit.address);
      setDeliveryInfo(prev => ({
        ...prev,
        street: parsedAddress.street,
        ward: parsedAddress.ward,
        district: parsedAddress.district,
        province: parsedAddress.province,
        phoneNumber: addressToEdit.phoneNumber,
      }));
    }
    
    setEditIndex(index);
  };
  
  const handleDeliveryInfoChange = (name: string, value: string) => {
    setDeliveryInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Delete an address
  const handleDelete = (index: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { 
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteUserAddress(index);
            if (success) {
              const updatedAddresses = await getUserAddresses();
              setAddresses(updatedAddresses);
              Alert.alert('Success', 'Address deleted successfully');
            }
          }
        }
      ]
    );
  };
  
  // Set as default address
  const handleSetDefault = (address: Address) => {
    setCurrentAddress(address);
    Alert.alert('Success', 'Default address updated');
  };
  
  // Save or update an address
  const handleSaveAddress = async () => {
    if (!deliveryInfo.street.trim()) {
      Alert.alert('Error', 'Please enter a street address');
      return;
    }
    
    if (!deliveryInfo.district.trim()) {
      Alert.alert('Error', 'Please enter a district/city');
      return;
    }
    
    if (!deliveryInfo.province.trim()) {
      Alert.alert('Error', 'Please enter a province/state');
      return;
    }
    
    if (!deliveryInfo.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    
    let success = false;
    
    if (editIndex !== null) {
      // Update existing address
      success = await updateUserAddress(
        editIndex,
        deliveryInfo.street.trim(),
        deliveryInfo.ward.trim(),
        deliveryInfo.district.trim(),
        deliveryInfo.province.trim(),
        deliveryInfo.phoneNumber.trim()
      );
    } else {
      // Add new address
      success = await addUserAddress(
        deliveryInfo.street.trim(),
        deliveryInfo.ward.trim(),
        deliveryInfo.district.trim(),
        deliveryInfo.province.trim(),
        deliveryInfo.phoneNumber.trim()
      );
    }
    
    if (success) {
      Alert.alert(
        'Success', 
        `Address ${editIndex !== null ? 'updated' : 'added'} successfully`,
        [{ text: 'OK' }]
      );
      resetForm();
      const updatedAddresses = await getUserAddresses();
      setAddresses(updatedAddresses);
    } else {
      Alert.alert(
        'Error',
        error || `Failed to ${editIndex !== null ? 'update' : 'add'} address. Please try again later.`,
        [{ text: 'OK' }]
      );
    }
  };
  
  // Display formatted address
  const getFormattedAddress = (address: Address) => {
    if (address.street && address.district && address.province) {
      return formatFullAddress(
        address.street,
        address.ward,
        address.district,
        address.province
      );
    }
    return address.address;
  };
  
  // Render an address item
  const renderAddressItem = ({ item, index }: { item: Address, index: number }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressContent}>
        <Text style={styles.addressText}>{getFormattedAddress(item)}</Text>
        <Text style={styles.phoneText}>Phone: {item.phoneNumber}</Text>
      </View>
      
      <View style={styles.addressActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleEdit(index)}
        >
          <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleDelete(index)}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleSetDefault(item)}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
          <Text style={[styles.actionText, { color: '#10b981' }]}>Set Default</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow"
        >
          <Ionicons name="arrow-back" size={24} color="#2e64e5" />
        </TouchableOpacity>
      <Stack.Screen 
        options={{
          title: 'Manage Addresses',
          headerBackTitle: 'Back',
          headerTitleStyle: styles.headerTitle,
        }}
      />
      {addresses.length > 0 && (
        <View style={styles.addressesContainer}>
          <Text style={styles.addressesTitle}>Your Addresses</Text>
          {addresses.map((item, index) => renderAddressItem({ item, index }))}
        </View>
      )}
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {editIndex !== null ? 'Edit Address' : 'Add a New Address'}
        </Text>
        
        <DeliveryInformation
          deliveryInfo={deliveryInfo}
          onDeliveryChange={handleDeliveryInfoChange}
          showNameEmail={false}
        />
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <View style={styles.buttonRow}>
          {editIndex !== null && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={resetForm}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.saveButton, editIndex !== null ? { flex: 1 } : {}]}
            onPress={handleSaveAddress}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={editIndex !== null ? "save-outline" : "add-circle-outline"} size={20} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {editIndex !== null ? 'Update Address' : 'Save Address'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginRight: 10,
    flex: 1,
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
  },
  addressesContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  addressesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressContent: {
    marginBottom: 10,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  postalText: {
    fontSize: 14,
    color: '#666',
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    paddingTop: 10,
    marginTop: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#3b82f6',
  },
});
