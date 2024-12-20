import axios from 'axios';


const host = import.meta.env.VITE_URL

export async function deleteDriveAccess(email: string, driveId: string) {
  try {
    return await axios.delete(`${host}/google-drive/drive/access/${email}/${driveId}`, {
      params: {
        email: email,
        driveId: driveId
      }
    });
  } catch (error) {
    console.error('Ошибка при удалении диска:', error);
    throw error;
  }
}

export async function deleteDocsAccess(email: string, fileId: string) {
  try {
    return await axios.delete(`${host}/google-drive/document/access/${email}/${fileId}`, {
      params: {
        email: email,
        driveId: fileId
      }
    });
  } catch (error) {
    console.info('Невозможно удалить наследованное разрешение')
    throw error
  }
}
