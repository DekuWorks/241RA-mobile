/**
 * WebSocket Diagnostics Utility
 * Helps diagnose and resolve WebSocket connection issues
 */

export interface WebSocketDiagnosticInfo {
  connectionState: string;
  lastError?: string;
  errorCode?: number;
  retryCount: number;
  isHealthy: boolean;
  timestamp: string;
}

export class WebSocketDiagnostics {
  private static retryCount = 0;
  private static lastError: string | null = null;
  private static lastErrorCode: number | null = null;

  static recordError(error: string, code?: number): void {
    this.lastError = error;
    this.lastErrorCode = code || null;
    this.retryCount++;
    
    console.error('WebSocket Error Recorded:', {
      error,
      code,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString()
    });
  }

  static recordSuccess(): void {
    this.retryCount = 0;
    this.lastError = null;
    this.lastErrorCode = null;
  }

  static getDiagnosticInfo(connectionState: string, isHealthy: boolean): WebSocketDiagnosticInfo {
    return {
      connectionState,
      lastError: this.lastError || undefined,
      errorCode: this.lastErrorCode || undefined,
      retryCount: this.retryCount,
      isHealthy,
      timestamp: new Date().toISOString()
    };
  }

  static getErrorRecommendations(errorCode?: number): string[] {
    const recommendations: string[] = [];

    switch (errorCode) {
      case 1006:
        recommendations.push(
          'WebSocket 1006: Abnormal closure detected',
          '• Check your internet connection',
          '• Verify the server is running and accessible',
          '• Try refreshing the app',
          '• Check if your network blocks WebSocket connections'
        );
        break;
      case 1000:
        recommendations.push(
          'WebSocket 1000: Normal closure',
          '• Connection closed normally',
          '• This is usually not an error'
        );
        break;
      case 1001:
        recommendations.push(
          'WebSocket 1001: Going away',
          '• Server is shutting down or restarting',
          '• Wait for server to come back online'
        );
        break;
      case 1002:
        recommendations.push(
          'WebSocket 1002: Protocol error',
          '• Communication protocol mismatch',
          '• Check server configuration'
        );
        break;
      case 1003:
        recommendations.push(
          'WebSocket 1003: Unsupported data',
          '• Data format not supported',
          '• Check client-server compatibility'
        );
        break;
      case 1004:
        recommendations.push(
          'WebSocket 1004: Reserved',
          '• Reserved error code',
          '• Contact support if this persists'
        );
        break;
      case 1005:
        recommendations.push(
          'WebSocket 1005: No status code',
          '• No status code provided',
          '• Usually indicates network issues'
        );
        break;
      case 1007:
        recommendations.push(
          'WebSocket 1007: Invalid frame payload data',
          '• Data format error',
          '• Check data being sent'
        );
        break;
      case 1008:
        recommendations.push(
          'WebSocket 1008: Policy violation',
          '• Server policy violation',
          '• Check server configuration'
        );
        break;
      case 1009:
        recommendations.push(
          'WebSocket 1009: Message too big',
          '• Message size exceeds limit',
          '• Reduce message size'
        );
        break;
      case 1010:
        recommendations.push(
          'WebSocket 1010: Missing extension',
          '• Required extension not available',
          '• Check server configuration'
        );
        break;
      case 1011:
        recommendations.push(
          'WebSocket 1011: Internal error',
          '• Server internal error',
          '• Contact server administrator'
        );
        break;
      case 1012:
        recommendations.push(
          'WebSocket 1012: Service restart',
          '• Server is restarting',
          '• Wait for service to come back online'
        );
        break;
      case 1013:
        recommendations.push(
          'WebSocket 1013: Try again later',
          '• Server is busy',
          '• Wait and try again'
        );
        break;
      case 1014:
        recommendations.push(
          'WebSocket 1014: Bad gateway',
          '• Gateway error',
          '• Check server infrastructure'
        );
        break;
      case 1015:
        recommendations.push(
          'WebSocket 1015: TLS handshake failure',
          '• SSL/TLS connection issue',
          '• Check certificate configuration'
        );
        break;
      default:
        recommendations.push(
          'Unknown WebSocket error',
          '• Check network connectivity',
          '• Try refreshing the app',
          '• Contact support if issue persists'
        );
    }

    return recommendations;
  }

  static logDiagnostics(): void {
    const info = this.getDiagnosticInfo('unknown', false);
    console.log('WebSocket Diagnostics:', info);
    
    if (info.errorCode) {
      const recommendations = this.getErrorRecommendations(info.errorCode);
      console.log('Recommendations:', recommendations);
    }
  }
}

