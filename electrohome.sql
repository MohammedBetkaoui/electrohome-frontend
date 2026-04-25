-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : sam. 25 avr. 2026 à 13:28
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `electrohome`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `type`, `title`, `message`, `payload`, `created_at`, `updated_at`) VALUES
(30, 'order', 'Nouvelle commande ', 'adem adem a passe une commande de 160 000 DA. Produit: Aspirateur Robot S7 MaxV.', '{\"order_id\":33,\"order_number\":null,\"user_id\":3}', '2026-04-22 19:25:16', '2026-04-22 19:25:16'),
(31, 'order', 'Nouvelle commande ', 'adem adem a passe une commande de 80 000 DA. Produit: Aspirateur Robot S7 MaxV.', '{\"order_id\":34,\"order_number\":null,\"user_id\":3}', '2026-04-22 19:53:25', '2026-04-22 19:53:25'),
(32, 'client', 'Nouveau client inscrit', 'betkaoui mohammed vient de creer un compte.', '{\"user_id\":7,\"email\":\"mohammed@univ-bba.dz\"}', '2026-04-23 19:20:42', '2026-04-23 19:20:42');

-- --------------------------------------------------------

--
-- Structure de la table `admin_notification_reads`
--

CREATE TABLE `admin_notification_reads` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `admin_notification_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `blog_posts`
--

CREATE TABLE `blog_posts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` longtext NOT NULL,
  `category` varchar(120) NOT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `author` varchar(120) NOT NULL,
  `status` enum('published','draft','scheduled','archived') NOT NULL DEFAULT 'draft',
  `image` varchar(2048) DEFAULT NULL,
  `views` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `comments_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `read_time` smallint(5) UNSIGNED NOT NULL DEFAULT 5,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `blog_posts`
--

INSERT INTO `blog_posts` (`id`, `title`, `slug`, `excerpt`, `content`, `category`, `tags`, `author`, `status`, `image`, `views`, `comments_count`, `read_time`, `featured`, `published_at`, `created_at`, `updated_at`) VALUES
(1, 'Découvrez tous les critères essentiels pour trouver le réfrigérateur parfait pour votre foyer.', 'decouvrez-tous-les-criteres-essentiels-pour-trouver-le-refrigerateur-parfait-pour-votre-foyer', 'Découvrez tous', 'Découvrez tous les critères essentiels pour trouver le réfrigérateur parfait pour votre foyer. \r\nDécouvrez tous les critères essentiels pour trouver le réfrigérateur parfait pour votre foyer. \r\nDécouvrez tous les critères essentiels pour trouver le réfrigérateur parfait pour votre foyer. \r\nDécouvrez tous les critères essentiels pour trouver le réfrigérateur parfait pour votre foyer. \r\nDécouvrez tous les critères essentiels pour trouver le réfrigérateur parfait pour votre foyer. \r\nDécouvrez tous les critères essentiels pour trouver le réfrigérateur parfait pour votre foyer.', 'Entretien', '[\"D\\u00e9couvrez tous\"]', 'betkaoui mohammed', 'published', 'http://localhost:8000/storage/blog/38wsKrkVY3ZORVxf7rWd5L5PAAQ5iUHuRngohZGk.jpg', 5, 0, 4, 1, '2026-04-16 11:11:00', '2026-04-16 12:11:28', '2026-04-16 12:33:11');

-- --------------------------------------------------------

--
-- Structure de la table `brands`
--

CREATE TABLE `brands` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `brands`
--

