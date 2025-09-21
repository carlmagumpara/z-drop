import axios from '@/shared/axios';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async data => {
  const room_id = uuidv4();
  try {
    const response = await axios.post('/create-room', {
      ...data,
      room_id
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};