CREATE DATABASE IF NOT EXISTS game_distribution;

USE DATABASE game_distribution;

CREATE TABLE userLogin (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO userLogin (username, password_hash)
VALUES ('kyle', '$2b$10$LdHHjTUSJ3jN4/22wBRHOOQres.LtoHp.2SKozwiQImdincM6WMsO');

ALTER TABLE userLogin
ADD COLUMN fullname VARCHAR(255) NULL;

ALTER TABLE userLogin
ADD COLUMN role_id INT NOT NULL;

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(100) NOT NULL UNIQUE
)

ALTER TABLE userLogin
ADD CONSTRAINT fk_role
FOREIGN KEY (role_id)
REFERENCES roles(role_id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

CREATE TABLE currency (
    currency_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE language (
    lang_id INT AUTO_INCREMENT PRIMARY KEY,
    language VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE developer (
    dev_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    studio_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    bio TEXT,
    currency_id INT,
    language_id INT,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_dev_user FOREIGN KEY (user_id) REFERENCES userLogin(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dev_currency FOREIGN KEY (currency_id) REFERENCES currency(currency_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dev_language FOREIGN KEY (language_id) REFERENCES language(lang_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Genre table
CREATE TABLE genre (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    genre VARCHAR(100) NOT NULL
);

-- Games table
CREATE TABLE games (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre_id INT,
    CONSTRAINT fk_game_genre FOREIGN KEY (genre_id)
        REFERENCES genre(genre_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Developer table (assuming already exists)
-- CREATE TABLE developer (...);

-- Developer dashboard table
CREATE TABLE dev_dashboard (
    dev_id INT PRIMARY KEY,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    downloads INT DEFAULT 0,
    active_players INT DEFAULT 0,
    CONSTRAINT fk_dashboard_dev FOREIGN KEY (dev_id)
        REFERENCES developer(dev_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Developer-games table (many-to-many relationship)
CREATE TABLE dev_games (
    dev_id INT NOT NULL,
    game_id INT NOT NULL,
    PRIMARY KEY (dev_id, game_id),
    CONSTRAINT fk_devgame_dev FOREIGN KEY (dev_id)
        REFERENCES developer(dev_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_devgame_game FOREIGN KEY (game_id)
        REFERENCES games(game_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);