INSERT INTO `brands` (`id`, `name`, `slug`, `logo_url`) VALUES
(1, 'Samsung', 'samsung', NULL),
(2, 'LG', 'lg', NULL),
(3, 'Bosch', 'bosch', NULL),
(4, 'Whirlpool', 'whirlpool', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `carts`
--

CREATE TABLE `carts` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `session_id` varchar(128) DEFAULT NULL,
  `promo_code_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `cart_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `added_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `description` text DEFAULT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `icon` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `created_at`, `description`, `parent_id`, `is_active`, `is_enabled`, `sort_order`, `icon`) VALUES
(1, 'Réfrigérateurs', 'refrigerateurs', '2026-03-29 16:49:06', NULL, NULL, 1, 1, 0, NULL),
(2, 'Lave-linge', 'lave-linge', '2026-03-29 16:49:06', NULL, NULL, 1, 1, 0, NULL),
(3, 'Lave-vaisselle', 'lave-vaisselle', '2026-03-29 16:49:06', NULL, NULL, 1, 1, 0, NULL),
(4, 'Fours', 'fours', '2026-03-29 16:49:06', NULL, NULL, 1, 1, 0, NULL),
(5, 'Micro-ondes', 'micro-ondes', '2026-03-29 16:49:06', NULL, NULL, 1, 1, 0, NULL),
(6, 'Climatiseurs', 'climatiseurs', '2026-03-29 16:49:06', NULL, NULL, 1, 1, 0, NULL),
(7, 'Téléviseurs', 'televiseurs', '2026-03-29 16:49:06', NULL, NULL, 1, 1, 0, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `delivery_methods`
--

CREATE TABLE `delivery_methods` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `delay_min` tinyint(3) UNSIGNED DEFAULT NULL,
  `delay_max` tinyint(3) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Données de la table `delivery_methods` (méthode unique)
--

INSERT INTO `delivery_methods` (`id`, `name`, `label`, `description`, `price`, `delay_min`, `delay_max`, `is_active`) VALUES
(1, 'standard', 'Livraison standard', 'Livraison à domicile ou en agence', 0.00, 3, 7, 1);

-- --------------------------------------------------------

--
-- Structure de la table `favorites`
--

CREATE TABLE `favorites` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_03_29_173222_create_personal_access_tokens_table', 1),
(2, '2026_03_29_175004_create_sessions_table', 2),
(3, '2026_03_30_000001_add_tracking_number_to_orders_table', 3),
(4, '2026_04_01_133423_add_soft_deletes_to_products_table', 4),
(5, '2026_04_01_120000_add_delivery_return_reasons', 5),
(6, '2026_04_02_120001_add_client_status_fields_to_users_table', 6),
(7, '2026_04_04_120000_create_admin_notifications_tables', 7),
(8, '2026_04_14_130000_create_or_update_reviews_tables', 8),
(9, '2026_04_16_120000_create_blog_posts_table', 9),
(10, '2026_04_18_120000_create_store_settings_table', 10),
(11, '2026_04_22_100000_create_wilayas_and_product_weight', 11),
(12, '2026_04_22_200000_add_delivery_agency_and_weight_pricings', 12);

-- --------------------------------------------------------

--
-- Structure de la table `oauth_providers`
--

CREATE TABLE `oauth_providers` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `provider` enum('google','apple') NOT NULL,
  `provider_id` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_number` varchar(20) NOT NULL,
  `tracking_number` varchar(255) DEFAULT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `shipping_address_id` int(10) UNSIGNED NOT NULL,
  `delivery_method_id` tinyint(3) UNSIGNED DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `delivery_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_ttc` decimal(10,2) NOT NULL,
  `promo_code_id` int(10) UNSIGNED DEFAULT NULL,
  `payment_method` enum('cash_on_delivery') NOT NULL DEFAULT 'cash_on_delivery',
  `payment_status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL,
  `status` enum('pending','confirmed','processing','shipped','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
  `estimated_delivery` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `orders`
--
DELIMITER $$
CREATE TRIGGER `trg_order_number` BEFORE INSERT ON `orders` FOR EACH ROW BEGIN
  SET NEW.order_number = CONCAT(
    'EH-',
    YEAR(NOW()),
    '-',
    LPAD((SELECT COUNT(*) + 1 FROM orders), 4, '0')
  );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_brand` varchar(100) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `status` enum('pending','confirmed','processing','shipped','delivered','cancelled','returned') NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(8, 'App\\Models\\User', 3, 'register', '77fcee1f3e1943199a01124c231b3c9c1fdb6cf22952ae93a1221d7252104256', '[\"*\"]', '2026-03-29 20:45:29', NULL, '2026-03-29 19:53:05', '2026-03-29 20:45:29'),
(22, 'App\\Models\\User', 4, 'register', '8bacd15853ac813dee9138547d8d2af259a41565de15fb89a597169ea935b7f2', '[\"*\"]', '2026-04-06 20:42:38', NULL, '2026-04-04 15:51:19', '2026-04-06 20:42:38'),
(30, 'App\\Models\\User', 1, 'login', 'ac2caa89739e7d0d86364a8079ffa5fc115d17a486d8c9c02566d86ce135c90b', '[\"*\"]', '2026-04-18 23:52:54', NULL, '2026-04-18 23:03:51', '2026-04-18 23:52:54'),
(32, 'App\\Models\\User', 1, 'login', '04149bcef149b51336ce6b6fcce68668484ae9f9aa76cbd463d3b1a8aaf28f5f', '[\"*\"]', '2026-04-19 00:02:29', NULL, '2026-04-18 23:16:03', '2026-04-19 00:02:29'),
(33, 'App\\Models\\User', 1, 'login', '39f508db27cd7750e8077ede0db3f70b6915963d2c301bb94f759dc421f53a60', '[\"*\"]', '2026-04-22 21:09:38', NULL, '2026-04-19 09:45:21', '2026-04-22 21:09:38'),
(35, 'App\\Models\\User', 3, 'login', 'bf829bc42898623334d2ecafc131a847918c59a95eb6c96408cde2f04a933550', '[\"*\"]', '2026-04-22 14:57:30', NULL, '2026-04-22 09:49:05', '2026-04-22 14:57:30'),
(36, 'App\\Models\\User', 3, 'login', '8167eb6f20ce61854b112e63878c92064c4cabfcb1902aeea2feba87a25789df', '[\"*\"]', '2026-04-22 21:01:46', NULL, '2026-04-22 19:24:36', '2026-04-22 21:01:46'),
(37, 'App\\Models\\User', 3, 'login', 'a64c6c2cc6c9b97f526302ba0d1cba8707332d88ce4933f44e40cfb4d60ea7fd', '[\"*\"]', '2026-04-23 19:45:15', NULL, '2026-04-22 21:09:35', '2026-04-23 19:45:15'),
(38, 'App\\Models\\User', 7, 'register', 'f3b15eda4b97ebfcc8af7bd241d3d62b2927d2d31241bdb1e35b6f34538c5f58', '[\"*\"]', '2026-04-23 19:23:32', NULL, '2026-04-23 19:20:45', '2026-04-23 19:23:32');

-- --------------------------------------------------------

--
-- Structure de la table `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `brand_id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `old_price` decimal(10,2) DEFAULT NULL,
  `energy_class` varchar(10) DEFAULT NULL,
  `specs` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','draft','outofstock') NOT NULL DEFAULT 'active',
  `color` varchar(100) DEFAULT NULL,
  `warranty_years` tinyint(3) UNSIGNED NOT NULL DEFAULT 2,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `weight_kg` decimal(8,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `products`
--

INSERT INTO `products` (`id`, `slug`, `name`, `sku`, `brand_id`, `category_id`, `price`, `old_price`, `energy_class`, `specs`, `description`, `status`, `color`, `warranty_years`, `stock`, `weight_kg`, `is_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(5, 'test-69cd2c077b874', 'test', 'test123', 1, 1, 130000.00, 200000.00, 'A', 'q, q , a, s', 'test', 'active', NULL, 2, 20, NULL, 1, '2026-04-01 14:30:31', '2026-04-01 14:32:50', '2026-04-01 13:32:50'),
(6, 'climatiseur-mobile-9000-btu-69cd2f50371dd', 'Climatiseur Mobile 9000 BTU', 'LG-MOB9-012', 2, 6, 140000.00, 169000.00, 'A+', '12000 BTU, R32, Wi-Fi', 'Le Climatiseur Mural Inverter de LG combine performance exceptionnelle et design élégant. Conçu pour répondre aux exigences des foyers modernes, cet appareil allie technologie de pointe et efficacité énergétique.\r\n\r\nDoté de fonctionnalités intelligentes et d\'une construction premium, il s\'intègre parfaitement dans votre intérieur tout en offrant des performances remarquables au quotidien.', 'active', NULL, 2, 64, NULL, 1, '2026-04-01 14:44:32', '2026-04-14 21:06:04', NULL),
(7, 'tv-oled-55-c3-69d6244a2ed5b', 'TV OLED 55\" C3', 'LG-TV-C3', 2, 7, 203000.00, NULL, 'G', '4K, 120Hz, Dolby Vision', 'Le TV OLED 55\" C3 de LG combine performance exceptionnelle et design élégant. Conçu pour répondre aux exigences des foyers modernes, cet appareil allie technologie de pointe et efficacité énergétique.\r\n\r\nDoté de fonctionnalités intelligentes et d\'une construction premium, il s\'intègre parfaitement dans votre intérieur tout en offrant des performances remarquables au quotidien.', 'active', NULL, 2, 19, NULL, 1, '2026-04-08 09:47:54', '2026-04-15 19:04:10', NULL),
(8, 'refrigerateur-multi-portes-rf23-69d624fa7f260', 'Réfrigérateur Multi-Portes RF23', 'SAM-RF23', 1, 1, 189000.00, 232000.00, 'A++', '634L, No Frost, A++', 'Le Réfrigérateur Multi-Portes RF23 de Samsung combine performance exceptionnelle et design élégant. Conçu pour répondre aux exigences des foyers modernes, cet appareil allie technologie de pointe et efficacité énergétique.\r\n\r\nDoté de fonctionnalités intelligentes et d\'une construction premium, il s\'intègre parfaitement dans votre intérieur tout en offrant des performances remarquables au quotidien.', 'active', NULL, 2, 25, NULL, 1, '2026-04-08 09:50:50', '2026-04-08 09:50:50', NULL),
(9, 'machine-a-expresso-automatique-69d625c2aed64', 'Machine à Expresso Automatique', NULL, 3, 2, 62100.00, 69000.00, 'A+', '15 bars, Broyeur intégré', NULL, 'active', NULL, 2, 26, NULL, 1, '2026-04-08 09:54:10', '2026-04-15 19:01:31', NULL),
(10, 'lave-linge-ecosilence-9kg-69d6262478eec', 'Lave-linge EcoSilence 9kg', NULL, 3, 2, 109000.00, NULL, 'A+++', '9kg, 1400tr/min, A+++', 'Le Lave-linge EcoSilence 9kg de Bosch combine performance exceptionnelle et design élégant. Conçu pour répondre aux exigences des foyers modernes, cet appareil allie technologie de pointe et efficacité énergétique.\r\n\r\nDoté de fonctionnalités intelligentes et d\'une construction premium, il s\'intègre parfaitement dans votre intérieur tout en offrant des performances remarquables au quotidien.', 'active', NULL, 2, 20, NULL, 1, '2026-04-08 09:55:48', '2026-04-08 09:55:48', NULL),
(11, 'lave-vaisselle-silence-plus-69d626b13e573', 'Lave-vaisselle Silence Plus', NULL, 1, 3, 174000.00, 210000.00, 'A+++', '14 couverts, 44dB, A+++', 'Le Lave-vaisselle Silence Plus de Miele combine performance exceptionnelle et design élégant. Conçu pour répondre aux exigences des foyers modernes, cet appareil allie technologie de pointe et efficacité énergétique.\r\n\r\nDoté de fonctionnalités intelligentes et d\'une construction premium, il s\'intègre parfaitement dans votre intérieur tout en offrant des performances remarquables au quotidien.', 'active', NULL, 2, 40, NULL, 1, '2026-04-08 09:58:09', '2026-04-08 09:58:09', NULL),
(12, 'aspirateur-robot-s7-maxv-69d6271d2e99b', 'Aspirateur Robot S7 MaxV', NULL, 1, 2, 80000.00, NULL, 'A', '5100Pa, LiDAR, Auto-vidage', 'Le Aspirateur Robot S7 MaxV de Roborock combine performance exceptionnelle et design élégant. Conçu pour répondre aux exigences des foyers modernes, cet appareil allie technologie de pointe et efficacité énergétique.\r\n\r\nDoté de fonctionnalités intelligentes et d\'une construction premium, il s\'intègre parfaitement dans votre intérieur tout en offrant des performances remarquables au quotidien.', 'active', NULL, 2, 26, NULL, 1, '2026-04-08 09:59:57', '2026-04-22 22:09:47', NULL),
(13, 'four-multifonction-pyrolyse-69d6277c2e79c', 'Four Multifonction Pyrolyse', NULL, 1, 4, 130000.00, NULL, 'A+', '71L, Pyrolyse, A+', 'Le Four Multifonction Pyrolyse de Siemens combine performance exceptionnelle et design élégant. Conçu pour répondre aux exigences des foyers modernes, cet appareil allie technologie de pointe et efficacité énergétique.\r\n\r\nDoté de fonctionnalités intelligentes et d\'une construction premium, il s\'intègre parfaitement dans votre intérieur tout en offrant des performances remarquables au quotidien.', 'active', NULL, 2, 31, 25.00, 1, '2026-04-08 10:01:32', '2026-04-22 20:54:40', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `product_images`
--

CREATE TABLE `product_images` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `url` varchar(500) NOT NULL,
  `position` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `is_main` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `url`, `position`, `is_main`) VALUES
(9, 5, 'products/Q9QYB2hmNAZGdZpaZNlng5KuL53A6RtTWRGGgZQa.jpg', 0, 1),
(10, 5, 'products/QW64u2SOExbejIqjriTrKiFdorLd0g7f9UVWi6to.jpg', 1, 0),
(11, 5, 'products/kFvwO6WFd8xU0jMJw39J1MrmJGLK0otW5Jmx8l72.jpg', 2, 0),
(12, 5, 'products/zkySPbdUCDuX0WsP14IrmdIi4hcDk0sPAuhacKtK.jpg', 3, 0),
(17, 7, 'products/79KykTCAuoxgPxZjDiKrr1GioqL1i5mX4HTZWxUn.jpg', 0, 1),
(18, 7, 'products/OaJC7e1ycmh29bPGdFXn5QjKtpEGhM9h7wxIL9HO.jpg', 1, 0),
(19, 7, 'products/HnaDeLfCcOARX566g3kHh8EGQnvyrlkVuJOs01OC.jpg', 2, 0),
(20, 7, 'products/w0lJQvGvjD3JWWlnx7gEejTpIQGf01ZE0yFRLT8z.jpg', 3, 0),
(21, 8, 'products/iuzIwOVkc0HfUUGgBXXt3Qb80XiVQiUe8YaWRMhx.jpg', 0, 1),
(22, 8, 'products/rStPqon3BcEGLQEheLSI1riYMxFcZBKvGo3G97eD.jpg', 1, 0),
(23, 8, 'products/8oYHOlPEBR0f14ld1Xqw27R774UG1FLyKK0xaNvw.jpg', 2, 0),
(24, 8, 'products/X0MHrNVXjIUmby8OY62mbEEVlZx6lBQrvFX7iK9x.jpg', 3, 0),
(25, 6, 'products/BwXzDvRzd2urAVDjX15v5WGbUM0NXFRKnVvYoDov.jpg', 0, 1),
(26, 6, 'products/RnkOTJdlB6pQKTlbZG4zIB84ghtzJwSiOuQUs6j9.jpg', 1, 0),
(27, 6, 'products/eXv5EuuT7D5AyCupPXSNSPclebvKoxyVwaAKLWCp.jpg', 2, 0),
(28, 6, 'products/GMSavvNGSIJDFob2r06czy14mgZ2cBq2nL1pu3wV.jpg', 3, 0),
(29, 10, 'products/OXK64dXeXnXvVjpg0pRg3xHCB1wOidulS5ESokUN.jpg', 0, 1),
(30, 10, 'products/vsascZmdye01p8fR2Ug2cLVpJtynzG0H9PcZAV6g.jpg', 1, 0),
(31, 10, 'products/zXSMzo52LYs0cUs6LC18YGOopp0D19UAsV8rkc14.jpg', 2, 0),
(32, 10, 'products/4Kb4rWkghfWovQFHA5g084XcXb1547CGJKoBFzXa.jpg', 3, 0),
(33, 9, 'products/Xx1oHbzEUPpWBDM4PjDNSQUbG7Ip8hHDQ11JK1gX.jpg', 0, 1),
(34, 9, 'products/FkR7Vz6kqBoxT9SMzYM5lMwFPSKov7jvBBqvPtYu.jpg', 1, 0),
(35, 9, 'products/3Jww1gyNCQTZTNQMQDlK4sXLT1Qe3RYKprPHAQi9.jpg', 2, 0),
(36, 9, 'products/P6lfoZxues48IjYwYUSsulYuc7pwnt64S82LLSBe.jpg', 3, 0),
(37, 11, 'products/TbadIBuYctNYK3MRMxL4Y27qxn0RMx2mmjsUoh2w.jpg', 0, 1),
(38, 11, 'products/3rGu0ISPK7Hai33LCUVdUy0cT7azigjnOYUrpTi4.jpg', 1, 0),
(39, 11, 'products/tBCI9nN4iu2haS9AG1BGfsk9WVo2ZFDktv70FFwh.jpg', 2, 0),
(40, 11, 'products/TRCK1J0nUernRWd92qzA6hjZMK2anon4c23HxkTI.jpg', 3, 0),
(41, 11, 'products/XaL6ApLNnSlfSpqY21vTIaPIn0dowDrBXazEYdC1.jpg', 4, 0),
(42, 12, 'products/MPGOfpYAM6egpgoutVuN1i37VPv0LKDMuQVEzpxd.jpg', 0, 1),
(43, 12, 'products/1Ow09ZUmFgmvqZzWcwwVhQTsLH9Ie3sEJwcJQx0b.jpg', 1, 0),
(44, 12, 'products/JQHdo0jqrThKkJS4hWIwBwglpYGdkMwujtySRdt0.jpg', 2, 0),
(45, 12, 'products/nfkaKt5ZQqdpjSCpnF7fW62BNX62OwOwq2le556A.jpg', 3, 0),
(46, 13, 'products/Fh64XVSTu9O5B4D9Lo1ckCq1VsjVI5myPRBPH46r.jpg', 0, 1),
(47, 13, 'products/S4YChhbZoDFQsjAUhUdzdWaq3FDf5vUaXrtXFi0N.jpg', 1, 0),
(48, 13, 'products/8XfraCj6023v84PvJPNJP1t4UEjo5QQnie7VnimZ.jpg', 2, 0),
(49, 13, 'products/MDNvG2CwXDkUo5I2Qm0deRPPgORaPJM4P5kvYzDh.jpg', 3, 0),
(50, 13, 'products/du1DATGN5WJZ771hXlWzid1rjwzYLOn0n8sjkrQR.jpg', 4, 0);

-- --------------------------------------------------------

--
-- Structure de la table `product_promotions`
--

CREATE TABLE `product_promotions` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `promotion_id` int(10) UNSIGNED NOT NULL,
  `old_price` decimal(10,2) NOT NULL,
  `promo_price` decimal(10,2) NOT NULL,
  `discount_pct` tinyint(3) UNSIGNED NOT NULL,
  `is_spotlight` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `product_promotions`
--
DELIMITER $$
CREATE TRIGGER `trg_discount_pct` BEFORE INSERT ON `product_promotions` FOR EACH ROW BEGIN
  SET NEW.discount_pct = ROUND((1 - NEW.promo_price / NEW.old_price) * 100);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `product_rating_summary`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `product_rating_summary` (
`product_id` int(10) unsigned
,`avg_rating` decimal(5,1)
,`review_count` bigint(21)
);

-- --------------------------------------------------------

--
-- Structure de la table `product_specs`
--

CREATE TABLE `product_specs` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `spec_key` varchar(100) NOT NULL,
  `spec_value` varchar(255) NOT NULL,
  `position` tinyint(3) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `promotions`
--

CREATE TABLE `promotions` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` enum('flash','daily','seasonal','category') NOT NULL DEFAULT 'flash',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `promotions`
--

INSERT INTO `promotions` (`id`, `title`, `type`, `starts_at`, `ends_at`, `is_active`, `created_at`) VALUES
(1, 'Ventes Flash Printemps', 'flash', '2026-03-29 00:00:00', '2026-03-29 23:59:59', 1, '2026-03-29 17:03:28'),
(2, 'Promotion du jour', 'daily', '2026-03-29 00:00:00', '2026-03-29 23:59:59', 1, '2026-03-29 17:03:28');

-- --------------------------------------------------------

--
-- Structure de la table `promo_codes`
--

CREATE TABLE `promo_codes` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `discount_value` decimal(10,2) NOT NULL,
  `min_order` decimal(10,2) DEFAULT NULL,
  `max_uses` int(10) UNSIGNED DEFAULT NULL,
  `used_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `promo_codes`
--

INSERT INTO `promo_codes` (`id`, `code`, `discount_type`, `discount_value`, `min_order`, `max_uses`, `used_count`, `expires_at`, `is_active`, `created_at`) VALUES
(1, 'BIENVENUE10', 'percent', 10.00, 20000.00, 100, 0, '2025-12-31 23:59:59', 1, '2026-03-29 16:54:12'),
(2, 'LIVRAISON', 'fixed', 4000.00, 50000.00, NULL, 0, NULL, 1, '2026-03-29 16:54:12'),
(3, 'SOLDES20', 'percent', 20.00, NULL, 50, 0, '2025-06-30 23:59:59', 1, '2026-03-29 16:54:12');

-- --------------------------------------------------------

--
-- Structure de la table `questions_answers`
--

CREATE TABLE `questions_answers` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `question` text NOT NULL,
  `answer` text DEFAULT NULL,
  `answered_by` int(10) UNSIGNED DEFAULT NULL,
  `answered_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `returns`
--

CREATE TABLE `returns` (
  `id` int(10) UNSIGNED NOT NULL,
  `return_number` varchar(20) NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `reason_id` int(10) UNSIGNED NOT NULL,
  `reason_detail` text DEFAULT NULL,
  `refund_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `refund_method` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','pickup','received','inspecting','refunded','rejected') NOT NULL DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `photos_count` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `returns`
--
DELIMITER $$
CREATE TRIGGER `trg_return_number` BEFORE INSERT ON `returns` FOR EACH ROW BEGIN
  SET NEW.return_number = CONCAT(
    'RET-',
    LPAD((SELECT COUNT(*) + 1 FROM returns), 4, '0')
  );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `return_items`
--

CREATE TABLE `return_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `return_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `return_photos`
--

CREATE TABLE `return_photos` (
  `id` int(10) UNSIGNED NOT NULL,
  `return_id` int(10) UNSIGNED NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `return_photos`
--
DELIMITER $$
CREATE TRIGGER `trg_photos_count` AFTER INSERT ON `return_photos` FOR EACH ROW BEGIN
  UPDATE returns
  SET photos_count = (
    SELECT COUNT(*) FROM return_photos WHERE return_id = NEW.return_id
  )
  WHERE id = NEW.return_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `return_reasons`
--

CREATE TABLE `return_reasons` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `return_reasons`
--

INSERT INTO `return_reasons` (`id`, `code`, `label`) VALUES
(1, 'defective', 'Produit défectueux'),
(2, 'wrong_item', 'Mauvais produit reçu'),
(3, 'damaged', 'Produit endommagé'),
(4, 'not_as_described', 'Non conforme à la description'),
(5, 'changed_mind', 'Changement d\'avis'),
(6, 'late_delivery', 'Livraison trop tardive'),
(7, 'refused_delivery', 'Refuse a la livraison'),
(8, 'customer_absent', 'Client absent');

-- --------------------------------------------------------

--
-- Structure de la table `return_status_history`
--

CREATE TABLE `return_status_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `return_id` int(10) UNSIGNED NOT NULL,
  `status` enum('pending','approved','pickup','received','inspecting','refunded','rejected') NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL CHECK (`rating` between 1 and 5),
  `title` varchar(191) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `helpful_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `reported_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `admin_notes` text DEFAULT NULL,
  `moderated_by` int(10) UNSIGNED DEFAULT NULL,
  `moderated_at` timestamp NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reviews`
--

INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `rating`, `title`, `comment`, `is_verified`, `status`, `helpful_count`, `reported_count`, `admin_notes`, `moderated_by`, `moderated_at`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 13, 3, 5, 'mon avis sur le produit', 'Excellent produit, très satisfaite de mon achat. La livraison était rapide et l\'installation facile', 1, 'rejected', 1, 1, NULL, 1, '2026-04-19 09:51:06', '2026-04-14 19:00:16', '2026-04-19 09:51:06', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `review_interactions`
--

CREATE TABLE `review_interactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `review_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `type` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `review_interactions`
--

INSERT INTO `review_interactions` (`id`, `review_id`, `user_id`, `type`, `created_at`, `updated_at`) VALUES
(1, 1, 6, 'helpful', '2026-04-14 18:03:43', '2026-04-14 18:03:43'),
(2, 1, 6, 'report', '2026-04-14 18:04:53', '2026-04-14 18:04:53');

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

CREATE TABLE `roles` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Accès complet à l\'administration'),
(2, 'user', 'Utilisateur standard');

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('5jOljU1sp8apHvHTePFeR3zJO6Ir5C1mpsDTDef4', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8115', 'eyJfdG9rZW4iOiI5b01FRGllTlJYUGdISHhQYTRBYkxhVlFhbTJ2OFNvZ0hBMVBjczhtIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1776974568),
('8SRc9Ws5F5hKK0wx61p7oYHHIrQmDEyGdsTLds6A', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8115', 'eyJfdG9rZW4iOiJuWDRXYUVoQjFmOVhuZnNiWnFUSzNXYlBmSmFFb1VWTkFDQXF5UTRxIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1776974313),
('FYD5ZHhyiKi4aUabnpUXjjeYEsFzgjVYoknXH2qI', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8115', 'eyJfdG9rZW4iOiIxNmlTbG1HWmFxVUd1N2hPMGxSck81SDd5ajdxOFZLSGQ1MWtpWTBhIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1774993895),
('GtOG9LkAxnVhYrw3uuCMcxjC44wNZ1FWuRhslyNQ', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8115', 'eyJfdG9rZW4iOiJGNlNJbnJQbDlYTkhsc3Vqc3k3V3hTSDZyRDBjSXZYbHNkMUI5YjFmIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1776975086),
('Iyw5jA0PCpxMTdH6hD4GmSQSGP6QaEdqs3cwTzxm', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8115', 'eyJfdG9rZW4iOiJXWTkzMDlJM0hNTEZ6aGxpcWFMandPUHlNbjU2d3UxQTNjNkxwU3F5IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1776974785),
('lRwNc30eM7CcEtrrozAPDD95jHMslC1Xs7QVmH2Y', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJoYm5WTUNMOU5UamZZTldCVUtHNE56R2M3S2tkcWt1YVl4dHdUb1FRIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1774806659),
('mfpGmIOhpI9nhtUfPWo5EaQPeZPNAvGhZgfdaEyc', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJOZEVPN2draTFEQTd6c2lmbVdua0VteHNBNjJiY2NadHNqNkJ2VEhqIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1774815645),
('tlgYSm2QMaTtoQJyffGigy8rgnifGe9X9QuGqgeo', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8115', 'eyJfdG9rZW4iOiJJaDB2SlQyT3lyamNhNmhvNVFCYnhvUzlWclBoUmhOc1lSOGhzUkVDIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1774993904),
('YkXik0RBI5WVEepLKpDWz0x8WMyPQymiItvydSgy', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8115', 'eyJfdG9rZW4iOiI4b0xtSkVUTHpwUGRFVnpOdzNxbFR1aVVXYWo1bGRyblFBYlZrZzExIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1776975825);

-- --------------------------------------------------------

--
-- Structure de la table `shipping_addresses`
--

CREATE TABLE `shipping_addresses` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `address` varchar(255) NOT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `wilaya_id` tinyint(3) UNSIGNED DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `store_settings`
--

CREATE TABLE `store_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `shop_name` varchar(191) NOT NULL DEFAULT 'ElectroHome',
  `support_email` varchar(191) NOT NULL DEFAULT 'support@electrohome.dz',
  `phone` varchar(50) NOT NULL DEFAULT '+213 35 68 12 34',
  `whatsapp` varchar(255) NOT NULL DEFAULT '+213 555 00 00 00',
  `address` text DEFAULT NULL,
  `facebook` varchar(2048) NOT NULL DEFAULT 'https://facebook.com/electrohome.dz',
  `instagram` varchar(2048) NOT NULL DEFAULT 'https://instagram.com/electrohome.dz',
  `tiktok` varchar(2048) NOT NULL DEFAULT 'https://tiktok.com/@electrohome.dz',
  `youtube` varchar(2048) NOT NULL DEFAULT 'https://youtube.com/@electrohome-dz',
  `working_days` varchar(191) NOT NULL DEFAULT 'Lundi - Samedi',
  `opening_time` varchar(10) NOT NULL DEFAULT '09:00',
  `closing_time` varchar(10) NOT NULL DEFAULT '19:00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `store_settings`
--

INSERT INTO `store_settings` (`id`, `code`, `shop_name`, `support_email`, `phone`, `whatsapp`, `address`, `facebook`, `instagram`, `tiktok`, `youtube`, `working_days`, `opening_time`, `closing_time`, `created_at`, `updated_at`) VALUES
(1, 'default', 'Electro', 'support@electrohome.dz', '+213 35 68 12 34', '+213 555 00 00 00', 'Rue Mohamed Boudiaf, Centre-ville, Bordj Bou Arreridj 34000', 'https://facebook.com/electrohome.dz', 'https://instagram.com/electrohome.dz', 'https://tiktok.com/@electrohome.dz', 'https://youtube.com/@electrohome-dz', 'Lundi - Samedi', '09:00', '19:00', '2026-04-18 22:42:03', '2026-04-18 22:44:07');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `client_status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
  `admin_notes` text DEFAULT NULL,
  `role_id` tinyint(3) UNSIGNED NOT NULL DEFAULT 2,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `is_verified`, `client_status`, `admin_notes`, `role_id`, `created_at`, `updated_at`) VALUES
(1, 'betkaoui', 'mohammed', 'betkaoui@email.com', '$2y$12$X9NI9WU1zLkSEPFYjpk04uTUJ8i3O6UlnWk/8YF9n55dK3Sk3XpUC', 0, 'active', NULL, 1, '2026-03-29 20:27:09', '2026-04-19 00:07:06'),
(3, 'adem', 'adem', 'adem@gmail.com', '$2y$12$DfYC.V.lthEAYbNcqBcrtOvIDndxxT9Wf6nix4L9pVoG6R8/unVEm', 0, 'active', NULL, 2, '2026-03-29 20:53:04', '2026-04-02 23:50:53'),
(4, 'kamel', 'betkaoui', 'mohammed.betkaoui@univ-bba.dz', '$2y$12$1GIORNkqpje4ucim3PtY3e8wgRMRxuWLvN8Mc3b6AsWIPekYXSq8y', 0, 'active', NULL, 2, '2026-04-04 16:51:17', '2026-04-04 16:51:17'),
(5, 'betkaoui', 'mohammed', 'mohammed.betkaoui@gmail.com', '$2y$12$I7hgte3z7DG9tPPAhF10/uPwVfB2VkrIFgDyrefSxNizXahii7whm', 0, 'active', NULL, 2, '2026-04-08 09:43:36', '2026-04-08 09:43:36'),
(6, 'kamel', 'ahmed', 'kamel@univ-bba.dz', '$2y$12$v6pLcq2eAlXHH/A22fKDnuAieiHwZkLE43Pe8vI3p5szbDIDIpPSG', 0, 'blocked', NULL, 2, '2026-04-14 19:03:03', '2026-04-22 22:00:24'),
(7, 'betkaoui', 'mohammed', 'mohammed@univ-bba.dz', '$2y$12$OqBFT2boqXMADigmCEsDh.v4zB4zB2oa1i9HlBoRf5dRgu.diZoWi', 0, 'active', NULL, 2, '2026-04-23 20:20:42', '2026-04-23 20:20:42');

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_cart_summary`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_cart_summary` (
);

-- --------------------------------------------------------

--
-- Structure de la table `weight_pricings`
--

CREATE TABLE `weight_pricings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `max_weight_kg` decimal(8,2) NOT NULL COMMENT 'Poids maximum (kg) pour ce tarif',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Frais supplémentaires pour ce palier de poids',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `weight_pricings`
--

INSERT INTO `weight_pricings` (`id`, `max_weight_kg`, `price`, `created_at`, `updated_at`) VALUES
(1, 45.60, 500.00, '2026-04-22 20:26:29', '2026-04-22 20:26:29');

-- --------------------------------------------------------

--
-- Structure de la table `wilayas`
--

CREATE TABLE `wilayas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `delivery_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `delivery_price_agency` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix livraison au bureau de l''agence de livraison',
  `delivery_price_heavy` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prix si poids total > 20kg',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `wilayas`
--

INSERT INTO `wilayas` (`id`, `name`, `delivery_price`, `delivery_price_agency`, `delivery_price_heavy`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 'alger', 850.00, 700.00, 0.00, 1, '2026-04-22 20:25:20', '2026-04-22 20:25:20');

-- --------------------------------------------------------

--
-- Structure de la vue `product_rating_summary`
--
DROP TABLE IF EXISTS `product_rating_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `product_rating_summary`  AS SELECT `reviews`.`product_id` AS `product_id`, round(avg(`reviews`.`rating`),1) AS `avg_rating`, count(0) AS `review_count` FROM `reviews` GROUP BY `reviews`.`product_id` ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_cart_summary`
--
DROP TABLE IF EXISTS `v_cart_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_cart_summary`  AS SELECT `c`.`id` AS `cart_id`, `c`.`user_id` AS `user_id`, sum(`ci`.`quantity` * `ci`.`unit_price`) AS `subtotal`, `dr`.`free_threshold` AS `free_threshold`, `dr`.`standard_fee` AS `standard_fee`, CASE WHEN sum(`ci`.`quantity` * `ci`.`unit_price`) >= `dr`.`free_threshold` THEN 0 ELSE `dr`.`standard_fee` END AS `delivery_fee`, sum(`ci`.`quantity` * `ci`.`unit_price`) + CASE WHEN sum(`ci`.`quantity` * `ci`.`unit_price`) >= `dr`.`free_threshold` THEN 0 ELSE `dr`.`standard_fee` END AS `total_ttc` FROM ((`carts` `c` join `cart_items` `ci` on(`ci`.`cart_id` = `c`.`id`)) join `delivery_rules` `dr` on(`dr`.`id` = 1)) GROUP BY `c`.`id`, `c`.`user_id`, `dr`.`free_threshold`, `dr`.`standard_fee` ;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `admin_notification_reads`
--
ALTER TABLE `admin_notification_reads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `admin_notification_reads_unique` (`admin_notification_id`,`user_id`),
  ADD KEY `admin_notification_reads_user_id_foreign` (`user_id`);

--
-- Index pour la table `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blog_posts_slug_unique` (`slug`),
  ADD KEY `blog_posts_status_published_at_index` (`status`,`published_at`),
  ADD KEY `blog_posts_featured_status_index` (`featured`,`status`),
  ADD KEY `blog_posts_category_index` (`category`);

--
-- Index pour la table `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_brand_slug` (`slug`);

--
-- Index pour la table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cart_user` (`user_id`),
  ADD KEY `fk_cart_promo` (`promo_code_id`);

--
-- Index pour la table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cart_product` (`cart_id`,`product_id`),
  ADD KEY `fk_item_product` (`product_id`);

--
-- Index pour la table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_category_slug` (`slug`),
  ADD KEY `fk_category_parent` (`parent_id`);

--
-- Index pour la table `delivery_methods`
--
ALTER TABLE `delivery_methods`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`user_id`,`product_id`),
  ADD KEY `fk_fav_product` (`product_id`);

--
-- Index pour la table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `oauth_providers`
--
ALTER TABLE `oauth_providers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_oauth` (`provider`,`provider_id`),
  ADD KEY `fk_oauth_user` (`user_id`);

--
-- Index pour la table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_order_number` (`order_number`),
  ADD KEY `fk_order_user` (`user_id`),
  ADD KEY `fk_order_address` (`shipping_address_id`),
  ADD KEY `fk_order_delivery` (`delivery_method_id`),
  ADD KEY `fk_order_promo` (`promo_code_id`);

--
-- Index pour la table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_oi_order` (`order_id`),
  ADD KEY `fk_oi_product` (`product_id`);

--
-- Index pour la table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_history_order` (`order_id`);

--
-- Index pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_reset_token` (`token`),
  ADD KEY `fk_reset_user` (`user_id`);

--
-- Index pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Index pour la table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_product_slug` (`slug`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `fk_product_brand` (`brand_id`),
  ADD KEY `fk_product_category` (`category_id`);

--
-- Index pour la table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_img_product` (`product_id`);

--
-- Index pour la table `product_promotions`
--
ALTER TABLE `product_promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_product_promo` (`product_id`,`promotion_id`),
  ADD KEY `fk_pp_promotion` (`promotion_id`);

--
-- Index pour la table `product_specs`
--
ALTER TABLE `product_specs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_spec_product` (`product_id`);

--
-- Index pour la table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `promo_codes`
--
ALTER TABLE `promo_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_promo_code` (`code`);

--
-- Index pour la table `questions_answers`
--
ALTER TABLE `questions_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_qa_product` (`product_id`),
  ADD KEY `fk_qa_user` (`user_id`),
  ADD KEY `fk_qa_admin` (`answered_by`);

--
-- Index pour la table `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_return_number` (`return_number`),
  ADD KEY `fk_return_order` (`order_id`),
  ADD KEY `fk_return_user` (`user_id`),
  ADD KEY `fk_return_reason` (`reason_id`);

--
-- Index pour la table `return_items`
--
ALTER TABLE `return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ri_return` (`return_id`),
  ADD KEY `fk_ri_product` (`product_id`);

--
-- Index pour la table `return_photos`
--
ALTER TABLE `return_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_photo_return` (`return_id`);

--
-- Index pour la table `return_reasons`
--
ALTER TABLE `return_reasons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_reason_code` (`code`);

--
-- Index pour la table `return_status_history`
--
ALTER TABLE `return_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_rsh_return` (`return_id`);

--
-- Index pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_one_review` (`product_id`,`user_id`),
  ADD KEY `fk_review_user` (`user_id`);

--
-- Index pour la table `review_interactions`
--
ALTER TABLE `review_interactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_review_user_type` (`review_id`,`user_id`,`type`),
  ADD KEY `idx_review_interactions_review_type` (`review_id`,`type`),
  ADD KEY `fk_review_interaction_user` (`user_id`);

--
-- Index pour la table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_role_name` (`name`);

--
-- Index pour la table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Index pour la table `shipping_addresses`
--
ALTER TABLE `shipping_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_address_user` (`user_id`),
  ADD KEY `fk_address_wilaya` (`wilaya_id`);

--
-- Index pour la table `store_settings`
--
ALTER TABLE `store_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `store_settings_code_unique` (`code`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD KEY `fk_user_role` (`role_id`);

--
-- Index pour la table `weight_pricings`
--
ALTER TABLE `weight_pricings`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `wilayas`
--
ALTER TABLE `wilayas`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT pour la table `admin_notification_reads`
--
ALTER TABLE `admin_notification_reads`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT pour la table `blog_posts`
--
ALTER TABLE `blog_posts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `delivery_methods`
--
ALTER TABLE `delivery_methods`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `oauth_providers`
--
ALTER TABLE `oauth_providers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT pour la table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT pour la table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT pour la table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT pour la table `product_promotions`
--
ALTER TABLE `product_promotions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `product_specs`
--
ALTER TABLE `product_specs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `promo_codes`
--
ALTER TABLE `promo_codes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `questions_answers`
--
ALTER TABLE `questions_answers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `returns`
--
ALTER TABLE `returns`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `return_items`
--
ALTER TABLE `return_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `return_photos`
--
ALTER TABLE `return_photos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `return_reasons`
--
ALTER TABLE `return_reasons`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `return_status_history`
--
ALTER TABLE `return_status_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `review_interactions`
--
ALTER TABLE `review_interactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `shipping_addresses`
--
ALTER TABLE `shipping_addresses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `store_settings`
--
ALTER TABLE `store_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `weight_pricings`
--
ALTER TABLE `weight_pricings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `wilayas`
--
ALTER TABLE `wilayas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `admin_notification_reads`
--
ALTER TABLE `admin_notification_reads`
  ADD CONSTRAINT `admin_notification_reads_admin_notification_id_foreign` FOREIGN KEY (`admin_notification_id`) REFERENCES `admin_notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_notification_reads_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `fk_cart_promo` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_item_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `fk_fav_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `oauth_providers`
--
ALTER TABLE `oauth_providers`
  ADD CONSTRAINT `fk_oauth_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `shipping_addresses` (`id`),
  ADD CONSTRAINT `fk_order_delivery` FOREIGN KEY (`delivery_method_id`) REFERENCES `delivery_methods` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_order_promo` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Contraintes pour la table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_product_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Contraintes pour la table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_img_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `product_promotions`
--
ALTER TABLE `product_promotions`
  ADD CONSTRAINT `fk_pp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pp_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `product_specs`
--
ALTER TABLE `product_specs`
  ADD CONSTRAINT `fk_spec_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `questions_answers`
--
ALTER TABLE `questions_answers`
  ADD CONSTRAINT `fk_qa_admin` FOREIGN KEY (`answered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_qa_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_qa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `returns`
--
ALTER TABLE `returns`
  ADD CONSTRAINT `fk_return_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `fk_return_reason` FOREIGN KEY (`reason_id`) REFERENCES `return_reasons` (`id`),
  ADD CONSTRAINT `fk_return_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `return_items`
--
ALTER TABLE `return_items`
  ADD CONSTRAINT `fk_ri_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `fk_ri_return` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `return_photos`
--
ALTER TABLE `return_photos`
  ADD CONSTRAINT `fk_photo_return` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `return_status_history`
--
ALTER TABLE `return_status_history`
  ADD CONSTRAINT `fk_rsh_return` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_review_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `review_interactions`
--
ALTER TABLE `review_interactions`
  ADD CONSTRAINT `fk_review_interaction_review` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_review_interaction_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `shipping_addresses`
--
ALTER TABLE `shipping_addresses`
  ADD CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
