export interface ChatMessagePayload {
  chatBaseId: number;
  message: string;
}

export const sendChatMessage = async (payload: ChatMessagePayload, onChunk: (chunk: string) => void): Promise<void> => {
  try {
    const token = localStorage.getItem('jwtToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/mcp/chat', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get readable stream from response.');
    }

    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        onChunk(chunk);
      }
    }
  } catch (error) {
    console.error('Error in sendChatMessage streaming:', error);
    throw error; // Re-throw to be caught by the component
  }
};