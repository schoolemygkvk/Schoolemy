import { message, notification } from 'antd';



const notificationConfig = {
  duration: 3,
  top: 24,
  maxCount: 3,
};

export const notify = {

  success: (title, description = null) => {
    if (description) {
      notification.success({
        message: title,
        description,
        ...notificationConfig,
      });
    } else {
      message.success({
        content: title,
        duration: notificationConfig.duration,
      });
    }
  },

  error: (title, description = null) => {
    if (description) {
      notification.error({
        message: title,
        description,
        ...notificationConfig,
      });
    } else {
      message.error({
        content: title,
        duration: notificationConfig.duration,
      });
    }
  },

  info: (title, description = null) => {
    if (description) {
      notification.info({
        message: title,
        description,
        ...notificationConfig,
      });
    } else {
      message.info({
        content: title,
        duration: notificationConfig.duration,
      });
    }
  },


  warning: (title, description = null) => {
    if (description) {
      notification.warning({
        message: title,
        description,
        ...notificationConfig,
      });
    } else {
      message.warning({
        content: title,
        duration: notificationConfig.duration,
      });
    }
  },


  loading: (title) => {
    const hide = message.loading({
      content: title,
      duration: 0,
    });
    return hide;
  },
};


export const handleErrorNotification = (error, fallbackMessage = 'An error occurred') => {
  let errorMessage = fallbackMessage;
  let errorDescription = null;

  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
    errorDescription = error.response.data.error;
  } else if (error.response?.data?.error) {
    errorMessage = error.response.data.error;
  } else if (error.message) {
    errorMessage = error.message;
  }

  notify.error(errorMessage, errorDescription);
};


export const handleSuccessNotification = (response, fallbackMessage = 'Success') => {
  let successMessage = fallbackMessage;

  if (response?.data?.message) {
    successMessage = response.data.message;
  } else if (response?.message) {
    successMessage = response.message;
  }

  notify.success(successMessage);
};

export default notify;
