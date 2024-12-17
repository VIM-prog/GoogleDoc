import axios from 'axios';
const drives = axios.get('http://localhost:3001/google-drive/drives');

export default drives;
