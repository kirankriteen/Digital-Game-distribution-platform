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
