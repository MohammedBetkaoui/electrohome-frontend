import { Heart, ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router";
import { Product, useStore, formatPrice } from "../data/store";

const badgeColors: Record<string, string> = {
  Nouveau: "bg-[#0A84FF] text-white",
  Promo: "bg-[#E8400C] text-white",
  Bestseller: "bg-[#FFD60A] text-[#111]",
};

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, favorites, toggleFavorite } = useStore();
  const isFav = favorites.includes(product.id);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const productPath = `/produit/${product.slug ?? product.id}`;

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link to={productPath}>
          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </Link>
        {product.badge && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs ${badgeColors[product.badge]}`}>
            {product.badge} {discount > 0 && product.badge === "Promo" && `-${discount}%`}
          </span>
        )}
        <button
          onClick={() => toggleFavorite(product.id)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur flex items-center justify-center transition-colors hover:bg-white"
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-[#E8400C] text-[#E8400C]" : "text-foreground"}`} />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.brand}</p>
        <Link to={productPath}>
          <h3 className="text-sm line-clamp-2 hover:text-[#E8400C] transition-colors">{product.name}</h3>
        </Link>
        <p className="text-xs text-muted-foreground font-mono">{product.specs}</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? "fill-[#FFD60A] text-[#FFD60A]" : "text-border"}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({product.reviewCount})</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg text-foreground" style={{ fontWeight: 600 }}>{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>}
          </div>
          <button
            onClick={() => addToCart(product)}
            className="w-9 h-9 rounded-lg bg-[#E8400C] dark:bg-[#FF5722] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
