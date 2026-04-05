-- MySQL dump 10.13  Distrib 9.4.0, for Win64 (x86_64)

--

-- Host: localhost    Database: game_distribution

-- ------------------------------------------------------

-- Server version	9.4.0



/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;

/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;

/*!50503 SET NAMES utf8mb4 */;

/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;

/*!40103 SET TIME_ZONE='+00:00' */;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;

/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;

/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;



--

-- Table structure for table `currency`

--



DROP TABLE IF EXISTS `currency`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `currency` (

  `currency_id` int NOT NULL AUTO_INCREMENT,

  `name` varchar(100) NOT NULL,

  PRIMARY KEY (`currency_id`),

  UNIQUE KEY `name` (`name`)

) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `currency`

--



LOCK TABLES `currency` WRITE;

/*!40000 ALTER TABLE `currency` DISABLE KEYS */;

INSERT INTO `currency` VALUES (2,'eur'),(3,'gbp'),(1,'usd');

/*!40000 ALTER TABLE `currency` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `dev_dashboard`

--



DROP TABLE IF EXISTS `dev_dashboard`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `dev_dashboard` (

  `dev_id` int NOT NULL,

  `total_revenue` decimal(12,2) DEFAULT '0.00',

  `downloads` int DEFAULT '0',

  `active_players` int DEFAULT '0',

  PRIMARY KEY (`dev_id`),

  CONSTRAINT `fk_dashboard_dev` FOREIGN KEY (`dev_id`) REFERENCES `developer` (`dev_id`) ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `dev_dashboard`

--



LOCK TABLES `dev_dashboard` WRITE;

/*!40000 ALTER TABLE `dev_dashboard` DISABLE KEYS */;

INSERT INTO `dev_dashboard` VALUES (2,12000.00,300000,32000);

/*!40000 ALTER TABLE `dev_dashboard` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `dev_games`

--



DROP TABLE IF EXISTS `dev_games`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `dev_games` (

  `dev_id` int NOT NULL,

  `game_id` int NOT NULL,

  PRIMARY KEY (`dev_id`,`game_id`),

  KEY `fk_devgame_game` (`game_id`),

  CONSTRAINT `fk_devgame_dev` FOREIGN KEY (`dev_id`) REFERENCES `developer` (`dev_id`) ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_devgame_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `dev_games`

--



LOCK TABLES `dev_games` WRITE;

/*!40000 ALTER TABLE `dev_games` DISABLE KEYS */;

INSERT INTO `dev_games` VALUES (2,1),(2,2),(2,20);

/*!40000 ALTER TABLE `dev_games` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `developer`

--



DROP TABLE IF EXISTS `developer`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `developer` (

  `dev_id` int NOT NULL AUTO_INCREMENT,

  `user_id` int NOT NULL,

  `studio_name` varchar(255) NOT NULL,

  `email` varchar(255) NOT NULL,

  `bio` text,

  `currency_id` int DEFAULT NULL,

  `language_id` int DEFAULT NULL,

  `password_hash` varchar(255) NOT NULL,

  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

  `imglocation` varchar(255) DEFAULT NULL,

  `acc_id` varchar(100) DEFAULT NULL,

  PRIMARY KEY (`dev_id`),

  UNIQUE KEY `email` (`email`),

  UNIQUE KEY `user_id` (`user_id`),

  KEY `fk_dev_currency` (`currency_id`),

  KEY `fk_dev_language` (`language_id`),

  CONSTRAINT `fk_dev_currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`currency_id`) ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `fk_dev_language` FOREIGN KEY (`language_id`) REFERENCES `language` (`lang_id`) ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `fk_dev_user` FOREIGN KEY (`user_id`) REFERENCES `userlogin` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `developer`

--



LOCK TABLES `developer` WRITE;

/*!40000 ALTER TABLE `developer` DISABLE KEYS */;

INSERT INTO `developer` VALUES (2,1,'gamedev','kyle@gmail.com','just wanna make games',1,1,'$2b$10$.KY0icjc/2coZmP1PHedLuZ6nicvMH.sIM29GN8epEeT.e7oxXD0C','2026-03-06 12:51:09','/uploads/1773932819079-909434224.webp','acct_1TDSOR4DI4b7kDYB'),(6,2,'sunshine','sally@gmail.com','make things bright',1,1,'$2b$10$PY.Z3sqBU02kQYqfLI7fOeGpjM6ugcBxbbzNcz/CxWJN4xE8tTwZe','2026-04-05 06:36:56','/uploads/1775371122224-676584734.webp',NULL);

