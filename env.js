const development = {
    BASE_URL: 'development',
}

const production = {
    BASE_URL: 'production',
}

const env = process.env.NODE_ENV === 'development' ? development : production

Object.keys(env).forEach((key) => (env[key] = JSON.stringify(env[key])))

module.exports = env
