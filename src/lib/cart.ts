// Cart management for customer checkout flow
export interface CartItem {
  id: number; // catalogItemId
  storeId: number;
  storeName: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  variantId?: number;
  variantName?: string;
  maxQuantity?: number; // for inventory tracking
}

export interface CartAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  isDefault?: boolean;
}

export interface CartState {
  items: CartItem[];
  shippingAddress?: CartAddress;
  billingAddress?: CartAddress;
  useSameAddress: boolean;
  paymentMethod?: 'bank_transfer' | 'cash_on_delivery' | 'mobile_money';
  notes?: string;
  couponCode?: string;
  discountAmount?: number;
}

export class CartManager {
  private static STORAGE_KEY = 'myshop_cart';
  
  static getCart(): CartState {
    if (typeof window === 'undefined') {
      return { items: [], useSameAddress: true };
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse cart from localStorage:', error);
    }
    
    return { items: [], useSameAddress: true };
  }
  
  static saveCart(cart: CartState): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error);
    }
  }
  
  static addItem(item: CartItem): void {
    const cart = this.getCart();
    
    // Check if item already exists (same product + variant)
    const existingIndex = cart.items.findIndex(
      i => i.id === item.id && i.variantId === item.variantId
    );
    
    if (existingIndex >= 0) {
      // Update quantity, respecting max quantity limit
      const existing = cart.items[existingIndex];
      const newQuantity = existing.quantity + item.quantity;
      
      if (item.maxQuantity && newQuantity > item.maxQuantity) {
        cart.items[existingIndex].quantity = item.maxQuantity;
      } else {
        cart.items[existingIndex].quantity = newQuantity;
      }
    } else {
      // Add new item
      cart.items.push(item);
    }
    
    this.saveCart(cart);
  }
  
  static updateQuantity(itemId: number, variantId: number | undefined, quantity: number): void {
    const cart = this.getCart();
    const index = cart.items.findIndex(
      i => i.id === itemId && i.variantId === variantId
    );
    
    if (index >= 0) {
      if (quantity <= 0) {
        cart.items.splice(index, 1);
      } else {
        // Respect max quantity limit
        const item = cart.items[index];
        cart.items[index].quantity = item.maxQuantity ? 
          Math.min(quantity, item.maxQuantity) : quantity;
      }
      
      this.saveCart(cart);
    }
  }
  
  static removeItem(itemId: number, variantId?: number): void {
    const cart = this.getCart();
    cart.items = cart.items.filter(
      i => !(i.id === itemId && i.variantId === variantId)
    );
    this.saveCart(cart);
  }
  
  static clearCart(): void {
    this.saveCart({ items: [], useSameAddress: true });
  }
  
  static getItemCount(): number {
    const cart = this.getCart();
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }
  
  static getSubtotal(): number {
    const cart = this.getCart();
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
  
  static getTotal(): number {
    const subtotal = this.getSubtotal();
    const cart = this.getCart();
    const discount = cart.discountAmount || 0;
    return Math.max(0, subtotal - discount);
  }
  
  static updateShippingAddress(address: CartAddress): void {
    const cart = this.getCart();
    cart.shippingAddress = address;
    if (cart.useSameAddress) {
      cart.billingAddress = address;
    }
    this.saveCart(cart);
  }
  
  static updateBillingAddress(address: CartAddress): void {
    const cart = this.getCart();
    cart.billingAddress = address;
    this.saveCart(cart);
  }
  
  static setSameAddress(useSame: boolean): void {
    const cart = this.getCart();
    cart.useSameAddress = useSame;
    if (useSame && cart.shippingAddress) {
      cart.billingAddress = cart.shippingAddress;
    }
    this.saveCart(cart);
  }
  
  static updatePaymentMethod(method: CartState['paymentMethod']): void {
    const cart = this.getCart();
    cart.paymentMethod = method;
    this.saveCart(cart);
  }
  
  static updateNotes(notes: string): void {
    const cart = this.getCart();
    cart.notes = notes;
    this.saveCart(cart);
  }
  
  static applyCoupon(code: string, discount: number): void {
    const cart = this.getCart();
    cart.couponCode = code;
    cart.discountAmount = discount;
    this.saveCart(cart);
  }
  
  static removeCoupon(): void {
    const cart = this.getCart();
    delete cart.couponCode;
    delete cart.discountAmount;
    this.saveCart(cart);
  }
  
  static getStoreGroups(): Array<{ storeId: number; storeName: string; items: CartItem[] }> {
    const cart = this.getCart();
    const groups = new Map<number, { storeId: number; storeName: string; items: CartItem[] }>();
    
    for (const item of cart.items) {
      if (!groups.has(item.storeId)) {
        groups.set(item.storeId, {
          storeId: item.storeId,
          storeName: item.storeName,
          items: []
        });
      }
      groups.get(item.storeId)!.items.push(item);
    }
    
    return Array.from(groups.values());
  }
}