-- 241 Runners API - Database Schema for Runner Profile System
-- This file contains the SQL schema for implementing the runner profile system

-- =============================================
-- RunnerProfiles Table
-- =============================================
CREATE TABLE RunnerProfiles (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Height NVARCHAR(20) NOT NULL,
    Weight NVARCHAR(20) NOT NULL,
    EyeColor NVARCHAR(20) NOT NULL,
    MedicalConditions NVARCHAR(MAX), -- JSON array
    AdditionalNotes NVARCHAR(1000),
    LastPhotoUpdate DATETIME2,
    ReminderCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    IsActive BIT DEFAULT 1,
    
    -- Foreign Key Constraints
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    
    -- Indexes for Performance
    INDEX IX_RunnerProfiles_UserId (UserId),
    INDEX IX_RunnerProfiles_IsActive (IsActive),
    INDEX IX_RunnerProfiles_LastPhotoUpdate (LastPhotoUpdate)
);

-- =============================================
-- RunnerPhotos Table
-- =============================================
CREATE TABLE RunnerPhotos (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RunnerProfileId UNIQUEIDENTIFIER NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    FileUrl NVARCHAR(500) NOT NULL,
    FileSize BIGINT NOT NULL,
    MimeType NVARCHAR(100) NOT NULL,
    UploadedAt DATETIME2 DEFAULT GETUTCDATE(),
    IsPrimary BIT DEFAULT 0,
    
    -- Foreign Key Constraints
    FOREIGN KEY (RunnerProfileId) REFERENCES RunnerProfiles(Id) ON DELETE CASCADE,
    
    -- Indexes for Performance
    INDEX IX_RunnerPhotos_RunnerProfileId (RunnerProfileId),
    INDEX IX_RunnerPhotos_IsPrimary (IsPrimary),
    INDEX IX_RunnerPhotos_UploadedAt (UploadedAt)
);

-- =============================================
-- PhotoUpdateReminders Table
-- =============================================
CREATE TABLE PhotoUpdateReminders (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RunnerProfileId UNIQUEIDENTIFIER NOT NULL,
    ReminderDate DATETIME2 NOT NULL,
    ReminderType NVARCHAR(20) NOT NULL, -- 'email', 'push', 'both'
    SentAt DATETIME2,
    Status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Foreign Key Constraints
    FOREIGN KEY (RunnerProfileId) REFERENCES RunnerProfiles(Id) ON DELETE CASCADE,
    
    -- Indexes for Performance
    INDEX IX_PhotoUpdateReminders_RunnerProfileId (RunnerProfileId),
    INDEX IX_PhotoUpdateReminders_Status (Status),
    INDEX IX_PhotoUpdateReminders_ReminderDate (ReminderDate)
);

-- =============================================
-- NotificationSettings Table (if not exists)
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NotificationSettings' AND xtype='U')
CREATE TABLE NotificationSettings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    EmailNotifications BIT DEFAULT 1,
    PushNotifications BIT DEFAULT 1,
    ReminderFrequency NVARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Foreign Key Constraints
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    
    -- Indexes for Performance
    INDEX IX_NotificationSettings_UserId (UserId)
);

-- =============================================
-- Stored Procedures
-- =============================================

-- Get Runner Profile with Photos
CREATE PROCEDURE GetRunnerProfileWithPhotos
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SELECT 
        rp.Id,
        rp.UserId,
        rp.FirstName,
        rp.LastName,
        rp.DateOfBirth,
        DATEDIFF(YEAR, rp.DateOfBirth, GETUTCDATE()) AS Age,
        rp.Height,
        rp.Weight,
        rp.EyeColor,
        rp.MedicalConditions,
        rp.AdditionalNotes,
        rp.LastPhotoUpdate,
        rp.ReminderCount,
        rp.CreatedAt,
        rp.UpdatedAt,
        rp.IsActive
    FROM RunnerProfiles rp
    WHERE rp.UserId = @UserId AND rp.IsActive = 1;
    
    SELECT 
        rph.Id,
        rph.RunnerProfileId,
        rph.FileName,
        rph.FileUrl,
        rph.FileSize,
        rph.MimeType,
        rph.UploadedAt,
        rph.IsPrimary
    FROM RunnerPhotos rph
    INNER JOIN RunnerProfiles rp ON rph.RunnerProfileId = rp.Id
    WHERE rp.UserId = @UserId AND rp.IsActive = 1
    ORDER BY rph.IsPrimary DESC, rph.UploadedAt DESC;
END;

