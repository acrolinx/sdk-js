export const checkEndpointReachable = async (url: string, headers: Record<string, string>): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers,
    });
    return response.ok;
  } catch (error) {
    console.warn('Telemetry endpoint not reachable:', error);
    return false;
  }
};
