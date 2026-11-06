using Microsoft.AspNetCore.Identity.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;

using System.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

using BCrypt.Net;

using time_keeper.Server.Data;
using time_keeper.Server.Models;
using System.Security.Claims;

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
                return null; // Handles existing users
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
        public async Task<TokenResponseModel> LoginAsync(LoginRequestModel request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null; // Invalid credentials
            }
            var accessToken = GenerateAccessToken(user);
            var refreshToken = await GenerateRefreshTokenAsync(user);
            return new TokenResponseModel
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token
            };
        }
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
        private async Task<RefreshTokenModel> GenerateRefreshTokenAsync(UserModel user)
        {
            var refreshToken = new RefreshTokenModel
            {
                Token = Guid.NewGuid().ToString(),
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(double.Parse(_configuration["Jwt:RefreshTokenExpirationDays"]!))
            };
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();
            return refreshToken;
        }
        public async Task<TokenResponseModel> RefreshTokenAsync(string refreshToken)
        {
            var token = await _context.RefreshTokens.FirstOrDefaultAsync(t => t.Token == refreshToken);
            if (token == null || token.IsRevoked || token.Expires < DateTime.UtcNow)
            {
                return null; // Invalid or expired token
            }
            var user = await _context.Users.FindAsync(token.UserId);
            if (user == null)
            {
                return null; // User not found
            }

            // Generate new access token
            var newAccessToken = GenerateAccessToken(user);

            // Generate new refresh token and revoke the old one
            token.IsRevoked = true;
            var newRefreshToken = await GenerateRefreshTokenAsync(user);
            await _context.SaveChangesAsync();
            return new TokenResponseModel
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken.Token
            };
        }
    }
}
