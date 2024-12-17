import axios from 'axios';

const host = import.meta.env.VITE_URL

export async function getDrives() {
  try {
    return await axios.get(`${host}/google-drive/drives`);
  } catch (error) {
    console.error('Ошибка при получении дисков:', error);
    throw error;
  }
}

export async function getDocuments() {
  try {
    return await axios.get(`${host}/google-drive/documents`);
  } catch (error) {
    console.error('Ошибка при получении документов:', error);
    throw error;
  }
}
