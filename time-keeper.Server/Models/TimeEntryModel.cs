namespace time_keeper.Server.Models
{
    public class TimeEntryModel
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime StartUTC { get; set; }
        public DateTime? EndUTC { get; set; }
    }
}
