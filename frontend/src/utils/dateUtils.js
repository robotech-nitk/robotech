export const formatDateIST = (dateString, options = {}) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    const defaultOptions = {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        ...options
    };

    try {
        return new Intl.DateTimeFormat("en-IN", defaultOptions).format(date);
    } catch (e) {
        console.error("Date formatting error:", e);
        return new Date(dateString).toLocaleString();
    }
};

export const formatDateOnlyIST = (dateString) => {
    return formatDateIST(dateString, {
        hour: undefined,
        minute: undefined,
        second: undefined,
        hour12: undefined
    });
};
