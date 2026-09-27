import Toast from '@/web/Toast';

const NotificationHelper = {
  // SUCCESS NOTIFICATION
  showSuccess: (message = 'Task Completed Successfully!', onHide = null) => {
    Toast.show({
      type: 'success',
      text1: 'Success ✅',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
      onHide: onHide // Support navigation or extra logic after toast disappears
    });
  },

  // FAILURE NOTIFICATION
  showError: (message = 'Something went wrong. Please try again.', onHide = null) => {
    Toast.show({
      type: 'error',
      text1: 'Error ❌',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
      onHide: onHide
    });
  }
};

export default NotificationHelper;
