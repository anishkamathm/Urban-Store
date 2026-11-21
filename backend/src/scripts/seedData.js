import bcrypt from 'bcryptjs';
import { query, mockDb } from '../config/postgres.js';
import { indexProduct, getOpenSearchClient, isLiveOpenSearch, mockOpenSearchIndex } from '../config/opensearch.js';
import { config } from '../config/env.js';

export const SEED_STORES = [
  {
    id: 'store-blr-indiranagar',
    name: 'Urban Store Indiranagar Flagship (Bengaluru)',
    city: 'Bengaluru',
    latitude: 12.9784,
    longitude: 77.6408,
    delivery_radius_km: 6.0,
  },
  {
    id: 'store-blr-koramangala',
    name: 'Urban Store Koramangala Fashion Hub',
    city: 'Bengaluru',
    latitude: 12.9352,
    longitude: 77.6245,
    delivery_radius_km: 5.0,
  },
  {
    id: 'store-blr-malleshwaram',
    name: 'Urban Store Malleshwaram Galleria',
    city: 'Bengaluru',
    latitude: 13.0031,
    longitude: 77.5643,
    delivery_radius_km: 5.0,
  },
  {
    id: 'store-blr-jayanagar',
    name: 'Urban Store Jayanagar 4th Block',
    city: 'Bengaluru',
    latitude: 12.9308,
    longitude: 77.5838,
    delivery_radius_km: 5.0,
  },
  {
    id: 'store-blr-whitefield',
    name: 'Urban Store Whitefield Tech Center',
    city: 'Bengaluru',
    latitude: 12.9698,
    longitude: 77.7500,
    delivery_radius_km: 7.0,
  },
  {
    id: 'store-mys-kuvempu',
    name: 'Urban Store Mysuru Heritage Outlet',
    city: 'Mysuru',
    latitude: 12.2858,
    longitude: 76.6215,
    delivery_radius_km: 6.0,
  },
  {
    id: 'store-hub-central',
    name: 'Urban Store Hubballi Central',
    city: 'Hubballi',
    latitude: 15.3647,
    longitude: 75.1240,
    delivery_radius_km: 6.0,
  },
];

export const SEED_CATEGORIES = [
  {
    id: 'cat-clothes',
    slug: 'clothes',
    name_en: 'Clothes & Apparel',
    name_kn: 'ಉಡುಪುಗಳು',
    icon: 'Shirt',
  },
  {
    id: 'cat-shoes',
    slug: 'shoes',
    name_en: 'Shoes & Footwear',
    name_kn: 'ಪಾದರಕ್ಷೆಗಳು ಮತ್ತು ಶೂಗಳು',
    icon: 'Footprints',
  },
  {
    id: 'cat-watches',
    slug: 'watches',
    name_en: 'Watches',
    name_kn: 'ಕೈಗಡಿಯಾರಗಳು',
    icon: 'Watch',
  },
  {
    id: 'cat-handbags',
    slug: 'handbags',
    name_en: 'Handbags',
    name_kn: 'ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್‌ಗಳು',
    icon: 'ShoppingBag',
  },
  {
    id: 'cat-wallets',
    slug: 'wallets',
    name_en: 'Bags & Wallets',
    name_kn: 'ಬ್ಯಾಗ್‌ಗಳು ಮತ್ತು ವಾಲೆಟ್‌ಗಳು',
    icon: 'Briefcase',
  },
  {
    id: 'cat-accessories',
    slug: 'accessories',
    name_en: 'Accessories',
    name_kn: 'ಆಕ್ಸೆಸರೀಸ್',
    icon: 'Sparkles',
  },
];

