let configCache = null

export async function getConfig() {
  const res = await fetch('/config.json?v=' + Date.now())
   return await res.json()
}