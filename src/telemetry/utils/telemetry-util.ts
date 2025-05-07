export const checkEndpointReachable = async (url: string, headers: Record<string, string>): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-protobuf',
      },
      body: '',
    });
    return response.ok;
  } catch (error) {
    console.warn('Telemetry endpoint not reachable:', error);
    return false;
  }
};
