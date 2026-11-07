using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;
using System.Security.Cryptography;

using time_keeper.Server.Data;
using time_keeper.Server.Models;

namespace time_keeper.Server.Services
{
    public class AuthService
    {
        private readonly ApplicationDatabaseContext _context;
        private readonly IConfiguration _configuration;
        public AuthService(ApplicationDatabaseContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }
        public async Task<UserModel?> RegisterAsync(RegisterRequestModel request)
        {
            if (_context.Users.Any(u => u.Username == request.Username))
            {
                return null; // Username already exists
            }

            var user = new UserModel
            {
                Username = request.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }
        public async Task<TokenResponseModel?> LoginAsync(LoginRequestModel request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null; // Invalid credentials
            }
            return await IssueTokensAsync(user);
        }
        public async Task<TokenResponseModel?> RefreshTokenAsync(string refreshToken)
        {
            var token = await FindTokenAsync(refreshToken);
            if (token == null)
            {
                return null; // Invalid token
            }

            if (token.IsRevoked)
            {
                await RevokeAllForUserAsync(token.UserId);
                return null; // Revoked token
            }

            if (token.Expires < DateTime.UtcNow)
            {
                return null; // Expired token
            }

            var user = await _context.Users.FindAsync(token.UserId);
            if (user == null)
            {
                return null; // User not found
            }

            token.IsRevoked = true; // Rotate: each refresh token can only be used once
            return await IssueTokensAsync(user); // Saves the revoke above
        }
        public async Task RevokeTokenAsync(string refreshToken)
        {
            var token = await FindTokenAsync(refreshToken);
            if (token == null || token.IsRevoked)
            {
                return; // Do nothing(Token already revoked or not found)
            }

            token.IsRevoked = true;
            await _context.SaveChangesAsync();
        }
        private async Task<TokenResponseModel> IssueTokensAsync(UserModel user)
        {
            var rawRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            _context.RefreshTokens.Add(new RefreshTokenModel
            {
                TokenHash = HashToken(rawRefreshToken),
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(double.Parse(_configuration["Jwt:RefreshTokenExpirationDays"]!))
            });
            await _context.SaveChangesAsync();
            return new TokenResponseModel
            {
                AccessToken = GenerateAccessToken(user),
                RefreshToken = rawRefreshToken
            };
        }
        private async Task RevokeAllForUserAsync(int userId)
        {
            var tokens = await _context.RefreshTokens.Where(t => t.UserId == userId && !t.IsRevoked).ToListAsync();
            foreach (var t in tokens)
            {
                t.IsRevoked = true;
            }
            await _context.SaveChangesAsync();
        }
        private Task<RefreshTokenModel?> FindTokenAsync(string rawToken)
        {
            var hash = HashToken(rawToken);
            return _context.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        }
        private static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        private string GenerateAccessToken(UserModel user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Name, user.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var creds = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["AccessTokenExpirationMinutes"]!)),
                signingCredentials: creds
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
