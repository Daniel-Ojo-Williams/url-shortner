const { createWriteStream, writeFileSync, appendFile, appendFileSync } = require('fs');
const fs = require('fs/promises');
const path = require('path')

let DB = new Map();
const dbPath = path.join(__dirname, "./db.json");

async function loadDB() {
    try {
        const db = await fs.readFile(dbPath, { encoding: "utf-8" });
        DB = new Map(Object.entries(JSON.parse(db)));
    } catch (error) {
        await fs.writeFile(dbPath, `{}`);
    }
}

async function flush() {
    await fs.writeFile(dbPath, JSON.stringify(Object.fromEntries(DB), null, 2), 'utf-8')
    console.log('\nDB Flushed');
}

const keys = new Set();

async function shorten(longLink) {
    let key = generateKey();

    while (keys.has(key)) {
        key = generateKey();
    }

    keys.add(key);

    const data = {
        id: crypto.randomUUID(),
        longLink,
        createdAt: new Date(),
        clicks: 0,
        analytics: []
    }

    DB.set(key, data);

    return key;
}

function generateKey(length = 6) {
    const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const letters = '1234567890';
    const combs = upperCaseChars + lowerCaseChars + letters;

    const a = [];
    for (let i = length; i > 0; i--) {
        const position = Math.floor(Math.random() * combs.length);
        const value = combs[position]
        a.push(value)
    }
    return a.join("");
}

function getKey(key, ip) {
    if (!DB.has(key)) return null;
console.log(ip)
    const data = DB.get(key);
    data.clicks++;
    data.analytics.push({ ip, date: new Date() })

    return data;
}

function getAnalytics(key) {
    return DB.get(key)
}

loadDB();

module.exports = {
    shorten, generateKey, getKey, flush, getAnalytics
}