/*!40000 ALTER TABLE `developer` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `games`

--



DROP TABLE IF EXISTS `games`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `games` (

  `game_id` int NOT NULL AUTO_INCREMENT,

  `title` varchar(255) NOT NULL,

  `genre_id` int DEFAULT NULL,

  `filelocation` varchar(255) DEFAULT NULL,

  `filestatus` varchar(50) DEFAULT 'pending',

  `price` int DEFAULT '0',

  `bio` text,

  `video` varchar(255) DEFAULT NULL,

  `img1` varchar(255) DEFAULT NULL,

  `img2` varchar(255) DEFAULT NULL,

  `img3` varchar(255) DEFAULT NULL,

  `release_date` datetime DEFAULT CURRENT_TIMESTAMP,

  `os` varchar(100) DEFAULT NULL,

  `processor` varchar(100) DEFAULT NULL,

  `memory` varchar(50) DEFAULT NULL,

  `storage` varchar(50) DEFAULT NULL,

  `cover` varchar(255) DEFAULT NULL,

  PRIMARY KEY (`game_id`),

  KEY `fk_game_genre` (`genre_id`),

  CONSTRAINT `fk_game_genre` FOREIGN KEY (`genre_id`) REFERENCES `genre` (`genre_id`) ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `games`

--



LOCK TABLES `games` WRITE;

/*!40000 ALTER TABLE `games` DISABLE KEYS */;

INSERT INTO `games` VALUES (1,'the night sky',4,NULL,'pending',2000,NULL,NULL,NULL,NULL,NULL,'2026-04-05 10:05:01',NULL,NULL,NULL,NULL,NULL),(2,'clone wars',1,NULL,'pending',3000,NULL,NULL,NULL,NULL,NULL,'2026-04-05 10:05:01',NULL,NULL,NULL,NULL,NULL),(20,'cricket07',1,'/cricket07','uploaded',5000,NULL,'/uploads/extracted/1775364917252/video.mp4','/uploads/extracted/1775364917252/img1.jpeg','/uploads/extracted/1775364917252/img2.jpeg','/uploads/extracted/1775364917252/img3.webp','2026-04-05 10:05:01',NULL,NULL,NULL,NULL,'/uploads/extracted/1775364917252/cover.webp');

/*!40000 ALTER TABLE `games` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `genre`

--



DROP TABLE IF EXISTS `genre`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `genre` (

  `genre_id` int NOT NULL AUTO_INCREMENT,

  `genre` varchar(100) NOT NULL,

  PRIMARY KEY (`genre_id`)

) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `genre`

--



LOCK TABLES `genre` WRITE;

/*!40000 ALTER TABLE `genre` DISABLE KEYS */;

INSERT INTO `genre` VALUES (1,'action'),(2,'rpg'),(3,'horror'),(4,'simulation');

/*!40000 ALTER TABLE `genre` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `language`

--



DROP TABLE IF EXISTS `language`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `language` (

  `lang_id` int NOT NULL AUTO_INCREMENT,

  `language` varchar(100) NOT NULL,

  PRIMARY KEY (`lang_id`),

  UNIQUE KEY `language` (`language`)

) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `language`

--



LOCK TABLES `language` WRITE;

/*!40000 ALTER TABLE `language` DISABLE KEYS */;

INSERT INTO `language` VALUES (1,'english'),(3,'french'),(2,'japanese');

/*!40000 ALTER TABLE `language` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `payments`

--



DROP TABLE IF EXISTS `payments`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `payments` (

  `payment_id` int NOT NULL AUTO_INCREMENT,

  `dev_id` int NOT NULL,

  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

  `method` varchar(50) DEFAULT NULL,

  `amount` int DEFAULT NULL,

  `currency_id` int DEFAULT NULL,

  `status` varchar(20) DEFAULT NULL,

  PRIMARY KEY (`payment_id`),

  KEY `fk_dev` (`dev_id`),

  KEY `fk_currency` (`currency_id`),

  CONSTRAINT `fk_currency` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`currency_id`) ON DELETE CASCADE,

  CONSTRAINT `fk_dev` FOREIGN KEY (`dev_id`) REFERENCES `developer` (`dev_id`) ON DELETE CASCADE

) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `payments`

--



LOCK TABLES `payments` WRITE;

/*!40000 ALTER TABLE `payments` DISABLE KEYS */;

