import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// Product IDs that match your App Store Connect configuration
export const DONATION_PRODUCTS = {
  SMALL: 'donation_5',     // $5
  MEDIUM: 'donation_10',   // $10
  LARGE: 'donation_25',    // $25
  XLARGE: 'donation_50',   // $50
} as const;

export type DonationProductId = typeof DONATION_PRODUCTS[keyof typeof DONATION_PRODUCTS];

let configured: Promise<boolean> | null = null;

const configure = async (userId?: string) => {
  try {
    // Use platform-specific RevenueCat API keys
    // Get these from app.revenuecat.com -> Project -> API Keys
    const platform = Capacitor.getPlatform();
    const REVENUECAT_API_KEY = platform === 'ios'
      ? import.meta.env.VITE_REVENUECAT_API_KEY_IOS
      : import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID;

    if (!REVENUECAT_API_KEY) {
      console.warn(`RevenueCat API key not found for platform: ${platform}`);
      return false;
    }

    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    
    // Configure with your API key
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId,
    });

    console.log('RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    configured = null;
    return false;
  }
};

// Initialize RevenueCat - call this when the app starts and again once the user is known.
// Purchases are verified server-side against the RevenueCat app user id, so it must equal the Supabase user id.
export const initializeIAP = async (userId?: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not on native platform, skipping IAP initialization');
    return false;
  }

  configured ??= configure(userId);
  if (!(await configured)) return false;
  if (!userId) return true;

  try {
    const { appUserID } = await Purchases.getAppUserID();
    if (appUserID !== userId) await Purchases.logIn({ appUserID: userId });
    return true;
  } catch (error) {
    console.error('Failed to log in to RevenueCat:', error);
    return false;
  }
};

// Check if IAP is available on this platform
export const isIAPAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Get available donation products
export const getAvailableDonationProducts = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current) {
      return offerings.current.availablePackages;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return [];
  }
};

// Purchase a donation product for the signed-in user
export const purchaseDonation = async (productId: DonationProductId, userId: string) => {
  try {
    await initializeIAP(userId);
    const { appUserID } = await Purchases.getAppUserID();
    if (appUserID !== userId) {
      throw new Error('Could not link the purchase to your account. Please try again.');
    }

    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current) {
      throw new Error('No offerings available');
    }

    // Find the package that matches the product ID
    const pkg = offerings.current.availablePackages.find(
      p => p.product.identifier === productId
    );

    if (!pkg) {
      throw new Error(`Product ${productId} not found`);
    }

    const purchaseResult = await Purchases.purchasePackage({ aPackage: pkg });
    
    return {
      success: true,
      customerInfo: purchaseResult.customerInfo,
      productIdentifier: purchaseResult.productIdentifier,
      transactionId: purchaseResult.transaction?.transactionIdentifier,
      appUserId: appUserID,
    };
  } catch (error: any) {
    if (error.userCancelled) {
      return {
        success: false,
        cancelled: true,
        error: 'User cancelled the purchase',
      };
    }
    
    console.error('Purchase error:', error);
    return {
      success: false,
      cancelled: false,
      error: error.message || 'Failed to complete purchase',
    };
  }
};

// Restore purchases (required by Apple)
export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return {
      success: true,
      customerInfo,
    };
  } catch (error: any) {
    console.error('Restore purchases error:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
};

// Get the product ID based on amount
export const getProductIdForAmount = (amount: number): DonationProductId | null => {
  switch (amount) {
    case 5:
      return DONATION_PRODUCTS.SMALL;
    case 10:
      return DONATION_PRODUCTS.MEDIUM;
    case 25:
      return DONATION_PRODUCTS.LARGE;
    case 50:
      return DONATION_PRODUCTS.XLARGE;
    default:
      return null;
  }
};
