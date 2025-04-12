import { fetchAllProducts, Product } from "@/services/product";
import { SizeStock } from "@/services/product";
import { create } from "zustand";

interface ProductState {
  products: Product[] | null;
  recentProducts: Product[] | null;
  productsByCategory: Product[] | null;
  productsBySubCategory: Product[] | null;
  productsBySeller: Product[] | null;
  productId: string | null;
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  allSizeStock: SizeStock[] | null;
  setIsLoading: (loading: boolean) => void;
  getAllSizeStock: () => SizeStock[] | null;
  getSizeStockByProductIdAndSize: (productId: string, size: string) => SizeStock | null;
  fetchProducts: () => Promise<void>;
  fetchRecentProducts: () => Promise<void>;
  fetchProductsByCategory: (category: string) => Promise<void>;
  fetchProductsBySubCategory: (subCategory: string) => Promise<void>;
  fetchProductsBySeller: (sellerId: string) => Promise<void>;
  fetchProductById: (productId: string) => Promise<void>;
  clearError: () => void;
  getProductMainImage: (product: Product) => string;
  formatPrice: (price: number) => string;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: null,
  recentProducts: null,
  productsByCategory: null,
  productsBySubCategory: null,
  productsBySeller: null,
  productId: null,
  product: null,
  isLoading: false,
  error: null,
  allSizeStock: null,
  setIsLoading: (loading) => set({ isLoading: loading }),
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAllProducts();
      set({ products: data, isLoading: false });
      const allSizeStock = data.flatMap((product) => product.stockSize);
      set({ allSizeStock, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "An unknown error occurred", isLoading: false });
    }
  },
  getAllSizeStock: () => {
    const allSizeStock = get().allSizeStock;
    return allSizeStock ? allSizeStock : null;
  },
  getSizeStockByProductIdAndSize: (productId, size) => {
    const allSizeStock = get().allSizeStock;
    if (!allSizeStock) return null;
    const sizeStock = allSizeStock.find((stock) => stock.productId === productId && stock.size === size);
    return sizeStock ? sizeStock : null;
  },
  fetchRecentProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const recentProducts = (get().products?.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }) || null)?.slice(0,10); // Assuming the first 5 products are the most recent
      set({ recentProducts, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "An unknown error occurred", isLoading: false });
    }
  },
  fetchProductsByCategory: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const filteredProducts = get().products?.filter((product) => product.category === category) || [];
      set({ productsByCategory: filteredProducts, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "An unknown error occurred", isLoading: false });
    }
  },
  fetchProductsBySubCategory: async (subCategory) => {
    set({ isLoading: true, error: null });
    try {
      const filteredProducts = get().products?.filter((product) => product.subCategory === subCategory) || [];
      set({ productsBySubCategory: filteredProducts, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "An unknown error occurred", isLoading: false });
    }
  },
  fetchProductsBySeller: async (sellerId) => {
    set({ isLoading: true, error: null });
    try {
      const filteredProducts = get().products?.filter((product) => product.sellerId === sellerId) || [];
      set({ productsBySeller: filteredProducts, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "An unknown error occurred", isLoading: false });
    }
  },
  fetchProductById: async (productId) => {
    set({ isLoading: true, error: null });
    try {
      const product = get().products?.find((product) => product.id === productId) || null;
      set({ product, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "An unknown error occurred", isLoading: false });
    }
  },
  clearError: () => set({ error: null }),
  getProductMainImage: (product: Product): string => {
    return product.image && product.image.length > 0 
      ? product.image[0] 
      : 'https://via.placeholder.com/300x400';
  },
  formatPrice: (price: number): string => {
    return `$${price.toFixed(2)}`;
  }
}));
