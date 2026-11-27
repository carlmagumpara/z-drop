import axios from '@/shared/axios';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async data => {
  const room_id = uuidv4();

  const response = await axios.post('/create-room', {
    ...data,
    room_id,
  });

  return response.data.data;
};

export const getMessages = async room_id => {
  const response = await axios.get(`/messages/${room_id}`);

  return response.data.data;
};
