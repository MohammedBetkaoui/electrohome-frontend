import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const THEME_STORAGE_KEY = "electrohome-theme";

function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return true;

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark") return true;
  if (storedTheme === "light") return false;

  // Par défaut, toujours sombre
  return true;
}

// Images
export const IMAGES = {
  fridge: "https://images.unsplash.com/photo-1758488438758-5e2eedf769ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZWZyaWdlcmF0b3IlMjBraXRjaGVuJTIwYXBwbGlhbmNlfGVufDF8fHx8MTc3NDU1NTg4M3ww&ixlib=rb-4.1.0&q=80&w=1080",
  washer: "https://images.unsplash.com/photo-1754732693535-7ffb5e1a51d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXNoaW5nJTIwbWFjaGluZSUyMGxhdW5kcnklMjBhcHBsaWFuY2V8ZW58MXx8fHwxNzc0NTU1ODgzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  oven: "https://images.unsplash.com/photo-1772567733108-38d940269d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvdmVuJTIwa2l0Y2hlbnxlbnwxfHx8fDE3NzQ1NTU4ODR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  ac: "https://images.unsplash.com/photo-1757219525975-03b5984bc6e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXIlMjBjb25kaXRpb25lciUyMHVuaXR8ZW58MXx8fHwxNzc0NTU1ODg0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  dishwasher: "https://images.unsplash.com/photo-1758631130778-42d518bf13aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXNod2FzaGVyJTIwa2l0Y2hlbiUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3NzQ1NTU4ODR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  vacuum: "https://images.unsplash.com/photo-1647940990395-967898eb0d65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YWN1dW0lMjBjbGVhbmVyJTIwbW9kZXJufGVufDF8fHx8MTc3NDU1NTg4NXww&ixlib=rb-4.1.0&q=80&w=1080",
  kitchen: "https://images.unsplash.com/photo-1643034738686-d69e7bc047e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwaW50ZXJpb3IlMjBwcmVtaXVtfGVufDF8fHx8MTc3NDU1NTg4NXww&ixlib=rb-4.1.0&q=80&w=1080",
  coffee: "https://images.unsplash.com/photo-1741113937337-1d0273bf941d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBtYWNoaW5lJTIwZXNwcmVzc298ZW58MXx8fHwxNzc0NTU1ODg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  tv: "https://images.unsplash.com/photo-1692188071339-2825a8a997f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMHRlbGV2aXNpb24lMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc3NDUzMjcyMXww&ixlib=rb-4.1.0&q=80&w=1080",
  store: "https://images.unsplash.com/photo-1740803292814-13d2e35924c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob21lJTIwYXBwbGlhbmNlJTIwc3RvcmV8ZW58MXx8fHwxNzc0NTU1ODg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  blog1: "https://images.unsplash.com/photo-1560714443-e8f662127abe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwYXBwbGlhbmNlJTIwYmxvZyUyMGd1aWRlfGVufDF8fHx8MTc3NDU1NTg5MHww&ixlib=rb-4.1.0&q=80&w=1080",
  blog2: "https://images.unsplash.com/photo-1522319532979-f1c35f2f1ae8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcmVub3ZhdGlvbiUyMHRpcHN8ZW58MXx8fHwxNzc0NTU1ODkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  blog3: "https://images.unsplash.com/photo-1738512504144-7729827271f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmVyZ3klMjBlZmZpY2llbnQlMjBob21lJTIwZ3JlZW58ZW58MXx8fHwxNzc0NTU1ODkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
};

export interface Product {
  id: string;
  slug?: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  badge?: "Nouveau" | "Promo" | "Bestseller";
  category: string;
  specs: string;
  energy: string;
  description?: string;
}

