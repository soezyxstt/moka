ALTER TABLE `participantStageEntry` ADD `portraitMediaId` text REFERENCES mediaAsset(id);--> statement-breakpoint
ALTER TABLE `participantStageEntry` ADD `qrisMediaId` text REFERENCES mediaAsset(id);--> statement-breakpoint
ALTER TABLE `participantStageEntry` ADD `mediaInitialized` integer DEFAULT false NOT NULL;