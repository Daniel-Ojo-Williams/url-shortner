const rateBucket = new Map();

function rateLimiter(ip) {
    const data = rateBucket.get(ip);
    const now = new Date();
    if (!data) {
        now.setHours(now.getHours() + 1);
        rateBucket.set(ip, {
            writes: 1,
            resetsAt: now
        })

        return '';
    }

    if (data.resetsAt > now) {
        console.log(data)
        if (data.writes === 2) {
            const present = new Date();
            const resetsAt = new Date(data.resetsAt);
            const totalSeconds = (resetsAt - present)/ 1000
            const totalMinutes = totalSeconds / 60;
            return {
                seconds: Math.floor(totalSeconds % 60),
                minutes: Math.floor(totalMinutes)
            };
        }

        data.writes++;

        return ''
    }

    now.setHours(now.getHours() + 1);
    data.writes = 1;
    data.resetsAt = now;

    return ''
}

module.exports = {
    rateLimiter
}
