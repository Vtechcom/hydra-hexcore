import crypto from 'crypto';

export const generateConsumerKey = () => {
    return crypto.randomBytes(16).toString('hex');
};
