import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store/UserStore';
import { Address, formatFullAddress } from '../services/user';
import DeliveryInformation from './DeliveryInformation';

interface AddressSelectorProps {
  onAddressSelected: (address: Address) => void;
  onNewAddressCreated?: (address: Address) => void;
  initialAddress?: Address | null;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  onAddressSelected, 
  onNewAddressCreated,
  initialAddress 
}) => {
  const { 
    getUserAddresses, 
    addresses, 
    addUserAddress, 
    currentAddress,
    setCurrentAddress,
    isLoading 
  } = useUserStore();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(initialAddress || currentAddress);
  const [addingNewAddress, setAddingNewAddress] = useState(false);
  
  // New address form state
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    street: '',
    ward: '',
    district: '',
    province: '',
  });
  
  const [saveToAccount, setSaveToAccount] = useState(true);
  
  useEffect(() => {
    getUserAddresses();
  }, []);
  
  useEffect(() => {
    if (initialAddress) {
      setSelectedAddress(initialAddress);
    } else if (currentAddress && !selectedAddress) {
      setSelectedAddress(currentAddress);
    }
  }, [initialAddress, currentAddress]);
  
  const handleSelect = (address: Address) => {
    setSelectedAddress(address);
    setCurrentAddress(address); // Set as current address in store
    onAddressSelected(address);
    setShowModal(false);
  };
  
  const resetNewAddressForm = () => {
    setDeliveryInfo({
      name: '',
      email: '',
      phoneNumber: '',
      address: '',
      street: '',
      ward: '',
      district: '',
      province: '',
    });
    setSaveToAccount(true);
  };
  
  // When adding a new address or editing, properly utilize DeliveryInformation
  const handleDeliveryInfoChange = (name: string, value: string) => {
    setDeliveryInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddNewAddress = async () => {
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
    
    // Format full address string
    const fullAddress = formatFullAddress(
      deliveryInfo.street,
      deliveryInfo.ward,
      deliveryInfo.district,
      deliveryInfo.province
    );
    
    // Create new address object
    const newAddress: Address = {
      address: fullAddress,
      phoneNumber: deliveryInfo.phoneNumber,
      street: deliveryInfo.street,
      ward: deliveryInfo.ward,
      district: deliveryInfo.district,
      province: deliveryInfo.province
    };
    
    // If user wants to save to account
    if (saveToAccount) {
      const success = await addUserAddress(
        deliveryInfo.street.trim(),
        deliveryInfo.ward.trim(),
        deliveryInfo.district.trim(),
        deliveryInfo.province.trim(),
        deliveryInfo.phoneNumber.trim()
      );
      
      if (!success) {
        Alert.alert('Error', 'Failed to save address to your account');
        return;
      }
    }
    
    // Use this address for the current order
    setSelectedAddress(newAddress);
    onAddressSelected(newAddress);
    if (onNewAddressCreated) {
      onNewAddressCreated(newAddress);
    }
    
    // Reset and close forms
    resetNewAddressForm();
    setAddingNewAddress(false);
    setShowModal(false);
  };
  
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
  
  const renderItem = ({ item }: { item: Address }) => {
    const isSelected = selectedAddress && 
      selectedAddress.address === item.address && 
      selectedAddress.phoneNumber === item.phoneNumber;
      
    return (
      <TouchableOpacity 
        style={[
          styles.addressItem, 
          isSelected && styles.selectedAddressItem
        ]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.addressContent}>
          <Text style={styles.addressText}>{getFormattedAddress(item)}</Text>
          <Text style={styles.phoneText}>Phone: {item.phoneNumber}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
      >
        {selectedAddress ? (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedAddress} numberOfLines={2}>
              {getFormattedAddress(selectedAddress)}
            </Text>
            <Text style={styles.selectedPhone}>
              📞 {selectedAddress.phoneNumber}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select delivery address</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {addingNewAddress ? 'Add New Address' : 'Select Address'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setAddingNewAddress(false);
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {addingNewAddress ? (
              <View style={styles.newAddressForm}>
                <DeliveryInformation
                  deliveryInfo={deliveryInfo}
                  onDeliveryChange={handleDeliveryInfoChange}
                  showNameEmail={false}
                />
                
                <View style={styles.saveOption}>
                  <Text style={styles.saveText}>Save to my addresses</Text>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      saveToAccount && styles.checkboxChecked
                    ]}
                    onPress={() => setSaveToAccount(!saveToAccount)}
                  >
                    {saveToAccount && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setAddingNewAddress(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddNewAddress}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Add Address</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
                ) : (
                  <>
                    {addresses.length > 0 ? (
                      <FlatList
                        data={addresses}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => `address-${index}`}
                        contentContainerStyle={styles.addressList}
                      />
                    ) : (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No saved addresses found</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => setAddingNewAddress(true)}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#fff" />
                      <Text style={styles.addButtonText}>Add New Address</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedContainer: {
    flex: 1,
  },
  selectedAddress: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  selectedPhone: {
    fontSize: 14,
    color: '#666',
  },
  placeholderText: {
    color: '#999',
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addressList: {
    padding: 15,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedAddressItem: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f7ff',
  },
  addressContent: {
    flex: 1,
    paddingRight: 10,
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    margin: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  newAddressForm: {
    padding: 15,
  },
  saveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  saveText: {
    fontSize: 16,
    color: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  loader: {
    padding: 30,
  },
});

export default AddressSelector;
