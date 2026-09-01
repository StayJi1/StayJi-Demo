var mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

// Ensure a database name is present in the connection URI. If the env value
// doesn't include an explicit database path, default to the 'pgfinder'
// database so the demo backend connects to the intended demo dataset.
const buildDatabaseUri = (raw = '') => {
    if (!raw) return raw
    // If the URI already contains an explicit database path (e.g. /pgfinder), leave unchanged.
    if (/\/[^\/?]+(\?|$)/.test(raw)) return raw
    // If the URI has '/?' (no path, but a query string), replace '/?' with '/pgfinder?'.
    if (raw.includes('/?')) return raw.replace('/?', '/pgfinder?')
    // If the URI has a query string but no path, insert '/pgfinder' before the query.
    if (raw.includes('?')) return raw.replace(/\?/, '/pgfinder?')
    // If the URI ends with a slash, append the DB name, otherwise add '/pgfinder'.
    if (raw.endsWith('/')) return raw + 'pgfinder'
    return raw + '/pgfinder'
}

const dbUri = buildDatabaseUri(process.env.DATABASE)

mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log("MongoDB connected");
})
.catch((err) => {
    console.error("MongoDB connection error:", err && err.message ? err.message : err);
});

module.exports = mongoose;