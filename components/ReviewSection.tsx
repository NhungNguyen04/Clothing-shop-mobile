import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import { Star, ChevronDown, ChevronUp, Send, Edit, Trash2, X } from "react-native-feather";
import { useReviewStore } from "@/store/ReviewStore";
import { useAuthStore } from "@/store/AuthStore";
import * as ImagePicker from "expo-image-picker";
import { Review } from "@/services/review";
import axiosInstance from "@/services/axiosInstance";

interface ReviewSectionProps {
  productId: string;
  readOnly?: boolean; 
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  productId,
  readOnly = false,
}) => {
  const { reviews, isLoading, error, fetchByProduct, createReview, updateReview, deleteReview, sortReviewsByUser } =
    useReviewStore();
  const { user, isAuthenticated } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(true); // Start expanded by default
  const [submitting, setSubmitting] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch reviews on mount and when productId changes
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        console.log(`Fetching reviews for product ${productId}`);
        await fetchByProduct(productId);
        
        // Sort reviews to put current user's at the top
        if (user?.id) {
          sortReviewsByUser(user.id);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    };
    
    fetchReviews();
  }, [productId, fetchByProduct, user?.id]);
  
  // When user changes, re-sort reviews
  useEffect(() => {
    if (user?.id && reviews.length > 0) {
      sortReviewsByUser(user.id);
    }
  }, [user?.id, reviews.length]);

  // Debug log to track review data
  useEffect(() => {
    console.log(`Reviews loaded: ${reviews.length}`);
  }, [reviews]);

  // When editing a review, prefill the form with the review data
  useEffect(() => {
    if (editingReview) {
      setRating(editingReview.rating);
      setComment(editingReview.comment || "");
      setImages(editingReview.images || []);
    } else {
      // Reset form when not editing
      setRating(0);
      setComment("");
      setImages([]);
    }
  }, [editingReview]);

  const loadReviews = async () => {
    try {
      await fetchByProduct(productId);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Camera roll permissions are required to add images."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets.length > 0) {
      setUploadingImages(true);
      setUploadProgress(0);
      
      try {
        const uploadedUrls = await Promise.all(
          result.assets.map(async (asset, index) => {
            const uploadedUrl = await uploadImageToS3(asset.uri);
            
            // Update progress after each upload
            setUploadProgress(((index + 1) / result.assets.length) * 100);
            
            return uploadedUrl;
          })
        );
        
        // Add the new URLs to existing images
        setImages((prev) => [...prev, ...uploadedUrls.filter(url => url !== null)]);
      } catch (error) {
        console.error("Image upload failed:", error);
        Alert.alert("Upload Error", "Failed to upload one or more images. Please try again.");
      } finally {
        setUploadingImages(false);
      }
    }
  };

  const uploadImageToS3 = async (uri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      const fileExtension = uri.split('.').pop() || 'jpg';
      
      // @ts-ignore - TypeScript doesn't recognize append with this format
      formData.append('file', {
        uri,
        name: `review-image-${Date.now()}.${fileExtension}`,
        type: `image/${fileExtension}`
      });

      const uploadResponse = await axiosInstance.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', JSON.stringify(uploadResponse.data));
      
      // Check for successful response
      if (uploadResponse.data?.success === true) {
        // The API returns the URL directly in the data field
        const imageUrl = uploadResponse.data.data;
        
        if (typeof imageUrl === 'string') {
          return imageUrl;
        }
      }
      
      throw new Error('Upload failed or invalid response format');
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      return null;
    }
  };

  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setExpanded(true); // Ensure the review form is visible
  };
  
  const handleCancelEdit = () => {
    setEditingReview(null);
    setRating(0);
    setComment("");
    setImages([]);
  };
  
  const handleDelete = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteConfirmModalVisible(true);
  };
  
  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    
    try {
      await deleteReview(reviewToDelete);
      Alert.alert("Success", "Your review has been deleted.");
    } catch (error) {
      console.error("Failed to delete review:", error);
      Alert.alert("Error", "Failed to delete your review. Please try again later.");
    } finally {
      setDeleteConfirmModalVisible(false);
      setReviewToDelete(null);
    }
  };

  const submitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please login to submit a review.");
      return;
    }

    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a rating.");
      return;
    }

    if (comment.trim().length < 3) {
      Alert.alert(
        "Review Required",
        "Please enter a review with at least 3 characters."
      );
      return;
    }

    // Validate that all images have been uploaded properly
    const validImages = images.filter(img => img.startsWith('http'));
    if (images.length !== validImages.length) {
      Alert.alert(
        "Upload in Progress",
        "Please wait for all images to finish uploading"
      );
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingReview) {
        // Update existing review with the S3 image URLs
        await updateReview(editingReview.id, {
          rating,
          comment,
          images: validImages,
        });
        
        Alert.alert("Success", "Your review has been updated!");
        setEditingReview(null);
      } else {
        // Create new review with the S3 image URLs
        await createReview({
          productId,
          userId: user!.id,
          rating,
          comment,
          images: validImages,
        });
        
        Alert.alert("Success", "Your review has been submitted!");
      }
      
      // Reset form
      setRating(0);
      setComment("");
      setImages([]);
      setExpanded(true);
      
      // Refresh reviews and sort
      await fetchByProduct(productId);
      if (user?.id) {
        sortReviewsByUser(user.id);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      Alert.alert(
        "Error",
        "Failed to submit your review. Please try again later."
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render stars for review input
  const renderInputStars = () => {
    return Array(5)
      .fill(0)
      .map((_, idx) => (
        <TouchableOpacity
          key={idx}
          onPress={() => setRating(idx + 1)}
          disabled={readOnly}
        >
          <Star
            fill={idx < rating ? "#ec4899" : "none"}
            strokeWidth={1}
            color="#ec4899"
            width={24}
            height={24}
          />
        </TouchableOpacity>
      ));
  };

  // Render stars for a specific rating
  const renderRatingStars = (ratingValue: number) => {
    return Array(5)
      .fill(0)
      .map((_, idx) => (
        <Star
          key={idx}
          fill={idx < ratingValue ? "#ec4899" : "none"}
          strokeWidth={1}
          color="#ec4899"
          width={20}
          height={20}
        />
      ));
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isUserReview = (review: Review) => {
    return user?.id === review.userId;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headerContainer}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Customer Reviews</Text>
          <View style={styles.reviewCountContainer}>
            <Text style={styles.reviewCount}>{reviews?.length || 0}</Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp width={20} height={20} color="#333" />
        ) : (
          <ChevronDown width={20} height={20} color="#333" />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {/* Review Form - only show if not in readOnly mode */}
          {!readOnly && isAuthenticated && (
            <View style={styles.reviewForm}>
              <Text style={styles.formLabel}>
                {editingReview ? "Edit Your Review" : "Write a Review"}
              </Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingLabel}>Rating:</Text>
                <View style={styles.stars}>{renderInputStars()}</View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Share your thoughts on this product..."
                multiline
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />
              
              {/* Image Upload Section */}
              <View style={styles.imageUploadSection}>
                <TouchableOpacity 
                  style={[
                    styles.uploadButton,
                    uploadingImages && styles.disabledButton
                  ]} 
                  onPress={pickImages}
                  disabled={uploadingImages}
                >
                  {uploadingImages ? (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color="#666" />
                      <Text style={styles.uploadingText}>
                        Uploading... {Math.round(uploadProgress)}%
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.uploadButtonText}>Add Photos</Text>
                  )}
                </TouchableOpacity>
                
                {images.length > 0 && (
                  <ScrollView 
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imagesContainer}
                  >
                    {images.map((uri, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri }} style={styles.uploadedImage} />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <X width={12} height={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
              
              <View style={styles.formActions}>
                {editingReview && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (submitting || !rating || comment.trim().length < 3) &&
                      styles.disabledButton,
                  ]}
                  onPress={submitReview}
                  disabled={submitting || !rating || comment.trim().length < 3}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Send width={16} height={16} color="#fff" />
                      <Text style={styles.submitButtonText}>
                        {editingReview ? "Update Review" : "Submit Review"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Review List */}
          {isLoading ? (
            <ActivityIndicator
              color="#ec4899"
              size="large"
              style={styles.loader}
            />
          ) : reviews && reviews.length > 0 ? (
            <FlatList
              data={reviews}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[
                  styles.reviewItem,
                  isUserReview(item) && styles.userReviewItem
                ]}>
                  {isUserReview(item) && (
                    <View style={styles.yourReviewBadge}>
                      <Text style={styles.yourReviewText}>Your Review</Text>
                    </View>
                  )}
                  
                  <View style={styles.reviewHeader}>
                    <View style={styles.userInfo}>
                      <Image
                        source={
                          item.user?.image
                            ? { uri: item.user.image }
                            : {
                                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  item.user?.name || "Anonymous"
                                )}&background=ec4899&color=fff&size=64`,
                              }
                        }
                        style={styles.userAvatar}
                      />
                      <Text style={styles.userName}>
                        {item.user?.name || "Anonymous"}
                      </Text>
                    </View>
                    
                    <View style={styles.reviewHeaderRight}>
                      {isUserReview(item) && !readOnly && (
                        <View style={styles.reviewActions}>
                          <TouchableOpacity 
                            style={styles.reviewActionButton}
                            onPress={() => handleEdit(item)}
                          >
                            <Edit width={16} height={16} color="#0066cc" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.reviewActionButton}
                            onPress={() => handleDelete(item.id)}
                          >
                            <Trash2 width={16} height={16} color="#F44336" />
                          </TouchableOpacity>
                        </View>
                      )}
                      <Text style={styles.reviewDate}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.stars}>
                    {renderRatingStars(item.rating)}
                  </View>
                  
                  <Text style={styles.reviewText}>{item.comment}</Text>
                  
                  {/* Display review images if available */}
                  {item.images && item.images.length > 0 && (
                    <ScrollView 
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.reviewImagesContainer}
                    >
                      {item.images.map((image, index) => (
                        <TouchableOpacity 
                          key={index} 
                          onPress={() => setFullScreenImage(image)}
                        >
                          <Image 
                            source={{ uri: image }} 
                            style={styles.reviewImage} 
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
              style={styles.reviewList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No reviews yet. Be the first to review!
                </Text>
              }
              // Don't limit the height, allow scrolling within the main scroll view
              scrollEnabled={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
            />
          ) : error ? (
            <Text style={styles.errorText}>Failed to load reviews. {error}</Text>
          ) : (
            <Text style={styles.emptyText}>No reviews yet.</Text>
          )}
        </View>
      )}

      {/* Full-screen image modal */}
      <Modal
        visible={fullScreenImage !== null}
        transparent={true}
        onRequestClose={() => setFullScreenImage(null)}
        animationType="fade"
      >
        <View style={styles.fullScreenModal}>
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setFullScreenImage(null)}
          >
            <X width={24} height={24} color="#fff" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      
      {/* Delete confirmation modal */}
      <Modal
        visible={deleteConfirmModalVisible}
        transparent={true}
        onRequestClose={() => setDeleteConfirmModalVisible(false)}
        animationType="fade"
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContainer}>
            <Text style={styles.confirmModalTitle}>Delete Review</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to delete this review? This action cannot be undone.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={styles.confirmModalCancelButton}
                onPress={() => setDeleteConfirmModalVisible(false)}
              >
                <Text style={styles.confirmModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmModalDeleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmModalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  reviewCountContainer: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  content: {
    marginTop: 10,
  },
  reviewForm: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingLabel: {
    marginRight: 10,
    fontSize: 14,
  },
  stars: {
    flexDirection: "row",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  
  // New styles for image upload and display
  imageUploadSection: {
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "#4b5563",
    fontWeight: "600",
  },
  imagesContainer: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#F44336",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewImagesContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 10,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  closeModalButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  submitButton: {
    backgroundColor: "#ec4899",
    borderRadius: 6,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#f472b6",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  reviewList: {
    // Remove maxHeight to show all reviews
  },
  reviewItem: {
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  userName: {
    fontWeight: "600",
    fontSize: 14,
  },
  reviewDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    textAlign: "center",
    color: "#ef4444",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  
  // New styles for user reviews and actions
  userReviewItem: {
    backgroundColor: '#fdf2f8', // Light pink background for user's reviews
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  reviewHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  reviewActions: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  reviewActionButton: {
    marginLeft: 12,
    padding: 4,
  },
  yourReviewBadge: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  yourReviewText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confirmModalText: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  confirmModalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  confirmModalCancelText: {
    color: '#374151',
    fontWeight: '500',
  },
  confirmModalDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmModalDeleteText: {
    color: 'white',
    fontWeight: '500',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    marginLeft: 8,
    color: '#666',
  },
});
