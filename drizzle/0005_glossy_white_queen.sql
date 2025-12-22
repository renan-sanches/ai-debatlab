CREATE TABLE `debateResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debateId` int NOT NULL,
	`userId` int NOT NULL,
	`finalAssessment` text,
	`synthesis` text,
	`moderatorTopPick` varchar(64),
	`moderatorReasoning` text,
	`peerVotes` json DEFAULT ('{}'),
	`strongestArguments` json DEFAULT ('[]'),
	`devilsAdvocateSuccess` boolean DEFAULT false,
	`pointsAwarded` json DEFAULT ('{}'),
	`roundCount` int NOT NULL DEFAULT 1,
	`topicTags` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `debateResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `debateResults_debateId_unique` UNIQUE(`debateId`)
);
--> statement-breakpoint
CREATE TABLE `modelStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`modelId` varchar(64) NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`totalDebates` int NOT NULL DEFAULT 0,
	`moderatorPicks` int NOT NULL DEFAULT 0,
	`totalPeerVotes` int NOT NULL DEFAULT 0,
	`strongArgumentMentions` int NOT NULL DEFAULT 0,
	`devilsAdvocateWins` int NOT NULL DEFAULT 0,
	`recentPoints` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modelStats_id` PRIMARY KEY(`id`)
);
