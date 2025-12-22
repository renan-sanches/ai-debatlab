CREATE TABLE `debates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` text NOT NULL,
	`participantModels` json NOT NULL,
	`moderatorModel` varchar(64) NOT NULL,
	`devilsAdvocateEnabled` boolean NOT NULL DEFAULT false,
	`devilsAdvocateModel` varchar(64),
	`votingEnabled` boolean NOT NULL DEFAULT false,
	`status` enum('active','completed','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` int NOT NULL,
	`debateId` int NOT NULL,
	`modelId` varchar(64) NOT NULL,
	`modelName` varchar(128) NOT NULL,
	`content` text NOT NULL,
	`isDevilsAdvocate` boolean NOT NULL DEFAULT false,
	`responseOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debateId` int NOT NULL,
	`roundNumber` int NOT NULL,
	`followUpQuestion` text,
	`moderatorSynthesis` text,
	`suggestedFollowUp` text,
	`status` enum('in_progress','awaiting_moderator','completed') NOT NULL DEFAULT 'in_progress',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` int NOT NULL,
	`voterModelId` varchar(64) NOT NULL,
	`votedForModelId` varchar(64) NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`)
);
