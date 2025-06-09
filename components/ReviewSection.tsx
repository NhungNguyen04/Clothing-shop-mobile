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
  Platform,
  ToastAndroid,
  Image,
} from "react-native";
import { Star } from "react-native-feather";
import { useReviewStore } from "@/store/ReviewStore";
import { useAuthStore } from "@/store/AuthStore";
import * as ImagePicker from "expo-image-picker";

interface ReviewSectionProps {
  productId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ productId }) => {
  const { reviews, isLoading, error, fetchByProduct, createReview } =
    useReviewStore();
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    fetchByProduct(productId);
  }, [productId]);

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
    if (!result.canceled) {
      // For multiple selection, result.selected; for single, result.uri
      const uris = result.assets.map(
        (asset: ImagePicker.ImagePickerAsset) => asset.uri
      );
      setImages((prev) => [...prev, ...uris]);
    }
  };

  const submitReview = async () => {
    if (!user) {
      Alert.alert("Please login to submit a review");
      return;
    }
    if (rating === 0) {
      Alert.alert("Please select a rating");
      return;
    }
    await createReview({ userId: user.id, productId, rating, comment, images });
    setRating(0);
    setComment("");
    setShowForm(false);
    if (Platform.OS === "android")
      ToastAndroid.show("Review submitted", ToastAndroid.SHORT);
  };

  const renderStar = (index: number) => (
    <TouchableOpacity key={index} onPress={() => setRating(index + 1)}>
      <Star
        fill={index < rating ? "#ec4899" : "none"}
        strokeWidth={1}
        color="#ec4899"
        width={24}
        height={24}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Reviews</Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View>
          {reviews?.length === 0 ? (
            <Text>No reviews yet</Text>
          ) : (
            reviews.map((item) => (
              <View key={item.id} style={styles.reviewItem}>
                <View style={styles.starRow}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      fill={i < item.rating ? "#ec4899" : "none"}
                      strokeWidth={1}
                      color="#ec4899"
                      width={16}
                      height={16}
                    />
                  ))}
                </View>
                {item.images?.length > 0 && (
                  <FlatList
                    data={item.images}
                    horizontal
                    keyExtractor={(_, idx) => `${item.id}-img-${idx}`}
                    renderItem={({ item }) => (
                      <Image source={{ uri: item }} style={styles.reviewImg} />
                    )}
                    style={styles.reviewImgList}
                  />
                )}
                {item.comment ? (
                  <Text style={styles.comment}>{item.comment}</Text>
                ) : null}
                <Text style={styles.date}>
                  {new Date(item.reviewDate).toLocaleDateString()}
                </Text>
                <Text style={styles.date}>{item.user?.name}</Text>
              </View>
            ))
          )}
        </View>
      )}
      <View style={styles.separator} />
      {!showForm ? (
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Leave a Review</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <View style={styles.starRow}>
            {[...Array(5)].map((_, i) => renderStar(i))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Write your comment..."
            multiline
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImages}>
            <Text style={styles.addPhotoText}>
              + Add Photos ({images.length})
            </Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <FlatList
              data={images}
              horizontal
              keyExtractor={(_, idx) => `new-img-${idx}`}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.previewImg} />
              )}
              style={styles.previewImgList}
            />
          )}
          <TouchableOpacity style={styles.button} onPress={submitReview}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  subHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  starRow: { flexDirection: "row", marginVertical: 8 },
  reviewItem: { marginBottom: 12 },
  comment: { marginTop: 4, fontSize: 14, color: "#333" },
  date: { fontSize: 12, color: "#666" },
  separator: { height: 1, backgroundColor: "#eee", marginVertical: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    minHeight: 60,
  },
  button: {
    backgroundColor: "#ec4899",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "red" },
  cancelText: {
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  addPhotoBtn: {
    marginTop: 8,
    marginBottom: 12,
  },
  addPhotoText: {
    color: "#007bff",
  },
  previewImgList: { marginBottom: 12 },
  previewImg: { width: 60, height: 60, borderRadius: 4, marginRight: 8 },
  reviewImgList: { marginVertical: 4 },
  reviewImg: { width: 60, height: 60, borderRadius: 4, marginRight: 8 },
});
