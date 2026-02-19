// Simple toast implementation to replace sonner
export const toast = {
  success: (message: string) => {
    console.log('✅ Success:', message);
    // In a real implementation, this would show a toast notification
    // For now, we'll just log and could show browser alert if needed
    if (typeof window !== 'undefined') {
      // Could implement a simple toast notification here
      // For now, just use console.log
    }
  },
  
  error: (message: string) => {
    console.error('❌ Error:', message);
    if (typeof window !== 'undefined') {
      // Could implement a simple toast notification here
      // For now, just use console.error
    }
  },
  
  info: (message: string) => {
    console.info('ℹ️ Info:', message);
    if (typeof window !== 'undefined') {
      // Could implement a simple toast notification here
      // For now, just use console.info
    }
  },
  
  warning: (message: string) => {
    console.warn('⚠️ Warning:', message);
    if (typeof window !== 'undefined') {
      // Could implement a simple toast notification here
      // For now, just use console.warn
    }
  }
};