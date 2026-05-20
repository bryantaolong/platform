/**
 * 从IP地址获取地理位置信息
 * @param ip IP地址
 * @returns 地理位置，如果无法获取则返回'Unknown'
 */
export async function getLocationFromIp(ip: string): Promise<string> {
  try {
    // 检查是否为 localhost 或无效 IP
    if (!ip || ip === 'Unknown') {
      return 'Unknown'
    }

    // 检查是否为本地地址
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('0:') || ip.startsWith('fe80') || ip.startsWith('fc00')) {
      return 'Local'
    }

    // 尝试多个IP地理位置查询服务以提高成功率，特别是对IPv6的支持
    const services = [
      // 首选：免费且支持IPv6的服务
      `https://ipapi.co/${ip}/json/`,
      // 备选：ip-api服务（支持中文）
      `http://ip-api.com/json/${ip}?lang=zh-CN`,
      // 最后的备选：搜狐（可能不完全支持IPv6）
      `http://ip.sohu.com/api.php?ip=${ip}`
    ]

    for (const serviceUrl of services) {
      try {
        // 添加请求超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

        const response = await fetch(serviceUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (compatible; IP Location Lookup)'
          }
        });
        clearTimeout(timeoutId);

        if (!response.ok) continue

        const data = await response.json();

        // 根据不同服务的响应格式提取位置信息
        if (serviceUrl.includes('ipapi.co')) {
          if (data.error) {
            console.debug(`ipapi.co error for ${ip}:`, data.reason || 'Unknown error');
            continue;
          }
          if (data.country_name || data.city) {
            const locationParts = []
            if (data.city) locationParts.push(data.city)
            if (data.region) locationParts.push(data.region)
            if (data.country_name) locationParts.push(data.country_name)
            return locationParts.join(', ') || 'Unknown'
          }
        } else if (serviceUrl.includes('ip-api.com')) {
          if (data.status === 'fail') {
            console.debug(`ip-api.com error for ${ip}:`, data.message || 'Unknown error');
            continue;
          }
          if (data.country || data.city) {
            const locationParts = []
            if (data.city) locationParts.push(data.city)
            if (data.regionName) locationParts.push(data.regionName)
            if (data.country) locationParts.push(data.country)
            return locationParts.join(', ') || 'Unknown'
          }
        } else if (serviceUrl.includes('sohu.com')) {
          if (data.city) {
            return `${data.city}${data.province ? ', ' + data.province : ''}` || 'Unknown'
          }
        }
      } catch (serviceError: any) {
        if (serviceError.name === 'AbortError') {
          console.debug(`IP location service timeout: ${serviceUrl}`);
        } else {
          console.debug(`IP location service failed: ${serviceUrl}`, serviceError.message || serviceError);
        }
        continue; // 尝试下一个服务
      }
    }

    return 'Unknown'
  } catch (error) {
    console.error('Failed to get location from IP:', error)
    return 'Unknown'
  }
}

/**
 * 判断是否为IPv6地址
 * @param ip IP地址
 * @returns 是否为IPv6地址
 */
export function isIPv6(ip: string): boolean {
  if (!ip) return false

  // 更精确的IPv6检测正则表达式
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
  return ipv6Regex.test(ip.trim()) || ip.includes(':')
}