export const CATEGORIES = [
  { name: "Réfrigérateurs", slug: "refrigerateurs", image: IMAGES.fridge, count: 156 },
  { name: "Machines à laver", slug: "machines-a-laver", image: IMAGES.washer, count: 98 },
  { name: "Fours", slug: "fours", image: IMAGES.oven, count: 74 },
  { name: "Climatiseurs", slug: "climatiseurs", image: IMAGES.ac, count: 45 },
  { name: "Lave-vaisselle", slug: "lave-vaisselle", image: IMAGES.dishwasher, count: 62 },
  { name: "Aspirateurs", slug: "aspirateurs", image: IMAGES.vacuum, count: 89 },
  { name: "Petit électroménager", slug: "petit-electromenager", image: IMAGES.coffee, count: 213 },
  { name: "TV & Son", slug: "tv-son", image: IMAGES.tv, count: 127 },
];

export const PRODUCTS: Product[] = [
  { id: "1", name: "Réfrigérateur Multi-Portes RF23", brand: "Samsung", price: 189000, oldPrice: 232000, image: IMAGES.fridge, rating: 4.7, reviewCount: 234, badge: "Promo", category: "refrigerateurs", specs: "634L, No Frost, A+++", energy: "A+++" },
  { id: "2", name: "Lave-linge EcoSilence 9kg", brand: "Bosch", price: 109000, image: IMAGES.washer, rating: 4.5, reviewCount: 189, badge: "Bestseller", category: "machines-a-laver", specs: "9kg, 1400tr/min, A+++", energy: "A+++" },
  { id: "3", name: "Four Multifonction Pyrolyse", brand: "Siemens", price: 130000, oldPrice: 160000, image: IMAGES.oven, rating: 4.8, reviewCount: 312, badge: "Promo", category: "fours", specs: "71L, Pyrolyse, A+", energy: "A+" },
  { id: "4", name: "Climatiseur Mural Inverter", brand: "LG", price: 94000, image: IMAGES.ac, rating: 4.3, reviewCount: 87, badge: "Nouveau", category: "climatiseurs", specs: "12000 BTU, R32, Wi-Fi", energy: "A++" },
  { id: "5", name: "Lave-vaisselle Silence Plus", brand: "Miele", price: 174000, image: IMAGES.dishwasher, rating: 4.9, reviewCount: 156, badge: "Bestseller", category: "lave-vaisselle", specs: "14 couverts, 44dB, A+++", energy: "A+++" },
  { id: "6", name: "Aspirateur Robot S7 MaxV", brand: "Roborock", price: 80000, oldPrice: 101000, image: IMAGES.vacuum, rating: 4.6, reviewCount: 423, badge: "Promo", category: "aspirateurs", specs: "5100Pa, LiDAR, Auto-vidage", energy: "A" },
  { id: "7", name: "Machine à Expresso Automatique", brand: "De'Longhi", price: 69000, image: IMAGES.coffee, rating: 4.4, reviewCount: 267, category: "petit-electromenager", specs: "15 bars, Broyeur intégré", energy: "A+" },
  { id: "8", name: "TV OLED 55\" C3", brand: "LG", price: 203000, oldPrice: 261000, image: IMAGES.tv, rating: 4.8, reviewCount: 541, badge: "Promo", category: "tv-son", specs: "4K, 120Hz, Dolby Vision", energy: "G" },
];

export const BRANDS = ["Samsung", "LG", "Bosch", "Whirlpool", "Miele", "Siemens", "De'Longhi", "Roborock"];

export interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  checkoutPromoCode: string;
  setCheckoutPromoCode: (promoCode: string) => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const StoreContext = createContext<StoreContextType>(null!);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutPromoCode, setCheckoutPromoCode] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((i) => i.product.id !== productId));
  const updateQuantity = (productId: string, qty: number) => {
    if (qty < 1) return removeFromCart(productId);
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity: qty } : i));
  };
  const clearCart = () => setCart([]);

  const toggleFavorite = (id: string) => setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  const toggleDarkMode = () => setDarkMode((v) => !v);

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkoutPromoCode,
        setCheckoutPromoCode,
        favorites,
        toggleFavorite,
        darkMode,
        toggleDarkMode,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);

export function formatPrice(price: number): string {
  return price.toLocaleString("fr-DZ") + " DA";
}