export const SEED_PRODUCTS = [
  // 1. WATCHES
  {
    id: 'prod-watch-rose-gold',
    category_id: 'cat-watches',
    name_en: 'Aethel Chronograph Rose Gold Luxury Watch',
    name_kn: 'ಏಥೆಲ್ ಕ್ರೋನೋಗ್ರಾಫ್ ರೋಸ್ ಗೋಲ್ಡ್ ಲಕ್ಸುರಿ ಕೈಗಡಿಯಾರ',
    description_en: 'Precision quartz movement with scratch-resistant sapphire crystal glass, 5 ATM water resistance, and an adjustable Milanese mesh strap.',
    description_kn: 'ನಿಖರವಾದ ಸ್ವಿಟ್ಸ್ ಕ್ವಾರ್ಟ್ಜ್ ಮೂವ್‌ಮೆಂಟ್, ನೀರು ನಿರೋಧಕ ಸಾಮರ್ಥ್ಯ ಮತ್ತು ರೋಸ್ ಗೋಲ್ಡ್ ಮೆಟಲ್ ಸ್ಟ್ರಾಪ್ ಹೊಂದಿರುವ ಪ್ರೀಮಿಯಂ ಕೈಗಡಿಯಾರ.',
    price: 7999.00,
    image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
    central_stock: 45,
    keywords: 'watch, luxury watch, chronograph, rose gold watch, ಕೈಗಡಿಯಾರ, ವಾಚ್, ರೋಸ್ ಗೋಲ್ಡ್, ಪ್ರೀಮಿಯಂ ವಾಚ್',
    is_featured: true,
    rating: 4.9,
    reviews: 84,
    sizes: ['38mm', '40mm', '42mm'],
    colors: ['Rose Gold', 'Matte Silver', 'Midnight Black'],
    gender: 'unisex',
    is_new_arrival: true,
    has_offer: true,
    stocks: {
      'store-blr-indiranagar': 3, // Low stock test!
      'store-blr-koramangala': 8,
      'store-blr-malleshwaram': 5,
      'store-blr-jayanagar': 4,
      'store-blr-whitefield': 6,
      'store-mys-kuvempu': 4,
      'store-hub-central': 3,
    }
  },
  {
    id: 'prod-watch-minimalist',
    category_id: 'cat-watches',
    name_en: 'Klassik Minimalist Black Leather Dial Watch',
    name_kn: 'ಕ್ಲಾಸಿಕ್ ಮಿನಿಮಲಿಸ್ಟ್ ಲೆದರ್ ಸ್ಟ್ರಾಪ್ ಕೈಗಡಿಯಾರ',
    description_en: 'Ultra-thin 7mm profile with genuine Italian vegetable-tanned leather strap and surgical-grade 316L stainless steel casing.',
    description_kn: 'ನೈಜ ಚರ್ಮದ ಪಟ್ಟಿ ಮತ್ತು ಅಲ್ಟ್ರಾ-ಸ್ಲಿಮ್ ಪ್ರೊಫೈಲ್ ಹೊಂದಿರುವ ಸಾಂಪ್ರದಾಯಿಕ ಹಾಗೂ ಆಕರ್ಷಕ ಕಪ್ಪು ಡಯಲ್ ಕೈಗಡಿಯಾರ.',
    price: 4499.00,
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
    central_stock: 60,
    keywords: 'watch, minimalist watch, leather watch, black dial, ವಾಚ್, ಲೆದರ್ ವಾಚ್, ಕಪ್ಪು ಕೈಗಡಿಯಾರ',
    is_featured: false,
    rating: 4.7,
    reviews: 62,
    sizes: ['40mm'],
    colors: ['Black', 'Tan Brown'],
    gender: 'men',
    is_new_arrival: false,
    has_offer: false,
    stocks: {
      'store-blr-indiranagar': 7,
      'store-blr-koramangala': 12,
      'store-blr-malleshwaram': 6,
      'store-blr-jayanagar': 5,
      'store-blr-whitefield': 9,
      'store-mys-kuvempu': 4,
      'store-hub-central': 5,
    }
  },
  {
    id: 'prod-watch-automatic-skeleton',
    category_id: 'cat-watches',
    name_en: 'Vanguard Automatic Skeleton Mechanical Watch',
    name_kn: 'ವ್ಯಾನ್‌ಗಾರ್ಡ್ ಆಟೋಮ್ಯಾಟಿಕ್ ಸ್ಕೆಲಿಟನ್ ಮೆಕ್ಯಾನಿಕಲ್ ವಾಚ್',
    description_en: 'Self-winding automatic movement visible through transparent openwork dial with 42-hour power reserve and exhibition caseback.',
    description_kn: 'ಬ್ಯಾಟರಿ ರಹಿತ ಸ್ವಯಂಚಾಲಿತ ಮೆಕ್ಯಾನಿಕಲ್ ಮೂವ್‌ಮೆಂಟ್ ಮತ್ತು ಪಾರದರ್ಶಕ ಗ್ಲಾಸ್ ಹೊಂದಿರುವ ಅತ್ಯಾಧುನಿಕ ಐಷಾರಾಮಿ ವಾಚ್.',
    price: 12999.00,
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
    central_stock: 25,
    keywords: 'automatic watch, skeleton watch, mechanical watch, ಸ್ಕೆಲಿಟನ್ ವಾಚ್, ಆಟೋಮ್ಯಾಟಿಕ್ ವಾಚ್, ಮೆಕ್ಯಾನಿಕಲ್',
    is_featured: true,
    rating: 5.0,
    reviews: 42,
    sizes: ['42mm'],
    colors: ['Gunmetal', 'Silver Steel'],
    gender: 'men',
    is_new_arrival: true,
    has_offer: false,
    stocks: {
      'store-blr-indiranagar': 2,
      'store-blr-koramangala': 4,
      'store-blr-malleshwaram': 2,
      'store-blr-jayanagar': 3,
      'store-blr-whitefield': 3,
      'store-mys-kuvempu': 2,
      'store-hub-central': 2,
    }
  },

  // 2. SHOES & FOOTWEAR
  {
    id: 'prod-shoes-chelsea-boots',
    category_id: 'cat-shoes',
    name_en: 'Artisan Full-Grain Leather Chelsea Boots (Cognac)',
    name_kn: 'ಆರ್ಟಿಸನ್ ಲೆದರ್ ಚೆಲ್ಸಿಯಾ ಬೂಟ್ಸ್ (ಕಾಗ್ನ್ಯಾಕ್)',
    description_en: 'Goodyear welted European calfskin leather boots with elasticated side gussets and anti-slip studded rubber outsole.',
    description_kn: 'ಶುದ್ಧ ಲೆದರ್‌ನಿಂದ ಕೈಯಿಂದ ಹೊಲಿದ ಪ್ರೀಮಿಯಂ ಚೆಲ್ಸಿಯಾ ಬೂಟುಗಳು. ದೀರ್ಘಕಾಲಿಕ ಬಾಳಿಕೆ ಮತ್ತು ಅದ್ಭುತ ಆರಾಮ.',
    price: 5499.00,
    image_url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop&q=80',
    central_stock: 80,
    keywords: 'shoes, boots, chelsea boots, leather shoes, ಶೂಗಳು, ಲೆದರ್ ಶೂ, ಬೂಟ್ಸ್, ಬೂಟುಗಳು',
    is_featured: true,
    rating: 4.8,
    reviews: 110,
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    colors: ['Cognac Tan', 'Deep Espresso', 'Matte Black'],
    gender: 'men',
    is_new_arrival: false,
    has_offer: true,
    stocks: {
      'store-blr-indiranagar': 5,
      'store-blr-koramangala': 10,
      'store-blr-malleshwaram': 6,
      'store-blr-jayanagar': 4,
      'store-blr-whitefield': 8,
      'store-mys-kuvempu': 5,
      'store-hub-central': 4,
    }
  },
  {
    id: 'prod-shoes-white-sneakers',
    category_id: 'cat-shoes',
    name_en: 'Urban Court Napa Leather White Low-Top Sneakers',
    name_kn: 'ಅರ್ಬನ್ ಕೋರ್ಟ್ ನಪಾ ಲೆದರ್ ವೈಟ್ ಸ್ನೀಕರ್ಸ್',
    description_en: 'Supple full-grain Napa leather with OrthoLite memory foam footbed and cupsole stitch. The foundational everyday fashion essential.',
    description_kn: 'ದೈನಂದಿನ ಜೀವನಶೈಲಿಗೆ ಅತ್ಯುತ್ತಮವಾದ ಬಿಳಿ ಚರ್ಮದ ಸ್ನೀಕರ್ಸ್. ಮೆಮೊರಿ ಫೋಮ್ ಸೋಲ್ ಜೊತೆ ದಿನವಿಡೀ ಆರಾಮ.',
    price: 3499.00,
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
    central_stock: 120,
    keywords: 'sneakers, white shoes, white sneakers, low top, ಸ್ನೀಕರ್ಸ್, ವೈಟ್ ಶೂ, ಬಿಳಿ ಸ್ನೀಕರ್ಸ್, ಶೂಗಳು',
    is_featured: true,
    rating: 4.9,
    reviews: 195,
    sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
    colors: ['All White', 'White/Emerald', 'White/Navy'],
    gender: 'unisex',
    is_new_arrival: true,
    has_offer: false,
    stocks: {
      'store-blr-indiranagar': 12,
      'store-blr-koramangala': 18,
      'store-blr-malleshwaram': 10,
      'store-blr-jayanagar': 9,
      'store-blr-whitefield': 14,
      'store-mys-kuvempu': 8,
      'store-hub-central': 7,
    }
  },
  {
    id: 'prod-shoes-oxford-brogues',
    category_id: 'cat-shoes',
    name_en: 'Heritage Cap-Toe Oxford Brogue Shoes',
    name_kn: 'ಹೆರಿಟೇಜ್ ಕ್ಯಾಪ್-ಟೋ ಆಕ್ಸ್‌ಫರ್ಡ್ ಬ್ರೋಗ್ ಶೂಗಳು',
    description_en: 'Burnished hand-finished patina with perforated wingtip brogue detailing and cushioned leather lining. Ideal for formal suits and festive wear.',
    description_kn: 'ಸೂಟ್ ಮತ್ತು ಔಪಚಾರಿಕ ಉಡುಪುಗಳಿಗೆ ಹೇಳಿಮಾಡಿಸಿದ ಪಾರಂಪರಿಕ ಆಕ್ಸ್‌ಫರ್ಡ್ ಲೆದರ್ ಶೂಗಳು.',
    price: 4999.00,
    image_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop&q=80',
    central_stock: 50,
    keywords: 'formal shoes, oxford shoes, brogues, dress shoes, ಫಾರ್ಮಲ್ ಶೂ, ಬ್ರೋಗ್ಸ್, ಲೆದರ್ ಬ್ರೋಗ್ ಶೂ',
    is_featured: false,
    rating: 4.7,
    reviews: 73,
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
    colors: ['Burnished Tan', 'Classic Black'],
    gender: 'men',
    is_new_arrival: false,
    has_offer: true,
    stocks: {
      'store-blr-indiranagar': 4,
      'store-blr-koramangala': 6,
      'store-blr-malleshwaram': 5,
      'store-blr-jayanagar': 3,
      'store-blr-whitefield': 6,
      'store-mys-kuvempu': 3,
      'store-hub-central': 3,
    }
  },

  // 3. CLOTHES & APPAREL
  {
    id: 'prod-clothes-wool-blazer',
    category_id: 'cat-clothes',
    name_en: 'Tailored Italian Wool Blend Blazer (Charcoal)',
    name_kn: 'ಟೈಲರ್ಡ್ ಇಟಾಲಿಯನ್ ವುಲ್ ಬ್ಲೆಂಡ್ ಬ್ಲೇಜರ್ (ಕಲ್ಲಿದ್ದಲು ಬಣ್ಣ)',
    description_en: 'Half-canvas construction in breathable Italian merino wool blend with pick-stitch lapels and horn buttons. Unstructured shoulders for modern drape.',
    description_kn: 'ಇಟಾಲಿಯನ್ ಮೆರಿನೊ ಉಣ್ಣೆಯ ಮಿಶ್ರಣದಿಂದ ತಯಾರಿಸಿದ ಪ್ರೀಮಿಯಂ ಬ್ಲೇಜರ್. ಕಚೇರಿ ಮತ್ತು ಪಾರ್ಟಿಗಳಿಗೆ ಆಕರ್ಷಕ ನೋಟ ನೀಡುತ್ತದೆ.',
    price: 6499.00,
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
    central_stock: 65,
    keywords: 'blazer, suit jacket, wool blazer, clothes, ಬ್ಲೇಜರ್, ಸೂಟ್, ಕೋಟ್, ಉಡುಪುಗಳು',
    is_featured: true,
    rating: 4.9,
    reviews: 132,
    sizes: ['38R', '40R', '42R', '44R'],
    colors: ['Charcoal Grey', 'Navy Blue', 'Olive Tweed'],
    gender: 'men',
    is_new_arrival: true,
    has_offer: false,
    stocks: {
      'store-blr-indiranagar': 6,
      'store-blr-koramangala': 9,
      'store-blr-malleshwaram': 4,
      'store-blr-jayanagar': 5,
      'store-blr-whitefield': 7,
      'store-mys-kuvempu': 4,
      'store-hub-central': 3,
    }
  },
  {
    id: 'prod-clothes-silk-slip-dress',
    category_id: 'cat-clothes',
    name_en: 'Pure Mulberry Silk Evening Slip Dress (Champagne)',
    name_kn: 'ಪ್ಯೂರ್ ಮೈಸೂರು ಮಲ್ಬರಿ ರೇಷ್ಮೆ ಈವ್ನಿಂಗ್ ಸ್ಲಿಪ್ ಡ್ರೆಸ್',
    description_en: 'Cut on the bias from luxurious 22-momme pure mulberry silk. Features a cowl neckline, adjustable delicate straps, and fluid silhouette.',
    description_kn: '100% ಶುದ್ಧ ರೇಷ್ಮೆಯಿಂದ ತಯಾರಿಸಿದ ಸೊಗಸಾದ ಪಾರ್ಟಿ ಮತ್ತು ಈವ್ನಿಂಗ್ ಡ್ರೆಸ್. ಮೃದು ಸ್ಪರ್ಶ ಮತ್ತು ನೈಸರ್ಗಿಕ ಹೊಳಪು.',
    price: 5499.00,
    image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
    central_stock: 40,
    keywords: 'silk dress, evening dress, slip dress, silk, ರೇಷ್ಮೆ ಉಡುಪು, ಡ್ರೆಸ್, ಸಿಲ್ಕ್ ಡ್ರೆಸ್',
    is_featured: true,
    rating: 5.0,
    reviews: 98,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Champagne Gold', 'Ruby Rose', 'Emerald'],
    gender: 'women',
    is_new_arrival: true,
    has_offer: true,
    stocks: {
      'store-blr-indiranagar': 3,
      'store-blr-koramangala': 7,
      'store-blr-malleshwaram': 4,
      'store-blr-jayanagar': 3,
      'store-blr-whitefield': 5,
      'store-mys-kuvempu': 6,
      'store-hub-central': 2,
    }
  },
  {
    id: 'prod-clothes-selvedge-denim',
    category_id: 'cat-clothes',
    name_en: 'Japanese Kaihara Selvedge Raw Denim Jeans (14oz)',
    name_kn: 'ಜಪಾನೀಸ್ ಸೆಲ್ವೆಡ್ಜ್ ರಾ ಡೆನಿಮ್ ಜೀನ್ಸ್ (14oz)',
    description_en: 'Woven on vintage Toyoda shuttle looms with classic redline selvedge ID. Unwashed raw indigo denim designed to develop custom fades over time.',
    description_kn: 'ಖ್ಯಾತ ಕೈಹಾರ ಮಿಲ್‌ನಲ್ಲಿ ನೇಯ್ದ 14 ಔನ್ಸ್ ಶುದ್ಧ ಸೆಲ್ವೆಡ್ಜ್ ಜೀನ್ಸ್. ದೀರ್ಘ ಬಾಳಿಕೆ ಮತ್ತು ಅದ್ಭುತ ಕಂಫರ್ಟ್.',
    price: 3999.00,
    image_url: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
    central_stock: 90,
    keywords: 'jeans, denim, selvedge denim, raw denim, ಜೀನ್ಸ್, ಡೆನಿಮ್, ಪ್ಯಾಂಟ್, ಜೀನ್ಸ್ ಪ್ಯಾಂಟ್',
    is_featured: false,
    rating: 4.8,
    reviews: 142,
    sizes: ['30', '32', '34', '36', '38'],
    colors: ['Raw Indigo', 'Faded Charcoal'],
    gender: 'men',
    is_new_arrival: false,
    has_offer: false,
    stocks: {
      'store-blr-indiranagar': 1, // Crucial for 1-item race & POS concurrency testing!
      'store-blr-koramangala': 8,
      'store-blr-malleshwaram': 4,
      'store-blr-jayanagar': 3,
      'store-blr-whitefield': 5,
      'store-mys-kuvempu': 4,
      'store-hub-central': 2,
    }
  },
  {
    id: 'prod-clothes-linen-shirt',
    category_id: 'cat-clothes',
    name_en: 'Relaxed French Linen Camp Collar Resort Shirt',
    name_kn: 'ಫ್ರೆಂಚ್ ಲಿನೆನ್ ಸಮ್ಮರ್ ಕ್ಯಾಶುಯಲ್ ಶರ್ಟ್',
    description_en: 'Garment-washed pure Normandy flax linen with open Cuban collar and chest pocket. Highly breathable for tropical summers and vacations.',
    description_kn: '100% ಶುದ್ಧ ಲಿನೆನ್‌ನಿಂದ ತಯಾರಿಸಿದ ತಂಪಾದ ಬೇಸಿಗೆಯ ಕ್ಯಾಶುಯಲ್ ಶರ್ಟ್. ಗಾಳಿಯಾಡುವ ವಿನ್ಯಾಸ.',
    price: 2499.00,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
    central_stock: 110,
    keywords: 'linen shirt, shirt, summer shirt, clothes, ಶರ್ಟ್, ಲಿನೆನ್ ಶರ್ಟ್, ಕಾಟನ್ ಶರ್ಟ್, ಬಟ್ಟೆಗಳು',
    is_featured: false,
    rating: 4.7,
    reviews: 86,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Sage Green', 'Crisp White', 'Dusty Peach'],
    gender: 'men',
    is_new_arrival: false,
    has_offer: true,
    stocks: {
      'store-blr-indiranagar': 8,
      'store-blr-koramangala': 14,
      'store-blr-malleshwaram': 7,
      'store-blr-jayanagar': 6,
      'store-blr-whitefield': 9,
      'store-mys-kuvempu': 5,
      'store-hub-central': 4,
    }
  },

  // 4. HANDBAGS
  {
    id: 'prod-handbag-saffiano-tote',
    category_id: 'cat-handbags',
    name_en: 'Palazzo Saffiano Leather Structured Tote Bag',
    name_kn: 'ಪಲಾಝೊ ಸಫಿಯಾನೊ ಲೆದರ್ ಟೋಟ್ ಬ್ಯಾಗ್',
    description_en: 'Scratch-resistant cross-hatch Saffiano leather with gold-plated hardware, top zipper closure, and padded 14-inch laptop sleeve.',
    description_kn: 'ಕಚೇರಿ ಮತ್ತು ದಿನನಿತ್ಯದ ಬಳಕೆಗೆ ಅತ್ಯುತ್ತಮವಾದ ಗಟ್ಟಿಮುಟ್ಟಾದ ಸಫಿಯಾನೊ ಲೆದರ್ ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್. ಲ್ಯಾಪ್‌ಟಾಪ್ ಪಾಕೆಟ್ ಒಳಗೊಂಡಿದೆ.',
    price: 4999.00,
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
    central_stock: 70,
    keywords: 'handbag, tote bag, leather bag, purse, ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್, ಪರ್ಸ್, ಟೋಟ್ ಬ್ಯಾಗ್, ಮಹಿಳಾ ಬ್ಯಾಗ್',
    is_featured: true,
    rating: 4.9,
    reviews: 115,
    sizes: ['Medium', 'Large'],
    colors: ['Caramel Tan', 'Noir Black', 'Burgundy'],
    gender: 'women',
    is_new_arrival: true,
    has_offer: false,
    stocks: {
      'store-blr-indiranagar': 5,
      'store-blr-koramangala': 9,
      'store-blr-malleshwaram': 4,
      'store-blr-jayanagar': 4,
      'store-blr-whitefield': 6,
      'store-mys-kuvempu': 3,
      'store-hub-central': 3,
    }
  },
  {
    id: 'prod-handbag-crescent-shoulder',
    category_id: 'cat-handbags',
    name_en: 'Luna Crescent Moon Vegan Leather Shoulder Bag',
    name_kn: 'ಲೂನಾ ಕ್ರೆಸೆಂಟ್ ಮೂನ್ ಶೋಲ್ಡರ್ ಬ್ಯಾಗ್',
    description_en: 'Chic 90s-inspired minimalist curved crescent silhouette with magnetic snap closure and comfortable shoulder drop strap.',
    description_kn: 'ಆಧುನಿಕ ಅರ್ಧಚಂದ್ರಾಕಾರದ ಸುಂದರ ಶೋಲ್ಡರ್ ಬ್ಯಾಗ್. ಪಾರ್ಟಿ ಹಾಗೂ ಕ್ಯಾಶುಯಲ್ ಶಾಪಿಂಗ್‌ಗೆ ಹೇಳಿಮಾಡಿಸಿದ ವಿನ್ಯಾಸ.',
    price: 2799.00,
    image_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&auto=format&fit=crop&q=80',
    central_stock: 85,
    keywords: 'shoulder bag, crescent bag, handbag, purse, ಶೋಲ್ಡರ್ ಬ್ಯಾಗ್, ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್, ಪರ್ಸ್',
    is_featured: false,
    rating: 4.6,
    reviews: 58,
    sizes: ['One Size'],
    colors: ['Cream Ivory', 'Matcha Olive', 'Jet Black'],
    gender: 'women',
    is_new_arrival: false,
    has_offer: true,
    stocks: {
      'store-blr-indiranagar': 6,
      'store-blr-koramangala': 11,
      'store-blr-malleshwaram': 5,
      'store-blr-jayanagar': 4,
      'store-blr-whitefield': 7,
      'store-mys-kuvempu': 4,
      'store-hub-central': 3,
    }
  },
  {
    id: 'prod-handbag-quilted-crossbody',
    category_id: 'cat-handbags',
    name_en: 'Aria Quilted Lambskin Chain Crossbody Bag',
    name_kn: 'ಆರಿಯಾ ಕ್ವಿಲ್ಟೆಡ್ ಚೈನ್ ಕ್ರಾಸ್‌ಬಾಡಿ ಬ್ಯಾಗ್',
    description_en: 'Padded diamond-quilted Napa leather with polished gold-tone woven curb chain strap and turn-lock closure clasp.',
    description_kn: 'ಡೈಮಂಡ್ ಕ್ವಿಲ್ಟಿಂಗ್ ಮತ್ತು ಗೋಲ್ಡ್ ಚೈನ್ ಸ್ಟ್ರಾಪ್ ಹೊಂದಿರುವ ಐಷಾರಾಮಿ ಕ್ರಾಸ್‌ಬಾಡಿ ಬ್ಯಾಗ್.',
    price: 4299.00,
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
    central_stock: 55,
    keywords: 'crossbody bag, quilted bag, chain bag, handbag, ಕ್ರಾಸ್‌ಬಾಡಿ ಬ್ಯಾಗ್, ಹ್ಯಾಂಡ್‌ಬ್ಯಾಗ್, ಪರ್ಸ್',
    is_featured: true,
    rating: 4.9,
    reviews: 92,
    sizes: ['One Size'],
    colors: ['Onyx Black', 'Blush Pink', 'Cloud White'],
    gender: 'women',
    is_new_arrival: true,
    has_offer: false,
    stocks: {
      'store-blr-indiranagar': 4,
      'store-blr-koramangala': 8,
      'store-blr-malleshwaram': 3,
      'store-blr-jayanagar': 3,
      'store-blr-whitefield': 5,
      'store-mys-kuvempu': 3,
      'store-hub-central': 2,
    }
  },

  // 5. BAGS AND WALLETS
  {
    id: 'prod-wallet-bifold-leather',
    category_id: 'cat-wallets',
    name_en: 'Gentleman Full-Grain RFID Leather Bi-Fold Wallet',
    name_kn: 'ಜೆಂಟಲ್‌ಮ್ಯಾನ್ ಫುಲ್-ಗ್ರೇನ್ ಆರ್‌ಎಫ್‌ಐಡಿ ಲೆದರ್ ವಾಲೆಟ್',
    description_en: 'Vegetable-tanned harness leather with built-in aerospace-grade RFID shielding, 8 card slots, dual cash compartments, and quick-pull ID window.',
    description_kn: 'ಆರ್‌ಎಫ್‌ಐಡಿ ಪ್ರೊಟೆಕ್ಷನ್ ಮತ್ತು ನೈಜ ಚರ್ಮದಿಂದ ಕೈಯಿಂದ ಮಾಡಿದ ಪ್ರೀಮಿಯಂ ಪಾಕೆಟ್ ವಾಲೆಟ್.',
    price: 1499.00,
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
    central_stock: 140,
    keywords: 'wallet, leather wallet, bifold wallet, rfid wallet, ವಾಲೆಟ್, ಪರ್ಸ್, ಲೆದರ್ ವಾಲೆಟ್, ಜೇಬು ಪರ್ಸ್',
    is_featured: false,
    rating: 4.9,
    reviews: 215,
    sizes: ['Slim Standard'],
    colors: ['Cognac Brown', 'Matte Black', 'Dark Walnut'],
    gender: 'men',
    is_new_arrival: false,
    has_offer: true,
    stocks: {
      'store-blr-indiranagar': 10,
      'store-blr-koramangala': 16,
      'store-blr-malleshwaram': 8,
      'store-blr-jayanagar': 7,
      'store-blr-whitefield': 12,
      'store-mys-kuvempu': 6,
      'store-hub-central': 5,
    }
  },
  {
    id: 'prod-wallet-commuter-backpack',
    category_id: 'cat-wallets',
    name_en: 'Urban Explorer Waterproof City Commuter Backpack (22L)',
    name_kn: 'ಅರ್ಬನ್ ಎಕ್ಸ್‌ಪ್ಲೋರರ್ ವಾಟರ್‌ಪ್ರೂಫ್ ಲ್ಯಾಪ್ಟಾಪ್ ಬೆನ್ನುಹೊರೆ (ಬ್ಯಾಗ್)',
    description_en: 'Weatherproof matte polyurethane-coated oxford weave with dedicated padded 16-inch laptop chamber, luggage trolley pass-through, and hidden passport security pocket.',
    description_kn: 'ನೀರು ನಿರೋಧಕ ಮ್ಯಾಟ್ ಫಿನಿಶ್ ಮತ್ತು 16 ಇಂಚಿನ ಲ್ಯಾಪ್‌ಟಾಪ್ ಪಾಕೆಟ್ ಹೊಂದಿರುವ ಆಕರ್ಷಕ ನಗರ ಪ್ರಯಾಣದ ಬ್ಯಾಗ್‌ಪ್ಯಾಕ್.',
    price: 3799.00,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    central_stock: 95,
    keywords: 'backpack, laptop bag, travel bag, bags and wallets, ಬ್ಯಾಗ್‌ಪ್ಯಾಕ್, ಲ್ಯಾಪ್‌ಟಾಪ್ ಬ್ಯಾಗ್, ಟ್ರಾವೆಲ್ ಬ್ಯಾಗ್',
    is_featured: true,
    rating: 4.8,
    reviews: 164,
    sizes: ['22 Liters'],
    colors: ['Charcoal Grey', 'Deep Moss', 'Stealth Black'],
    gender: 'unisex',
    is_new_arrival: true,
    has_offer: false,
    stocks: {
      'store-blr-indiranagar': 8,
      'store-blr-koramangala': 14,
      'store-blr-malleshwaram': 6,
      'store-blr-jayanagar': 6,
      'store-blr-whitefield': 11,
      'store-mys-kuvempu': 5,
      'store-hub-central': 4,
    }
  },
  {
    id: 'prod-wallet-zip-cardholder',
    category_id: 'cat-wallets',
    name_en: 'Monaco Pebbled Leather Zip-Around Cardholder Wallet',
    name_kn: 'ಮೊನಾಕೊ ಲೆದರ್ ಜಿಪ್ ಕಾರ್ಡ್‌ಹೋಲ್ಡರ್ ವಾಲೆಟ್',
    description_en: 'Supple pebbled cowhide leather with 6 card slots, central zippered coin pocket, and polished gold zipper pull.',
    description_kn: 'ಕಾಂಪ್ಯಾಕ್ಟ್ ಜಿಪ್ ಕಾರ್ಡ್‌ಹೋಲ್ಡರ್ ಮತ್ತು ನಾಣ್ಯಗಳ ಪಾಕೆಟ್ ಹೊಂದಿರುವ ಸ್ಟೈಲಿಶ್ ಚರ್ಮದ ವಾಲೆಟ್.',
    price: 999.00,
    image_url: 'https://images.unsplash.com/photo-1606503825008-909a67e7545b?w=800&auto=format&fit=crop&q=80',
    central_stock: 130,
    keywords: 'cardholder, wallet, coin purse, card case, ಕಾರ್ಡ್ ಹೋಲ್ಡರ್, ವಾಲೆಟ್, ಸಣ್ಣ ಪರ್ಸ್',
    is_featured: false,
    rating: 4.7,
    reviews: 82,
    sizes: ['Compact'],
    colors: ['Blush Nude', 'Classic Black', 'Forest Green'],
    gender: 'women',
    is_new_arrival: false,
    has_offer: true,
    stocks: {
      'store-blr-indiranagar': 12,
      'store-blr-koramangala': 18,
      'store-blr-malleshwaram': 9,
      'store-blr-jayanagar': 8,
      'store-blr-whitefield': 10,
      'store-mys-kuvempu': 7,
      'store-hub-central': 6,
    }
  }
];

