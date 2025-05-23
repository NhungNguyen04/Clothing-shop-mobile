import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

interface DeliveryInfoProps {
  deliveryInfo: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  onDeliveryChange: (name: string, value: string) => void;
  showNameEmail?: boolean;
}

interface Province {
  code: number;
  name: string;
  districts: District[];
}

interface District {
  code: number;
  name: string;
  wards: Ward[];
}

interface Ward {
  code: number;
  name: string;
}

const DeliveryInformation = ({ 
  deliveryInfo, 
  onDeliveryChange, 
  showNameEmail = true 
}: DeliveryInfoProps) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [tempData, setTempData] = useState({ 
    street: deliveryInfo.street || "", 
    ward: deliveryInfo.ward || "", 
    district: deliveryInfo.district || "", 
    province: deliveryInfo.province || "" 
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Load province data
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get("https://provinces.open-api.vn/api/?depth=3");
        setProvinces(response.data);
        
        // If we already have province data, try to match and select it
        if (deliveryInfo.province) {
          const matchedProvince = response.data.find(
            (p: Province) => p.name.toLowerCase() === deliveryInfo.province?.toLowerCase()
          );
          
          if (matchedProvince) {
            setSelectedProvince(matchedProvince.code.toString());
            setDistricts(matchedProvince.districts);
            
            // If we also have district data, try to match and select it
            if (deliveryInfo.district) {
              const matchedDistrict = matchedProvince.districts.find(
                (d: District) => d.name.toLowerCase() === deliveryInfo.district?.toLowerCase()
              );
              
              if (matchedDistrict) {
                setSelectedDistrict(matchedDistrict.code.toString());
                setWards(matchedDistrict.wards);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProvinces();
  }, []);

  // Update the full address string whenever components change
  useEffect(() => {
    // Make sure we update the parent component with direct field values
    if (tempData.province) onDeliveryChange("province", tempData.province);
    if (tempData.district) onDeliveryChange("district", tempData.district);
    if (tempData.ward) onDeliveryChange("ward", tempData.ward);
    if (tempData.street) onDeliveryChange("street", tempData.street);
    
    updateAddress(tempData);
  }, [tempData]);

  const updateAddress = (newData: typeof tempData) => {
    const { street, ward, district, province } = newData;
    if (street && ward && district && province) {
      const fullAddress = [street, ward, district, province].filter(Boolean).join(", ");
      onDeliveryChange("address", fullAddress);
    }
  };

  const handleProvinceChange = (provinceCode: string) => {
    setSelectedProvince(provinceCode);
    setSelectedDistrict("");
    setWards([]);
    
    const province = provinces.find((p) => p.code === Number(provinceCode));
    setDistricts(province ? province.districts : []);

    const newData = { ...tempData, province: province?.name || "", district: "", ward: "" };
    setTempData(newData);
  };

  const handleDistrictChange = (districtCode: string) => {
    setSelectedDistrict(districtCode);

    const district = districts.find((d) => d.code === Number(districtCode));
    setWards(district ? district.wards : []);

    const newData = { ...tempData, district: district?.name || "", ward: "" };
    setTempData(newData);
  };

  const handleWardChange = (wardCode: string) => {
    const ward = wards.find((w) => w.code === Number(wardCode))?.name || "";
    const newData = { ...tempData, ward };
    setTempData(newData);
  };

  const handleInputChange = (name: string, value: string) => {
    onDeliveryChange(name, value);
    
    if (name === "street") {
      const newData = { ...tempData, street: value };
      setTempData(newData);
    }
  };

  if (loading) {
    return (
      <View className="p-5 items-center">
        <ActivityIndicator size="large" color="#2e64e5" />
        <Text className="mt-2 text-lg">Loading address data...</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg p-4 mb-4">
      <Text className="text-lg font-bold mb-4 pb-2 border-b border-gray-300">Your Information</Text>
      
      <View className="space-y-2">
        {/* Full Name */}
        {showNameEmail && (
          <>
            <Text className="text-base mb-1">Full Name</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-3 font-outfit text-base mb-3"
              value={deliveryInfo.name || ""}
              onChangeText={(value) => handleInputChange("name", value)}
              placeholder="Full Name"
            />

            {/* Email */}
            <Text className="text-base mb-1 font-outfit">Email</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-3 text-base mb-3 font-outfit"
              value={deliveryInfo.email || ""}
              onChangeText={(value) => handleInputChange("email", value)}
              placeholder="Email"
              keyboardType="email-address"
            />
          </>
        )}

        {/* Phone Number */}
        <Text className="text-base mb-1 font-outfit">Phone Number</Text>
        <TextInput
          className="border border-gray-300 rounded-md p-3 text-base mb-3 font-outfit"
          value={deliveryInfo.phoneNumber || ""}
          onChangeText={(value) => handleInputChange("phoneNumber", value)}
          placeholder="Phone Number"
          keyboardType="phone-pad"
        />

        {/* Province Select */}
        <Text className="text-base mb-1 font-outfit">Province</Text>
        <View className="border border-gray-300 rounded-md mb-3">
          <Picker
            selectedValue={selectedProvince}
            onValueChange={handleProvinceChange}
            className="h-12"
          >
            <Picker.Item label="Select Province" value="" />
            {provinces.map((province) => (
              <Picker.Item 
                key={province.code.toString()} 
                label={province.name} 
                value={province.code.toString()} 
              />
            ))}
          </Picker>
        </View>

        {/* Display selected province text for debugging */}
        {tempData.province ? (
          <Text className="text-xs text-green-600 mb-2">
            Selected: {tempData.province}
          </Text>
        ) : null}

        {/* District Select */}
        <Text className="text-base mb-1 font-outfit">District</Text>
        <View className="border border-gray-300 rounded-md mb-3">
          <Picker
            selectedValue={selectedDistrict}
            onValueChange={handleDistrictChange}
            className="h-12"
            enabled={selectedProvince !== ""}
          >
            <Picker.Item label="Select District" value="" />
            {districts.map((district) => (
              <Picker.Item 
                key={district.code.toString()} 
                label={district.name} 
                value={district.code.toString()} 
              />
            ))}
          </Picker>
        </View>
        
        {/* Display selected district text for debugging */}
        {tempData.district ? (
          <Text className="text-xs text-green-600 mb-2">
            Selected: {tempData.district}
          </Text>
        ) : null}

        {/* Ward Select */}
        <Text className="text-base mb-1 font-outfit">Ward</Text>
        <View className="border border-gray-300 rounded-md mb-3">
          <Picker
            selectedValue={wards.find(w => w.name === tempData.ward)?.code.toString() || ""}
            onValueChange={handleWardChange}
            className="h-12 font-outfit"
            enabled={selectedDistrict !== ""}
          >
            <Picker.Item label="Select Ward" value="" />
            {wards.map((ward) => (
              <Picker.Item 
                key={ward.code.toString()} 
                label={ward.name} 
                value={ward.code.toString()} 
              />
            ))}
          </Picker>
        </View>

        {/* Street Address */}
        <Text className="text-base mb-1 font-outfit">Street</Text>
        <TextInput
          className="border border-gray-300 rounded-md p-3 text-base font-outfit"
          value={tempData.street}
          onChangeText={(value) => handleInputChange("street", value)}
          placeholder="Street"
        />
      </View>
    </View>
  );
};

export default DeliveryInformation;
