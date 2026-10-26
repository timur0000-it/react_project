export const getRequestError = (error, fallback = 'Произошла ошибка') => {
    if (typeof error === 'string') {
        return error;
    }

    const message =
        error?.message ||
        error?.data?.message ||
        error?.response?.data?.message;

    return message || fallback;
};