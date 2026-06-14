import Redis from 'ioredis';

// Initialize your redis client (ensure this matches your setup)
export const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export enum UserState {
    IDLE = 'IDLE',
    AWAITING_MAIN_MENU_SELECTION = 'AWAITING_MAIN_MENU_SELECTION',
    AWAITING_CATEGORY_SELECTION = 'AWAITING_CATEGORY_SELECTION',
    AWAITING_PRODUCT_SELECTION = 'AWAITING_PRODUCT_SELECTION',
    AWAITING_QUANTITY = 'AWAITING_QUANTITY',
    AWAITING_CART_CONFIRMATION = 'AWAITING_CART_CONFIRMATION'
}

interface CartItem {
    variantId: number;
    quantity: number;
    price: number;
}

/**
 * Robustly appends an item to the user's cart in Redis
 */
export async function addToCart(from: string, item: CartItem): Promise<void> {
    const key = `cart:${from}`;
    
    // 1. Fetch existing cart string from Redis
    const existingCartData = await redis.get(key);
    let cart: CartItem[] = [];

    if (existingCartData) {
        try {
            cart = JSON.parse(existingCartData);
        } catch (e) {
            cart = []; // Fallback if data got corrupted
        }
    }

    // 2. Check if variant already exists in cart, if so, accumulate quantity
    const existingItemIndex = cart.findIndex(i => i.variantId === item.variantId);
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += item.quantity;
    } else {
        cart.push(item);
    }

    // 3. Save serialized cart back to Redis with a 24-hour expiration time
    await redis.set(key, JSON.stringify(cart), 'EX', 86400);
}

/**
 * Securely retrieves the array representation of the user's cart
 */
export async function getCart(from: string): Promise<CartItem[]> {
    const key = `cart:${from}`;
    const data = await redis.get(key);
    
    if (!data) return [];
    
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

/**
 * Completely clears out the temporary Redis cart storage
 */
export async function clearCart(from: string): Promise<void> {
    const key = `cart:${from}`;
    await redis.del(key);
}

// Ensure your context helpers use clean string formats too
export async function setContext(from: string, key: string, value: string): Promise<void> {
    await redis.set(`ctx:${from}:${key}`, value, 'EX', 3600);
}

export async function getContext(from: string, key: string): Promise<string | null> {
    return await redis.get(`ctx:${from}:${key}`);
}

export async function getUserState(from: string): Promise<UserState> {
    const state = await redis.get(`state:${from}`);
    return (state as UserState) || UserState.IDLE;
}

export async function setUserState(from: string, state: UserState): Promise<void> {
    await redis.set(`state:${from}`, state);
}
