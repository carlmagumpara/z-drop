import axios from 'axios';
import { api_url } from './config';

const instance = axios.create({
  baseURL: api_url,
});

instance.interceptors.request.use(async config => {
  return config;
}, error => {
  return Promise.reject(error);
});

instance.interceptors.response.use(response => {
  return response;
}, error => {
  return Promise.reject(error);
});

export default instance;