export async function seedInitialDataIfEmpty() {
  console.log('[Seed] Populating Urban Store Fashion & Lifestyle catalog...');

  try {
    const fashionProductIds = SEED_PRODUCTS.map(p => p.id);
    const fashionCategoryIds = SEED_CATEGORIES.map(c => c.id);

    // 0. Purge legacy non-fashion products and categories (e.g. old rice, chocolate, etc.)
    try {
      await query(`DELETE FROM cart_items WHERE product_id != ALL($1)`, [fashionProductIds]);
      await query(`DELETE FROM store_inventory WHERE product_id != ALL($1)`, [fashionProductIds]);
      await query(`DELETE FROM order_items WHERE product_id != ALL($1)`, [fashionProductIds]);
      await query(`DELETE FROM products WHERE id != ALL($1)`, [fashionProductIds]);
      await query(`DELETE FROM categories WHERE id != ALL($1)`, [fashionCategoryIds]);
      console.log('[Seed] Purged legacy non-fashion products from PostgreSQL');
    } catch (cleanupErr) {
      console.warn('[Seed] PostgreSQL cleanup warning:', cleanupErr.message);
    }

    // Clean mock storage
    mockDb.products = mockDb.products.filter(p => fashionProductIds.includes(p.id));
    mockDb.categories = mockDb.categories.filter(c => fashionCategoryIds.includes(c.id));
    mockDb.store_inventory = mockDb.store_inventory.filter(si => fashionProductIds.includes(si.product_id));
    mockDb.cart_items = mockDb.cart_items.filter(ci => fashionProductIds.includes(ci.product_id));

    // Clean mockOpenSearchIndex
    for (const key of Array.from(mockOpenSearchIndex.keys())) {
      if (!fashionProductIds.includes(key)) {
        mockOpenSearchIndex.delete(key);
      }
    }

    // If connected to live OpenSearch, purge legacy documents
    const osClient = getOpenSearchClient();
    if (osClient && isLiveOpenSearch()) {
      try {
        await osClient.deleteByQuery({
          index: config.opensearch.index,
          body: {
            query: {
              bool: {
                must_not: [
                  { terms: { id: fashionProductIds } }
                ]
              }
            }
          },
          refresh: true
        });
        console.log('[Seed] Purged legacy non-fashion documents from live OpenSearch.');
      } catch (osPurgeErr) {
        console.warn('[Seed] OpenSearch purge warning:', osPurgeErr.message);
      }
    }

    // 1. Seed Stores
    for (const store of SEED_STORES) {
      await query(
        `INSERT INTO stores (id, name, city, latitude, longitude, delivery_radius_km)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, delivery_radius_km = EXCLUDED.delivery_radius_km`,
        [store.id, store.name, store.city, store.latitude, store.longitude, store.delivery_radius_km]
      );
      const idx = mockDb.stores.findIndex(s => s.id === store.id);
      if (idx >= 0) mockDb.stores[idx] = store;
      else mockDb.stores.push(store);
    }

    // 2. Seed Categories
    for (const cat of SEED_CATEGORIES) {
      await query(
        `INSERT INTO categories (id, slug, name_en, name_kn, icon)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name_en = EXCLUDED.name_en, name_kn = EXCLUDED.name_kn, slug = EXCLUDED.slug`,
        [cat.id, cat.slug, cat.name_en, cat.name_kn, cat.icon]
      );
      const idx = mockDb.categories.findIndex(c => c.id === cat.id);
      if (idx >= 0) mockDb.categories[idx] = cat;
      else mockDb.categories.push(cat);
    }

    // 3. Seed Products & Inventory
    for (const p of SEED_PRODUCTS) {
      const prodObj = {
        id: p.id,
        category_id: p.category_id,
        name_en: p.name_en,
        name_kn: p.name_kn,
        description_en: p.description_en,
        description_kn: p.description_kn,
        price: p.price,
        image_url: p.image_url,
        central_stock: p.central_stock,
        is_featured: p.is_featured,
        keywords: p.keywords,
        rating: p.rating,
        reviews: p.reviews,
        sizes: p.sizes,
        colors: p.colors,
        gender: p.gender,
        is_new_arrival: p.is_new_arrival,
        has_offer: p.has_offer,
      };

      await query(
        `INSERT INTO products (id, category_id, name_en, name_kn, description_en, description_kn, price, image_url, central_stock, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE
         SET name_en = EXCLUDED.name_en, name_kn = EXCLUDED.name_kn,
             description_en = EXCLUDED.description_en, description_kn = EXCLUDED.description_kn,
             price = EXCLUDED.price, image_url = EXCLUDED.image_url, central_stock = EXCLUDED.central_stock`,
        [p.id, p.category_id, p.name_en, p.name_kn, p.description_en, p.description_kn, p.price, p.image_url, p.central_stock, p.is_featured]
      );

      const pIdx = mockDb.products.findIndex(prod => prod.id === p.id);
      if (pIdx >= 0) mockDb.products[pIdx] = prodObj;
      else mockDb.products.push(prodObj);

      // Store stocks
      const storeDocuments = [];
      for (const [storeId, stock] of Object.entries(p.stocks)) {
        const storeInfo = SEED_STORES.find(s => s.id === storeId);
        await query(
          `INSERT INTO store_inventory (id, store_id, product_id, stock)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (store_id, product_id) DO UPDATE SET stock = EXCLUDED.stock`,
          [`inv-${storeId}-${p.id}`, storeId, p.id, stock]
        );

        const existingInv = mockDb.store_inventory.find(i => i.store_id === storeId && i.product_id === p.id);
        if (existingInv) {
          existingInv.stock = stock;
        } else {
          mockDb.store_inventory.push({
            id: `inv-${storeId}-${p.id}`,
            store_id: storeId,
            product_id: p.id,
            stock,
          });
        }

        if (storeInfo) {
          storeDocuments.push({
            store_id: storeId,
            store_name: storeInfo.name,
            city: storeInfo.city,
            location: { lat: storeInfo.latitude, lon: storeInfo.longitude },
            stock,
            delivery_radius_km: storeInfo.delivery_radius_km,
          });
        }
      }

      // Index into OpenSearch (real or fallback index)
      await indexProduct({
        ...prodObj,
        stores: storeDocuments,
      });
    }

    // 4. Seed Default Admin and Customer Users
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const customerHash = await bcrypt.hash('customer123', salt);

    // Primary Urban Store users
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['user-admin-1', 'Urban Store Manager', 'admin@urbanstore.in', adminHash, 'admin', 'en']
    );

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['user-customer-1', 'Pooja Hegde', 'customer@urbanstore.in', customerHash, 'customer', 'kn']
    );

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['user-customer-2', 'Rohan Sharma', 'customer2@urbanstore.in', customerHash, 'customer', 'en']
    );

    // Backward compatible aliases
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['user-admin-legacy', 'Urban Store Manager', 'admin@shopmart.in', adminHash, 'admin', 'en']
    );

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['user-customer-legacy', 'Pooja Hegde', 'customer@shopmart.in', customerHash, 'customer', 'kn']
    );

    // Update mockDb users
    const usersToMock = [
      { id: 'user-admin-1', name: 'Urban Store Manager', email: 'admin@urbanstore.in', password_hash: adminHash, role: 'admin', preferred_language: 'en' },
      { id: 'user-customer-1', name: 'Pooja Hegde', email: 'customer@urbanstore.in', password_hash: customerHash, role: 'customer', preferred_language: 'kn' },
      { id: 'user-customer-2', name: 'Rohan Sharma', email: 'customer2@urbanstore.in', password_hash: customerHash, role: 'customer', preferred_language: 'en' },
      { id: 'user-admin-legacy', name: 'Urban Store Manager', email: 'admin@shopmart.in', password_hash: adminHash, role: 'admin', preferred_language: 'en' },
      { id: 'user-customer-legacy', name: 'Pooja Hegde', email: 'customer@shopmart.in', password_hash: customerHash, role: 'customer', preferred_language: 'kn' },
    ];

    for (const u of usersToMock) {
      if (!mockDb.users.some(mu => mu.email === u.email)) {
        mockDb.users.push(u);
      }
    }

    // 5. Seed Sample Offline In-Store Bills
    if (mockDb.offline_bills.length === 0) {
      const billId1 = 'bill-pos-1001';
      const bill1 = {
        id: billId1,
        bill_number: '#UB-10492',
        store_id: 'store-blr-indiranagar',
        cashier_id: 'user-admin-1',
        customer_name: 'Vikram Joshi (Walk-in)',
        customer_phone: '+91 98451 99220',
        customer_email: 'vikram.joshi@gmail.com',
        payment_method: 'UPI',
        subtotal: 7999.00,
        tax_amount: 399.95,
        discount_amount: 500.00,
        total_amount: 7898.95,
        notes: 'In-store trial of Chronograph Rose Gold watch',
        status: 'PAID',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      };
      mockDb.offline_bills.push(bill1);
      mockDb.offline_bill_items.push({
        id: 'bi-1',
        bill_id: billId1,
        product_id: 'prod-watch-rose-gold',
        quantity: 1,
        unit_price: 7999.00,
        total_price: 7999.00,
        size: '40mm',
      });

      const billId2 = 'bill-pos-1002';
      const bill2 = {
        id: billId2,
        bill_number: '#UB-10493',
        store_id: 'store-blr-indiranagar',
        cashier_id: 'user-admin-1',
        customer_name: 'Ananya Rao',
        customer_phone: '+91 97412 88441',
        customer_email: 'ananya.rao@outlook.com',
        payment_method: 'CARD',
        subtotal: 4999.00,
        tax_amount: 250.00,
        discount_amount: 0.00,
        total_amount: 5249.00,
        notes: 'Saffiano leather tote purchase',
        status: 'PAID',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      };
      mockDb.offline_bills.push(bill2);
      mockDb.offline_bill_items.push({
        id: 'bi-2',
        bill_id: billId2,
        product_id: 'prod-handbag-saffiano-tote',
        quantity: 1,
        unit_price: 4999.00,
        total_price: 4999.00,
        size: 'Medium',
      });
    }

    // 6. Seed Sample Orders (including a delivered clothing order eligible for 7-day return)
    if (mockDb.orders.length === 0) {
      const order1 = {
        id: 'ord-delivered-sample-1',
        order_number: '#UB89410',
        user_id: 'user-customer-1',
        store_id: 'store-blr-indiranagar',
        delivery_type: 'instant_30min',
        status: 'DELIVERED',
        subtotal: 6499.00,
        delivery_fee: 0.00,
        total_amount: 6499.00,
        eta_minutes: 0,
        customer_name: 'Pooja Hegde',
        customer_email: 'customer@urbanstore.in',
        delivery_address: 'Flat 402, Green Palms, 12th Main, 100ft Rd, Indiranagar',
        delivery_lat: 12.9719,
        delivery_lng: 77.6412,
        distance_km: 0.8,
        co2_kg: 0.08,
        language: 'kn',
        created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // Delivered 3 days ago: ELIGIBLE FOR 7-DAY RETURN!
        updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 1800000).toISOString(),
      };
      mockDb.orders.push(order1);
      mockDb.order_items.push({
        id: 'oi-sample-1',
        order_id: order1.id,
        product_id: 'prod-clothes-wool-blazer',
        store_id: 'store-blr-indiranagar',
        quantity: 1,
        unit_price: 6499.00,
        total_price: 6499.00,
        size: '40R',
      });
    }

    // 7. Seed Sample Lost Opportunity Searches
    if (mockDb.lost_opportunities.length === 0) {
      mockDb.lost_opportunities.push(
        {
          id: 'lo-1',
          query: 'Rolex Submariner Gold Watch',
          normalized_query: 'rolex submariner gold watch',
          category_id: 'cat-watches',
          product_id: null,
          product_name: 'Rolex Luxury Diver Watch',
          search_count: 38,
          estimated_lost_revenue: 380000.00,
          last_searched_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        },
        {
          id: 'lo-2',
          query: 'Balenciaga Triple S Chunky Sneakers',
          normalized_query: 'balenciaga triple s chunky sneakers',
          category_id: 'cat-shoes',
          product_id: null,
          product_name: 'Designer Chunky Platform Sneakers',
          search_count: 24,
          estimated_lost_revenue: 120000.00,
          last_searched_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
        {
          id: 'lo-3',
          query: 'Prada Re-Edition Nylon Shoulder Bag',
          normalized_query: 'prada re-edition nylon shoulder bag',
          category_id: 'cat-handbags',
          product_id: null,
          product_name: 'Nylon Y2K Shoulder Bag',
          search_count: 19,
          estimated_lost_revenue: 95000.00,
          last_searched_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        }
      );
    }

    // 8. Seed Sample Customer Requests
    if (mockDb.customer_requests.length === 0) {
      mockDb.customer_requests.push(
        {
          id: 'req-sample-1',
          request_number: '#REQ-201',
          request_type: 'RETURN',
          user_id: 'user-customer-1',
          order_id: 'ord-delivered-sample-1',
          product_id: 'prod-clothes-wool-blazer',
          customer_name: 'Pooja Hegde',
          customer_phone: '+91 98450 12345',
          customer_email: 'customer@urbanstore.in',
          reason: 'Need size exchange from 40R to 38R. Shoulders slightly wide.',
          refund_amount: 6499.00,
          status: 'pending',
          admin_notes: 'Eligible 7-day return. Garment tag intact.',
          created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        },
        {
          id: 'req-sample-2',
          request_number: '#REQ-202',
          request_type: 'RESTOCK_ALERT',
          user_id: 'user-customer-1',
          order_id: null,
          product_id: 'prod-clothes-selvedge-denim',
          customer_name: 'Aditya Rao',
          customer_phone: '+91 97410 22334',
          customer_email: 'aditya.rao@gmail.com',
          reason: 'Please notify when size 32 is back in stock at Indiranagar store.',
          refund_amount: 0.00,
          status: 'pending',
          admin_notes: '',
          created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        }
      );
    }

    console.log('[Seed] Urban Store Fashion catalog seeded successfully! (7 Stores, 6 Categories, 15 Products)');
  } catch (err) {
    console.warn('[Seed] Seed warning:', err.message);
  }
}

if (process.argv[1]?.endsWith('seedData.js')) {
  seedInitialDataIfEmpty().then(() => process.exit(0)).catch(err => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
}
