const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { shorten, flush, getKey, getAnalytics } = require('./short');
const cors = require('cors');
const { rateLimiter } = require('./limiter');

dotenv.config();

const app = express();
const port = process.env.PORT || 4050;

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const getIp = (req) => req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for']?.split(',')?.[0]?.trim();

app.post('/shorten', async (req, res) => {
    let longLink = req.body?.longLink;
    longLink = longLink?.trim()?.toLowerCase();

    if (!longLink) return res.status(400).json({ message: 'Missing long link' });
    
    const protocolRegex = new RegExp(/^http(?:s?)/)
    if (!protocolRegex.test(longLink)) {
        return res.status(400).json({
            message: 'Invalid link'
        })
    }
    const timer = rateLimiter(getIp(req));
    if (timer) {
        return res.status(422).json({
            message: `Too many requests. Try again in ${timer.minutes >= 1 ? timer.minutes : ''} ${timer.minutes > 1 ? 'minutes' : timer.minutes === 0 ? '' : 'minute'} ${timer.seconds} ${timer.seconds > 1 ? 'seconds' : 'second'}`
        })
    }
    const key = await shorten(longLink);
    const shortLink = `${process.env.BASE_URL}/${key}`;

    return res.status(200).json({
        message: 'Short link generated successfully',
        shortLink
    })
});

app.get('/:key', (req, res) => {
    const key = req.params.key;
    const data = getKey(key, getIp(req));

    if (!data || !data.longLink) {
        return res.status(404).json({
            message: 'Not found'
        })
    }

    return res.redirect(data.longLink)
});

app.get('/:key/report', (req, res) => {
     const key = req.params.key;
     console.log(key)
    const data = getAnalytics(key);
console.log(data)
    if (!data || !data.longLink) {
        return res.status(404).json({
            message: 'Not found'
        })
    }

    res.status(200).json({
        message: 'Fetched link analytics successfully',
        data
    })
})

app.use(function (err, req, res, next) {
    console.log(err)
    return res.status(500).json({
        message: 'Something went wrong. Please try again'
    })
})

app.listen(port, () => {
    ['SIGTERM', 'SIGINT'].forEach((v) => process.on(v, async () => {
        await flush();
        process.exit(0);
    }));
    ['unhandledRejection', 'uncaughtException'].forEach((v) => process.on(v, async () => {
        await flush();
        process.exit(1);
    }))
    console.log(`Server running at http://localhost:${port}`);
});