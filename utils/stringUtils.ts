/**
 * Removes Vietnamese diacritics from text
 * 
 * Example: "Trần Nhật Duật" -> "Tran Nhat Duat"
 */
export const normalizeVietnameseText = (text: string): string => {
  if (!text) return '';
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, match => match === 'đ' ? 'd' : 'D');
};

/**
 * Parses a full address into its component parts
 * 
 * Example: "49, Tran Nhat Duat, Phuong Tan Dinh, Quan 1, Ho Chi Minh, Vietnam"
 * Result: { street: "49, Tran Nhat Duat", ward: "Phuong Tan Dinh", district: "Quan 1", province: "Ho Chi Minh, Vietnam" }
 */
export const parseAddress = (fullAddress: string): {
  street: string;
  ward: string;
  district: string;
  province: string;
} => {
  const parts = fullAddress.split(/,\s*/);
  
  // Default values
  let result = {
    street: parts[0] || '',
    ward: '',
    district: '',
    province: ''
  };

  if (parts.length >= 2) {
    // Try to identify ward, district, province from the address parts
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      
      if (part.toLowerCase().startsWith('phuong') || part.toLowerCase().startsWith('xa')) {
        result.ward = part;
      } else if (part.toLowerCase().startsWith('quan') || part.toLowerCase().startsWith('huyen') || part.toLowerCase().startsWith('tp.')) {
        result.district = part;
      } else if (i === 1 && !result.street) {
        result.street = `${result.street}, ${part}`.trim();
      } else if (i >= parts.length - 2) {
        // Last 1-2 parts likely to be province/country
        result.province = result.province 
          ? `${result.province}, ${part}` 
          : part;
      } else if (!result.ward) {
        result.ward = part;
      } else if (!result.district) {
        result.district = part;
      }
    }
  }
  
  // If no street number/name was identified, use first part
  if (!result.street && parts.length > 0) {
    result.street = parts[0];
  }
  
  // If only one or two parts, put everything in street
  if (parts.length <= 2) {
    result.street = fullAddress;
    result.ward = '';
    result.district = '';
    result.province = '';
  }
  
  return result;
};
