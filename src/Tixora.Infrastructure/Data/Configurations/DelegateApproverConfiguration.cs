using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tixora.Domain.Entities;

namespace Tixora.Infrastructure.Data.Configurations;

public class DelegateApproverConfiguration : IEntityTypeConfiguration<DelegateApprover>
{
    public void Configure(EntityTypeBuilder<DelegateApprover> builder)
    {
        builder.HasKey(d => d.Id);

        builder.HasOne(d => d.PrimaryUser)
            .WithMany()
            .HasForeignKey(d => d.PrimaryUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.DelegateUser)
            .WithMany()
            .HasForeignKey(d => d.DelegateUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => new { d.PrimaryUserId, d.DelegateUserId, d.IsActive });
    }
}