-- Check if Runner Profile Exists
CREATE PROCEDURE CheckRunnerProfileExists
    @UserId UNIQUEIDENTIFIER,
    @Exists BIT OUTPUT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM RunnerProfiles WHERE UserId = @UserId AND IsActive = 1)
        SET @Exists = 1;
    ELSE
        SET @Exists = 0;
END;

-- Get Photos Needing Update (older than 6 months)
CREATE PROCEDURE GetPhotosNeedingUpdate
AS
BEGIN
    SELECT 
        rp.Id AS RunnerProfileId,
        rp.UserId,
        rp.FirstName,
        rp.LastName,
        rp.LastPhotoUpdate,
        DATEDIFF(DAY, rp.LastPhotoUpdate, GETUTCDATE()) AS DaysSinceUpdate
    FROM RunnerProfiles rp
    WHERE rp.IsActive = 1 
    AND rp.LastPhotoUpdate IS NOT NULL
    AND DATEDIFF(MONTH, rp.LastPhotoUpdate, GETUTCDATE()) >= 6;
END;

-- =============================================
-- Sample Data (for testing)
-- =============================================

-- Insert sample notification settings for existing users
INSERT INTO NotificationSettings (UserId, EmailNotifications, PushNotifications, ReminderFrequency)
SELECT 
    Id,
    1, -- EmailNotifications
    1, -- PushNotifications
    'weekly' -- ReminderFrequency
FROM Users
WHERE Id NOT IN (SELECT UserId FROM NotificationSettings);

-- =============================================
-- Views for easier querying
-- =============================================

-- Runner Profile Summary View
CREATE VIEW RunnerProfileSummary AS
SELECT 
    rp.Id,
    rp.UserId,
    rp.FirstName,
    rp.LastName,
    DATEDIFF(YEAR, rp.DateOfBirth, GETUTCDATE()) AS Age,
    rp.Height,
    rp.Weight,
    rp.EyeColor,
    rp.LastPhotoUpdate,
    rp.ReminderCount,
    rp.CreatedAt,
    rp.UpdatedAt,
    COUNT(rph.Id) AS PhotoCount,
    MAX(rph.UploadedAt) AS LatestPhotoDate
FROM RunnerProfiles rp
LEFT JOIN RunnerPhotos rph ON rp.Id = rph.RunnerProfileId
WHERE rp.IsActive = 1
GROUP BY rp.Id, rp.UserId, rp.FirstName, rp.LastName, rp.DateOfBirth, 
         rp.Height, rp.Weight, rp.EyeColor, rp.LastPhotoUpdate, 
         rp.ReminderCount, rp.CreatedAt, rp.UpdatedAt;

-- =============================================
-- Triggers for maintaining data integrity
-- =============================================

-- Trigger to update UpdatedAt timestamp
CREATE TRIGGER TR_RunnerProfiles_UpdateTimestamp
ON RunnerProfiles
AFTER UPDATE
AS
BEGIN
    UPDATE RunnerProfiles
    SET UpdatedAt = GETUTCDATE()
    FROM RunnerProfiles rp
    INNER JOIN inserted i ON rp.Id = i.Id;
END;

-- Trigger to ensure only one primary photo per profile
CREATE TRIGGER TR_RunnerPhotos_EnsureSinglePrimary
ON RunnerPhotos
AFTER INSERT, UPDATE
AS
BEGIN
    -- If a photo is being set as primary, unset all other primary photos for this profile
    UPDATE RunnerPhotos
    SET IsPrimary = 0
    FROM RunnerPhotos rp
    INNER JOIN inserted i ON rp.RunnerProfileId = i.RunnerProfileId
    WHERE rp.Id != i.Id AND i.IsPrimary = 1;
END;

-- =============================================
-- Indexes for Performance Optimization
-- =============================================

-- Composite indexes for common queries
CREATE INDEX IX_RunnerProfiles_UserId_IsActive ON RunnerProfiles(UserId, IsActive);
CREATE INDEX IX_RunnerPhotos_ProfileId_Primary ON RunnerPhotos(RunnerProfileId, IsPrimary);
CREATE INDEX IX_PhotoReminders_ProfileId_Status_Date ON PhotoUpdateReminders(RunnerProfileId, Status, ReminderDate);

-- =============================================
-- Comments and Documentation
-- =============================================

-- Table Comments
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Stores runner profile information for users', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'RunnerProfiles';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Stores photos associated with runner profiles', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'RunnerPhotos';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Stores photo update reminders for runner profiles', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'PhotoUpdateReminders';
