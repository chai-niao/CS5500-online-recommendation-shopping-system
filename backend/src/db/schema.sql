-- ============================================================
-- AI Hypermarket — PostgreSQL Schema
-- ============================================================

DROP TABLE IF EXISTS shopping_list_items CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS festivals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users
CREATE TABLE users (
  id                  VARCHAR(50) PRIMARY KEY,
  email               VARCHAR(255) UNIQUE NOT NULL,
  password            VARCHAR(255) NOT NULL,
  name                VARCHAR(255) NOT NULL,
  phone               VARCHAR(50) DEFAULT '',
  age_range           VARCHAR(20) DEFAULT '',
  preferred_language  VARCHAR(50) DEFAULT 'English',
  cultural_interests  TEXT[] DEFAULT '{}',
  dietary_preferences TEXT[] DEFAULT '{}',
  loyalty_tier        VARCHAR(20) DEFAULT 'Bronze',
  loyalty_points      INTEGER DEFAULT 0,
  order_history       TEXT[] DEFAULT '{}',
  created_at          DATE DEFAULT CURRENT_DATE
);

-- User addresses (1:N)
CREATE TABLE user_addresses (
  id         VARCHAR(50) PRIMARY KEY,
  user_id    VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      VARCHAR(100),
  street     VARCHAR(255),
  city       VARCHAR(100),
  state      VARCHAR(50),
  zip        VARCHAR(20),
  is_default BOOLEAN DEFAULT false
);

-- Shopping carts (1:1 with user)
CREATE TABLE carts (
  id         SERIAL PRIMARY KEY,
  user_id    VARCHAR(50) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart items
CREATE TABLE cart_items (
  id         SERIAL PRIMARY KEY,
  cart_id    INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1,
  UNIQUE(cart_id, product_id)
);

-- Orders
CREATE TABLE orders (
  id                    VARCHAR(50) PRIMARY KEY,
  user_id               VARCHAR(50) NOT NULL REFERENCES users(id),
  status                VARCHAR(50) DEFAULT 'Processing',
  subtotal              DECIMAL(10,2),
  discount              DECIMAL(10,2) DEFAULT 0,
  loyalty_points_earned INTEGER DEFAULT 0,
  total                 DECIMAL(10,2),
  shipping_address      TEXT,
  payment_method        VARCHAR(100),
  created_at            DATE DEFAULT CURRENT_DATE,
  delivered_at          DATE
);

-- Order line items
CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL,
  name       VARCHAR(255),
  quantity   INTEGER NOT NULL,
  price      DECIMAL(10,2) NOT NULL
);

-- Shopping lists
CREATE TABLE shopping_lists (
  id               VARCHAR(50) PRIMARY KEY,
  user_id          VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  created_at       DATE DEFAULT CURRENT_DATE,
  synced_to_device BOOLEAN DEFAULT false,
  last_synced      TIMESTAMPTZ
);

-- Shopping list items
CREATE TABLE shopping_list_items (
  id         SERIAL PRIMARY KEY,
  list_id    VARCHAR(50) NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL,
  name       VARCHAR(255),
  checked    BOOLEAN DEFAULT false
);

-- Festivals
CREATE TABLE festivals (
  id          VARCHAR(50) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  emoji       VARCHAR(10),
  date        DATE,
  tags        TEXT[] DEFAULT '{}',
  color       VARCHAR(20),
  description TEXT
);

-- Promotions
CREATE TABLE promotions (
  id          VARCHAR(50) PRIMARY KEY,
  code        VARCHAR(50) UNIQUE NOT NULL,
  discount    DECIMAL(10,2) NOT NULL,
  type        VARCHAR(20) NOT NULL,
  description TEXT,
  min_order   DECIMAL(10,2) DEFAULT 0,
  active      BOOLEAN DEFAULT true
);