INSERT INTO `payments` VALUES (7,2,'2026-04-05 11:02:07','stripe_account',3000,1,'completed');

/*!40000 ALTER TABLE `payments` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `roles`

--



DROP TABLE IF EXISTS `roles`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `roles` (

  `role_id` int NOT NULL AUTO_INCREMENT,

  `role` varchar(100) NOT NULL,

  PRIMARY KEY (`role_id`),

  UNIQUE KEY `role` (`role`)

) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `roles`

--



LOCK TABLES `roles` WRITE;

/*!40000 ALTER TABLE `roles` DISABLE KEYS */;

INSERT INTO `roles` VALUES (2,'developer'),(1,'user');

/*!40000 ALTER TABLE `roles` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `user_games`

--



DROP TABLE IF EXISTS `user_games`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `user_games` (

  `user_id` int NOT NULL,

  `game_id` int NOT NULL,

  PRIMARY KEY (`user_id`,`game_id`),

  KEY `fk_game` (`game_id`),

  CONSTRAINT `fk_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`),

  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `userlogin` (`user_id`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `user_games`

--



LOCK TABLES `user_games` WRITE;

/*!40000 ALTER TABLE `user_games` DISABLE KEYS */;

INSERT INTO `user_games` VALUES (2,1),(2,2),(2,20);

/*!40000 ALTER TABLE `user_games` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `userlogin`

--



DROP TABLE IF EXISTS `userlogin`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `userlogin` (

  `user_id` int NOT NULL AUTO_INCREMENT,

  `username` varchar(100) NOT NULL,

  `password_hash` varchar(255) NOT NULL,

  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

  `fullname` varchar(255) DEFAULT NULL,

  `role_id` int NOT NULL,

  PRIMARY KEY (`user_id`),

  UNIQUE KEY `username` (`username`),

  KEY `fk_role` (`role_id`),

  CONSTRAINT `fk_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `userlogin`

--



LOCK TABLES `userlogin` WRITE;

/*!40000 ALTER TABLE `userlogin` DISABLE KEYS */;

INSERT INTO `userlogin` VALUES (1,'kyle','$2b$10$LdHHjTUSJ3jN4/22wBRHOOQres.LtoHp.2SKozwiQImdincM6WMsO','2026-03-03 09:10:04','kyle',2),(2,'sally','$2b$10$rmqcYxJZjIjBdLaZIwJTmuDAlJOQo5RlEdT0euydIIgdZzvy5b206','2026-03-03 10:39:35','sally',2),(4,'peterparker@gmail.com','$2b$10$wVlIgg0t3yvpkqdMItCOEOrg5ghkwpGgIta8Hid.xOu.PQLVjebC2','2026-03-04 16:31:26','spidey',1);

/*!40000 ALTER TABLE `userlogin` ENABLE KEYS */;

UNLOCK TABLES;



--

-- Table structure for table `wishlist`

--



DROP TABLE IF EXISTS `wishlist`;

/*!40101 SET @saved_cs_client     = @@character_set_client */;

/*!50503 SET character_set_client = utf8mb4 */;

CREATE TABLE `wishlist` (

  `user_id` int NOT NULL,

  `game_id` int NOT NULL,

  PRIMARY KEY (`user_id`,`game_id`),

  KEY `game_id` (`game_id`),

  CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `userlogin` (`user_id`) ON DELETE CASCADE,

  CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;



--

-- Dumping data for table `wishlist`

--



LOCK TABLES `wishlist` WRITE;

/*!40000 ALTER TABLE `wishlist` DISABLE KEYS */;

INSERT INTO `wishlist` VALUES (2,1),(2,2);

/*!40000 ALTER TABLE `wishlist` ENABLE KEYS */;

UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;

/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;

/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;

/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;



-- Dump completed on 2026-04-05 17:59:21

