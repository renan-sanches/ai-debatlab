CREATE TABLE `userFavoriteModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`openRouterId` varchar(128) NOT NULL,
	`modelName` varchar(256) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userFavoriteModels_id` PRIMARY KEY(`id`)
);
