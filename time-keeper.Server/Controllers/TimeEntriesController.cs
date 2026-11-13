using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using time_keeper.Server.Data;
using time_keeper.Server.Models;

namespace time_keeper.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class TimeEntriesController : ControllerBase
    {
        private readonly ApplicationDatabaseContext _context;
        public TimeEntriesController(ApplicationDatabaseContext context)
        {
            _context = context;
        }
        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        [HttpGet]
        public async Task<IActionResult> GetEntries()
        {
            var userId = CurrentUserId;
            var entries = await _context.TimeEntries.Where(e => e.UserId == userId).OrderByDescending(e => e.StartUTC).Take(50).ToListAsync();
            return Ok(entries);
        }

        [HttpPost("clock-in")]
        public async Task<IActionResult> ClockIn()
        {
            var userId = CurrentUserId;
            var alreadyClockedIn = await _context.TimeEntries.AnyAsync(e => e.UserId == userId && e.EndUTC == null);
            if (alreadyClockedIn)
            {
                return Conflict("You are already clocked in!");
            }
            var entry = new TimeEntryModel
            {
                UserId = userId,
                StartUTC = DateTime.UtcNow
            };
            _context.TimeEntries.Add(entry);
            await _context.SaveChangesAsync();
            return Ok(entry);
        }

        [HttpPost("clock-out")]
        public async Task<IActionResult> ClockOut()
        {
            var userId = CurrentUserId;
            var entry = await _context.TimeEntries.FirstOrDefaultAsync(e => e.UserId == userId && e.EndUTC == null);
            if (entry == null)
            {
                return Conflict("You are not clocked in!");
            }
            entry.EndUTC = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(entry);
        }

    }
}
