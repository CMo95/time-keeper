using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;

using time_keeper.Server.Services;
using time_keeper.Server.Models;

namespace time_keeper.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }
        public class RefreshTokenRequest
        {
            public string RefreshToken { get; set; } = string.Empty;
        }

        [HttpPost("register")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestModel request)
        {
            var user = await _authService.RegisterAsync(request);
            if (user == null)
                return BadRequest("Username already exists.");

            return Ok(new { user.Id, user.Username });
        }
        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Login([FromBody] LoginRequestModel request)
        {
            var response = await _authService.LoginAsync(request);
            if (response == null)
            {
                return Unauthorized("Invalid username or password");
            }

            return Ok(response);
        }
        [HttpPost("refresh")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
        {
            var response = await _authService.RefreshTokenAsync(request.RefreshToken);
            if (response == null)
            {
                return Unauthorized("Invalid or expired refresh token");
            }
            return Ok(response);
        }
        [HttpPost("revoke")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Revoke([FromBody] RefreshTokenRequest request)
        {
            var response = await _authService.RefreshTokenAsync(request.RefreshToken);
            if (response == null)
            {
                return Unauthorized("Invalid or expired refresh token");
            }
            return Ok();
        }
        [HttpGet("protected")]
        [Authorize]
        public IActionResult Protected()
        {
            var username = User.Identity?.Name;
            return Ok();
        }
    }
}
