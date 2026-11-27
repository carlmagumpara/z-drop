import axios from '@/shared/axios';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async data => {
  const room_id = uuidv4();

  const response = await axios.post('', {
    ...data,
    room_id,
    action: 'create-room',
  });

  return response.data.data;
};

export const getMessages = async room_id => {
  const response = await axios.get('', {
    params: { action: 'messages', room_id },
  });

  return response.data.data;
};
