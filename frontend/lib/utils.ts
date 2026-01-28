export function formatToUSDate(dateString: string, options: Intl.DateTimeFormatOptions = {}): string {
    if (!dateString) return "";

    // Manual English Mapping to bypass any System/Browser Locale issues
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let date: Date;
    const parts = dateString.split("-");

    if (parts.length === 3) {
        // Parse YYYY-MM-DD manually to avoid UTC shifts
        const year = parseInt(parts[0]);
        const monthIndex = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        date = new Date(year, monthIndex, day);
    } else {
        date = new Date(dateString);
    }

    if (isNaN(date.getTime())) return dateString; // Return original if parse fails

    // Extract components
    const weekdayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const yearNum = date.getFullYear();

    // "weekday: short" matches "Mon"
    if (options.weekday === 'short' && !options.month) {
        return weekdayName;
    }

    // Default "Mon, Jan 27" format (approximate to weekday: long, month: short, day: numeric)
    if (options.weekday === 'long' || options.month === 'short') {
        // Expand weekday if needed, but for now specific to our UI needs:
        // If the UI asked for "long" weekday, our manual array has "short". 
        // Let's make a long map for completeness if strict adherence is needed.
        // But for our UI "Mon, Jan 27" is fine or we can extend.
        const longDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const wDay = options.weekday === 'long' ? longDays[date.getDay()] : weekdayName;

        return `${wDay}, ${monthName} ${dayNum}`;
    }

    // Fallback: simple Month Day
    return `${monthName} ${dayNum}`;
}
