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

// Initialize RevenueCat - call this when the app starts
export const initializeIAP = async (userId?: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not on native platform, skipping IAP initialization');
    return false;
  }

  try {
    // Get your RevenueCat API key from https://app.revenuecat.com
    const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY;
    
    if (!REVENUECAT_API_KEY) {
      console.warn('RevenueCat API key not found');
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

// Purchase a donation product
export const purchaseDonation = async (productId: DonationProductId) => {
  try {
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
