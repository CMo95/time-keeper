using Microsoft.EntityFrameworkCore;

using time_keeper.Server.Models;

namespace time_keeper.Server.Data
{
    public class ApplicationDatabaseContext : DbContext
    {
        public DbSet<UserModel> Users { get; set; }
        public DbSet<RefreshTokenModel> RefreshTokens { get; set; }
        public ApplicationDatabaseContext(DbContextOptions<ApplicationDatabaseContext> options) : base(options)
        {

        }
    }
}
