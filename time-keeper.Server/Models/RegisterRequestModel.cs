using System.ComponentModel.DataAnnotations;

namespace time_keeper.Server.Models
{
    public class RegisterRequestModel
    {
        [Required, StringLength(128, MinimumLength = 3)]
        public string Username { get; set; } = string.Empty;
        [Required, StringLength(128, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

    }
}
    