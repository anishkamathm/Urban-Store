-- Migration 003: Purge legacy ShopMart products, categories and invalid references

-- 1. Remove legacy items from cart_items
DELETE FROM cart_items WHERE product_id NOT IN (
  'prod-watch-rose-gold',
  'prod-watch-minimalist',
  'prod-watch-automatic-skeleton',
  'prod-shoes-chelsea-boots',
  'prod-shoes-white-sneakers',
  'prod-shoes-oxford-brogues',
  'prod-clothes-wool-blazer',
  'prod-clothes-silk-slip-dress',
  'prod-clothes-selvedge-denim',
  'prod-clothes-linen-shirt',
  'prod-handbag-saffiano-tote',
  'prod-handbag-crescent-moon',
  'prod-handbag-crescent-shoulder',
  'prod-handbag-quilted-crossbody',
  'prod-wallet-bifold-leather',
  'prod-wallet-commuter-backpack',
  'prod-wallet-zip-cardholder'
);

-- 2. Remove legacy items from store_inventory
DELETE FROM store_inventory WHERE product_id NOT IN (
  'prod-watch-rose-gold',
  'prod-watch-minimalist',
  'prod-watch-automatic-skeleton',
  'prod-shoes-chelsea-boots',
  'prod-shoes-white-sneakers',
  'prod-shoes-oxford-brogues',
  'prod-clothes-wool-blazer',
  'prod-clothes-silk-slip-dress',
  'prod-clothes-selvedge-denim',
  'prod-clothes-linen-shirt',
  'prod-handbag-saffiano-tote',
  'prod-handbag-crescent-moon',
  'prod-handbag-crescent-shoulder',
  'prod-handbag-quilted-crossbody',
  'prod-wallet-bifold-leather',
  'prod-wallet-commuter-backpack',
  'prod-wallet-zip-cardholder'
);

-- 3. Remove legacy items from order_items
DELETE FROM order_items WHERE product_id NOT IN (
  'prod-watch-rose-gold',
  'prod-watch-minimalist',
  'prod-watch-automatic-skeleton',
  'prod-shoes-chelsea-boots',
  'prod-shoes-white-sneakers',
  'prod-shoes-oxford-brogues',
  'prod-clothes-wool-blazer',
  'prod-clothes-silk-slip-dress',
  'prod-clothes-selvedge-denim',
  'prod-clothes-linen-shirt',
  'prod-handbag-saffiano-tote',
  'prod-handbag-crescent-moon',
  'prod-handbag-crescent-shoulder',
  'prod-handbag-quilted-crossbody',
  'prod-wallet-bifold-leather',
  'prod-wallet-commuter-backpack',
  'prod-wallet-zip-cardholder'
);

-- 4. Remove legacy non-fashion products
DELETE FROM products WHERE id NOT IN (
  'prod-watch-rose-gold',
  'prod-watch-minimalist',
  'prod-watch-automatic-skeleton',
  'prod-shoes-chelsea-boots',
  'prod-shoes-white-sneakers',
  'prod-shoes-oxford-brogues',
  'prod-clothes-wool-blazer',
  'prod-clothes-silk-slip-dress',
  'prod-clothes-selvedge-denim',
  'prod-clothes-linen-shirt',
  'prod-handbag-saffiano-tote',
  'prod-handbag-crescent-moon',
  'prod-handbag-crescent-shoulder',
  'prod-handbag-quilted-crossbody',
  'prod-wallet-bifold-leather',
  'prod-wallet-commuter-backpack',
  'prod-wallet-zip-cardholder'
);

-- 5. Remove legacy non-fashion categories (e.g., cat-groceries, cat-staples, cat-dairy, cat-snacks)
DELETE FROM categories WHERE id NOT IN (
  'cat-clothes',
  'cat-shoes',
  'cat-watches',
  'cat-handbags',
  'cat-wallets',
  'cat-accessories'
);
