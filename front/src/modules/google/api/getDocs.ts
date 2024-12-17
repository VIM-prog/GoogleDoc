import axios from 'axios';
const docs = axios.get('http://localhost:3001/google-drive/documents');
export default docs;
