using Microsoft.EntityFrameworkCore;
using 241RunnersAPI.Models;

namespace 241RunnersAPI.Data
{
    /// <summary>
    /// Application database context
    /// </summary>
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Runner Profile related entities
        public DbSet<RunnerProfile> RunnerProfiles { get; set; }
        public DbSet<RunnerPhoto> RunnerPhotos { get; set; }
        public DbSet<PhotoUpdateReminder> PhotoUpdateReminders { get; set; }
        public DbSet<NotificationSettings> NotificationSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure RunnerProfile entity
            modelBuilder.Entity<RunnerProfile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(450);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.DateOfBirth).IsRequired();
                entity.Property(e => e.Height).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Weight).IsRequired().HasMaxLength(20);
                entity.Property(e => e.EyeColor).IsRequired().HasMaxLength(20);
                entity.Property(e => e.MedicalConditions).HasColumnType("nvarchar(max)");
                entity.Property(e => e.AdditionalNotes).HasMaxLength(1000);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.ReminderCount).HasDefaultValue(0);

                // Indexes
                entity.HasIndex(e => e.UserId).HasDatabaseName("IX_RunnerProfiles_UserId");
                entity.HasIndex(e => e.IsActive).HasDatabaseName("IX_RunnerProfiles_IsActive");
                entity.HasIndex(e => e.LastPhotoUpdate).HasDatabaseName("IX_RunnerProfiles_LastPhotoUpdate");
                entity.HasIndex(e => new { e.UserId, e.IsActive }).HasDatabaseName("IX_RunnerProfiles_UserId_IsActive");

                // Relationships
                entity.HasMany(e => e.Photos)
                    .WithOne(p => p.RunnerProfile)
                    .HasForeignKey(p => p.RunnerProfileId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.PhotoReminders)
                    .WithOne(r => r.RunnerProfile)
                    .HasForeignKey(r => r.RunnerProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure RunnerPhoto entity
            modelBuilder.Entity<RunnerPhoto>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.RunnerProfileId).IsRequired();
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FileUrl).IsRequired().HasMaxLength(500);
                entity.Property(e => e.FileSize).IsRequired();
                entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.UploadedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.IsPrimary).HasDefaultValue(false);

                // Indexes
                entity.HasIndex(e => e.RunnerProfileId).HasDatabaseName("IX_RunnerPhotos_RunnerProfileId");
                entity.HasIndex(e => e.IsPrimary).HasDatabaseName("IX_RunnerPhotos_IsPrimary");
                entity.HasIndex(e => e.UploadedAt).HasDatabaseName("IX_RunnerPhotos_UploadedAt");
                entity.HasIndex(e => new { e.RunnerProfileId, e.IsPrimary }).HasDatabaseName("IX_RunnerPhotos_ProfileId_Primary");

                // Relationships
                entity.HasOne(e => e.RunnerProfile)
                    .WithMany(p => p.Photos)
                    .HasForeignKey(e => e.RunnerProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure PhotoUpdateReminder entity
            modelBuilder.Entity<PhotoUpdateReminder>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.RunnerProfileId).IsRequired();
                entity.Property(e => e.ReminderDate).IsRequired();
                entity.Property(e => e.ReminderType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("pending");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Indexes
                entity.HasIndex(e => e.RunnerProfileId).HasDatabaseName("IX_PhotoUpdateReminders_RunnerProfileId");
                entity.HasIndex(e => e.Status).HasDatabaseName("IX_PhotoUpdateReminders_Status");
                entity.HasIndex(e => e.ReminderDate).HasDatabaseName("IX_PhotoUpdateReminders_ReminderDate");
                entity.HasIndex(e => new { e.RunnerProfileId, e.Status, e.ReminderDate }).HasDatabaseName("IX_PhotoUpdateReminders_ProfileId_Status_Date");

                // Relationships
                entity.HasOne(e => e.RunnerProfile)
                    .WithMany(p => p.PhotoReminders)
                    .HasForeignKey(e => e.RunnerProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure NotificationSettings entity
            modelBuilder.Entity<NotificationSettings>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.UserId).IsRequired().HasMaxLength(450);
                entity.Property(e => e.EmailNotifications).HasDefaultValue(true);
                entity.Property(e => e.PushNotifications).HasDefaultValue(true);
                entity.Property(e => e.ReminderFrequency).IsRequired().HasMaxLength(20).HasDefaultValue("weekly");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

                // Indexes
                entity.HasIndex(e => e.UserId).HasDatabaseName("IX_NotificationSettings_UserId");
            });

            // Configure table names and schemas
            modelBuilder.Entity<RunnerProfile>().ToTable("RunnerProfiles");
            modelBuilder.Entity<RunnerPhoto>().ToTable("RunnerPhotos");
            modelBuilder.Entity<PhotoUpdateReminder>().ToTable("PhotoUpdateReminders");
            modelBuilder.Entity<NotificationSettings>().ToTable("NotificationSettings");
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is RunnerProfile && (e.State == EntityState.Added || e.State == EntityState.Modified));

            foreach (var entry in entries)
            {
                if (entry.Entity is RunnerProfile profile)
                {
                    if (entry.State == EntityState.Added)
                    {
                        profile.CreatedAt = DateTime.UtcNow;
                    }
                    profile.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
    }
}
